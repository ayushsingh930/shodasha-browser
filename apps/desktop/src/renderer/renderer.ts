/**
 * SHODASHA desktop - renderer UI.
 *
 * Runs inside the sandboxed renderer with context isolation. It renders the
 * browser chrome (toolbar, tab bar, new-tab page, content area) from state
 * pushed by the main process, and sends user commands over the preload bridge.
 *
 * Only the exposed `window.shodasha.browser` API is available; there is no
 * direct Node.js or filesystem access.
 */

import {
  PRIVACY_CENTER_URL,
  isBlankTabUrl,
  isInternalPageUrl,
  type BrowserState,
  type PrivacyCenterState,
  type ShieldPanelState,
  type TabViewState,
} from '../shared/browserState.js';
import {
  shortcutActionFor,
  type ShortcutAction,
  type ShortcutInput,
} from '../shared/shortcuts.js';
import type {
  ShieldFilterEvent,
  ShieldMode,
} from '@shodasha/core';

/** The bridge surface exposed by the preload script. */
interface ShodashaBridge {
  platform: string;
  versions: { electron: string; chrome: string; node: string };
  browser: {
    getState(): Promise<BrowserState>;
    submitAddress(input: string): Promise<void>;
    goBack(): Promise<void>;
    goForward(): Promise<void>;
    reload(): Promise<void>;
    hardReload(): Promise<void>;
    stop(): Promise<void>;
    newTab(): Promise<string>;
    closeTab(id: string): Promise<void>;
    activateTab(id: string): Promise<void>;
    reloadTab(id: string): Promise<void>;
    duplicateTab(id: string): Promise<string>;
    closeOtherTabs(id: string): Promise<void>;
    closeTabsToRight(id: string): Promise<void>;
    reopenClosedTab(): Promise<string>;
    nextTab(): Promise<void>;
    prevTab(): Promise<void>;
    onStateChanged(callback: (state: BrowserState) => void): () => void;
    onFocusAddressBar(callback: () => void): () => void;
  };
  shield: {
    getState(): Promise<ShieldPanelState>;
    setEnabled(enabled: boolean): Promise<void>;
    setMode(mode: ShieldMode): Promise<void>;
    setSiteSetting(
      site: string,
      setting: { enabled?: boolean; mode?: ShieldMode },
    ): Promise<void>;
    toggleAllowlist(site: string): Promise<void>;
    subscribe(): void;
    unsubscribe(): void;
    onPanelChanged(callback: (state: ShieldPanelState) => void): () => void;
  };
  privacy: {
    getState(): Promise<PrivacyCenterState>;
    resetStatistics(): Promise<void>;
    getAllowlist(): Promise<string[]>;
    addToAllowlist(site: string): Promise<{ ok: boolean; reason?: string }>;
    removeFromAllowlist(site: string): Promise<{ ok: boolean; reason?: string }>;
  };
}

declare global {
  interface Window {
    shodasha?: ShodashaBridge;
  }
}

// ----------------------------------------------------------------------
// DOM references
// ----------------------------------------------------------------------
const backButton = document.querySelector<HTMLButtonElement>('#btn-back');
const forwardButton = document.querySelector<HTMLButtonElement>('#btn-forward');
const reloadButton = document.querySelector<HTMLButtonElement>('#btn-reload');
const stopButton = document.querySelector<HTMLButtonElement>('#btn-stop');
const addressInput = document.querySelector<HTMLInputElement>('#address-bar');
const securityIndicator = document.querySelector<HTMLElement>('#security');
const newTabButton = document.querySelector<HTMLButtonElement>('#btn-new-tab');
const menuButton = document.querySelector<HTMLButtonElement>('#btn-menu');
const tabBar = document.querySelector<HTMLElement>('#tab-bar');
const contentFrame = document.querySelector<HTMLElement>('#content-frame');
const progressBar = document.querySelector<HTMLElement>('#progress');
const ntpPage = document.querySelector<HTMLElement>('#new-tab-page');
const ntpSearch = document.querySelector<HTMLInputElement>('#ntp-search');
const tabContextMenu = document.querySelector<HTMLElement>('#tab-context-menu');

// Shield UI elements.
const shieldButton = document.querySelector<HTMLButtonElement>('#btn-shield');
const shieldPanel = document.querySelector<HTMLElement>('#shield-panel');
const siteSettingsPanel = document.querySelector<HTMLElement>('#site-settings-panel');
const shieldProtection = document.querySelector<HTMLElement>('#shield-protection');
const shieldStatEvaluated = document.querySelector<HTMLElement>('#shield-stat-evaluated');
const shieldStatFiltered = document.querySelector<HTMLElement>('#shield-stat-filtered');
const shieldStatTrackers = document.querySelector<HTMLElement>('#shield-stat-trackers');
const shieldStatAds = document.querySelector<HTMLElement>('#shield-stat-ads');
const shieldMode = document.querySelector<HTMLSelectElement>('#shield-mode');
const shieldToggle = document.querySelector<HTMLButtonElement>('#shield-toggle');
const shieldSiteSettingsButton = document.querySelector<HTMLButtonElement>('#shield-site-settings');
const siteSettingsClose = document.querySelector<HTMLButtonElement>('#site-settings-close');
const siteSettingsCurrent = document.querySelector<HTMLElement>('#site-settings-current');
const siteSettingsShield = document.querySelector<HTMLButtonElement>('#site-settings-shield');
const siteSettingsMode = document.querySelector<HTMLSelectElement>('#site-settings-mode');
const siteSettingsAllowlist = document.querySelector<HTMLButtonElement>('#site-settings-allowlist');
const shieldSiteStats = document.querySelector<HTMLElement>('#shield-site-stats');
const shieldRecent = document.querySelector<HTMLElement>('#shield-recent');
const shieldRecentList = document.querySelector<HTMLUListElement>('#shield-recent-list');
const shieldCurrentSite = document.querySelector<HTMLElement>('#shield-current-site');
const shieldPrivacyCenterButton = document.querySelector<HTMLButtonElement>('#shield-privacy-center');

// Site-settings panel elements.
const siteSettingsStatEvaluated = document.querySelector<HTMLElement>('#site-settings-stat-evaluated');
const siteSettingsStatFiltered = document.querySelector<HTMLElement>('#site-settings-stat-filtered');
const siteSettingsStatTrackers = document.querySelector<HTMLElement>('#site-settings-stat-trackers');
const siteSettingsStatAds = document.querySelector<HTMLElement>('#site-settings-stat-ads');
const siteSettingsShieldAction = document.querySelector<HTMLButtonElement>('#site-settings-shield-action');
const siteSettingsAllowlistAction = document.querySelector<HTMLButtonElement>('#site-settings-allowlist-action');

// Privacy Center elements.
const privacyCenter = document.querySelector<HTMLElement>('#privacy-center');
const privacyStatusBadge = document.querySelector<HTMLElement>('#privacy-status-badge');
const privacyStatusNote = document.querySelector<HTMLElement>('#privacy-status-note');
const privacyError = document.querySelector<HTMLElement>('#privacy-error');
const privacyOverviewShield = document.querySelector<HTMLElement>('#privacy-overview-shield');
const privacyOverviewFiltering = document.querySelector<HTMLElement>('#privacy-overview-filtering');
const privacyOverviewMode = document.querySelector<HTMLElement>('#privacy-overview-mode');
const privacyStatEvaluated = document.querySelector<HTMLElement>('#privacy-stat-evaluated');
const privacyStatAllowed = document.querySelector<HTMLElement>('#privacy-stat-allowed');
const privacyStatBlocked = document.querySelector<HTMLElement>('#privacy-stat-blocked');
const privacyStatAds = document.querySelector<HTMLElement>('#privacy-stat-ads');
const privacyStatTrackers = document.querySelector<HTMLElement>('#privacy-stat-trackers');
const privacySiteLine = document.querySelector<HTMLElement>('#privacy-site-line');
const privacyGlobalToggle = document.querySelector<HTMLButtonElement>('#privacy-global-toggle');
const privacyMode = document.querySelector<HTMLSelectElement>('#privacy-mode');
const privacyResetStats = document.querySelector<HTMLButtonElement>('#privacy-reset-stats');
const privacySite = document.querySelector<HTMLElement>('#privacy-site');
const privacySiteProtection = document.querySelector<HTMLElement>('#privacy-site-protection');
const privacySiteToggle = document.querySelector<HTMLButtonElement>('#privacy-site-toggle');
const privacyListsRules = document.querySelector<HTMLElement>('#privacy-lists-rules');
const privacyListsUpdates = document.querySelector<HTMLElement>('#privacy-lists-updates');
const privacyLists = document.querySelector<HTMLUListElement>('#privacy-lists');
const privacyAllowlistForm = document.querySelector<HTMLFormElement>('#privacy-allowlist-add');
const privacyAllowlistInput = document.querySelector<HTMLInputElement>('#privacy-allowlist-input');
const privacyAllowlistFeedback = document.querySelector<HTMLElement>('#privacy-allowlist-feedback');
const privacyAllowlistList = document.querySelector<HTMLUListElement>('#privacy-allowlist-list');
const privacyRecentList = document.querySelector<HTMLUListElement>('#privacy-recent-list');

// ----------------------------------------------------------------------
// State
// ----------------------------------------------------------------------
let currentState: BrowserState = {
  tabs: [],
  activeTabId: null,
  canReopenClosedTab: false,
};
let addressEditing = false;
let contextTabId: string | null = null;
let lastActiveTabId: string | null = null;
let shieldState: ShieldPanelState | null = null;
let shieldUnsubPanel: (() => void) | null = null;

const bridge = window.shodasha?.browser;
const shieldBridge = window.shodasha?.shield;
const privacyBridge = window.shodasha?.privacy;
let privacyCenterActive = false;
let privacyUnsub: (() => void) | null = null;
let privacyState: PrivacyCenterState | null = null;

// ----------------------------------------------------------------------
// Toolbar rendering
// ----------------------------------------------------------------------
function renderToolbar(state: BrowserState): void {
  const active = state.tabs.find((t) => t.id === state.activeTabId) ?? null;

  if (backButton !== null) {
    backButton.disabled = active?.canGoBack !== true;
  }
  if (forwardButton !== null) {
    forwardButton.disabled = active?.canGoForward !== true;
  }
  if (reloadButton !== null) {
    reloadButton.hidden = active?.loading === true;
  }
  if (stopButton !== null) {
    stopButton.hidden = active?.loading !== true;
  }
  if (progressBar !== null) {
    progressBar.classList.toggle('active', active?.loading === true);
  }

  // Only update the address bar when the user is not typing in it.
  if (addressInput !== null && !addressEditing) {
    addressInput.value = active?.url ?? '';
    addressInput.placeholder = 'Search or enter an address';
  }

  renderSecurity(active);
}

function renderSecurity(active: TabViewState | null): void {
  if (securityIndicator === null) {
    return;
  }
  if (active === null) {
    securityIndicator.className = 'secure-state state-none';
    securityIndicator.title = '';
    securityIndicator.textContent = '';
    return;
  }
  switch (active.securityState) {
    case 'secure':
      securityIndicator.className = 'secure-state state-secure';
      securityIndicator.title = 'Connection is secure (HTTPS)';
      securityIndicator.textContent = 'Secure';
      break;
    case 'insecure':
      securityIndicator.className = 'secure-state state-insecure';
      securityIndicator.title = 'Connection is not secure (HTTP)';
      securityIndicator.textContent = 'Not secure';
      break;
    case 'internal':
      securityIndicator.className = 'secure-state state-internal';
      securityIndicator.title = 'SHODASHA internal page';
      securityIndicator.textContent = 'SHODASHA';
      break;
    default:
      securityIndicator.className = 'secure-state state-none';
      securityIndicator.title = '';
      securityIndicator.textContent = '';
  }
}

// ----------------------------------------------------------------------
// Tab bar rendering
// ----------------------------------------------------------------------
function renderTabs(state: BrowserState): void {
  if (tabBar === null) {
    return;
  }
  tabBar.setAttribute('role', 'tablist');
  // Rebuild only the tab strip; this is cheap and avoids stale bindings.
  tabBar.replaceChildren();

  for (const tab of state.tabs) {
    tabBar.appendChild(buildTabElement(tab));
  }

  // Ensure exactly one scroll spacer stays at the end.
  const spacer = document.createElement('div');
  spacer.className = 'tab-spacer';
  tabBar.appendChild(spacer);
}

function buildTabElement(tab: TabViewState): HTMLElement {
  const el = document.createElement('div');
  el.className =
    'tab' +
    (tab.active ? ' active' : '') +
    (tab.showErrorPage ? ' errored' : '');
  el.setAttribute('role', 'tab');
  el.setAttribute('aria-selected', tab.active ? 'true' : 'false');
  el.tabIndex = 0;
  el.dataset.tabId = tab.id;
  el.title = tab.title || tab.url || 'New tab';

  const favicon = document.createElement('span');
  favicon.className = 'tab-favicon';
  favicon.setAttribute('aria-hidden', 'true');
  if (tab.showErrorPage) {
    favicon.textContent = '!';
  } else if (tab.favicon) {
    const img = document.createElement('img');
    img.src = tab.favicon;
    img.alt = '';
    img.loading = 'lazy';
    favicon.replaceChildren(img);
  } else {
    favicon.textContent = '\u25cb';
  }
  el.appendChild(favicon);

  const title = document.createElement('span');
  title.className = 'tab-title';
  title.textContent = tab.title || tab.url || 'New tab';
  el.appendChild(title);

  if (tab.loading) {
    el.classList.add('loading');
  }

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'tab-close';
  close.textContent = '\u00d7';
  close.title = 'Close tab';
  close.setAttribute('aria-label', 'Close tab');
  close.addEventListener('click', (event) => {
    event.stopPropagation();
    void bridge?.closeTab(tab.id);
  });
  el.appendChild(close);

  el.addEventListener('click', () => {
    void bridge?.activateTab(tab.id);
  });
  el.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      void bridge?.activateTab(tab.id);
    }
  });
  el.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    openTabContextMenu(tab.id, event.clientX, event.clientY);
  });

  return el;
}

// ----------------------------------------------------------------------
// Content area
// ----------------------------------------------------------------------
function renderContent(state: BrowserState): void {
  if (contentFrame === null) {
    return;
  }
  const active = state.tabs.find((t) => t.id === state.activeTabId) ?? null;
  const internal =
    active !== null && isInternalPageUrl(active.url) && !active.showErrorPage;
  const blank =
    active !== null &&
    isBlankTabUrl(active.url) &&
    !active.showErrorPage &&
    !internal;

  if (blank) {
    ntpPage?.removeAttribute('hidden');
  } else {
    ntpPage?.setAttribute('hidden', '');
  }

  if (privacyCenter !== null) {
    if (internal) {
      privacyCenter.removeAttribute('hidden');
    } else {
      privacyCenter.setAttribute('hidden', '');
    }
  }
  syncPrivacySubscription(internal);

  if (active === null) {
    contentFrame.classList.add('empty');
    contentFrame.replaceChildren();
    return;
  }

  if (active.showErrorPage && active.error) {
    contentFrame.classList.add('showing-error');
    contentFrame.replaceChildren(buildErrorNotice(active.error));
  } else {
    contentFrame.classList.remove('showing-error');
    // The actual page is rendered by the WebContentsView; nothing to paint.
    contentFrame.replaceChildren();
  }
}

function buildErrorNotice(message: string): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'error-notice';
  const badge = document.createElement('span');
  badge.className = 'error-badge';
  badge.textContent = 'SHODASHA';
  const text = document.createElement('p');
  text.textContent = message;
  wrapper.append(badge, text);
  return wrapper;
}

function maybeFocusNewTab(state: BrowserState): void {
  const active = state.tabs.find((t) => t.id === state.activeTabId) ?? null;
  const blank =
    active !== null && isBlankTabUrl(active.url) && !active.showErrorPage;
  if (active !== null && active.id !== lastActiveTabId && blank) {
    focusNtpSearch();
  }
  lastActiveTabId = active?.id ?? null;
}

function focusNtpSearch(): void {
  if (ntpSearch === null) {
    return;
  }
  ntpSearch.focus();
  ntpSearch.select();
}

// ----------------------------------------------------------------------
// Actions
// ----------------------------------------------------------------------
function submitAddress(value: string): void {
  if (bridge === undefined) {
    return;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return;
  }
  void bridge.submitAddress(trimmed);
}

function submitFromAddressBar(): void {
  if (addressInput === null) {
    return;
  }
  addressEditing = false;
  addressInput.blur();
  submitAddress(addressInput.value);
}

function focusAddressInput(): void {
  if (addressInput === null) {
    return;
  }
  addressEditing = true;
  addressInput.focus();
  addressInput.select();
}

function dispatchShortcut(action: ShortcutAction): void {
  switch (action) {
    case 'new-tab':
      void bridge?.newTab();
      break;
    case 'close-tab':
      if (currentState.activeTabId !== null) {
        void bridge?.closeTab(currentState.activeTabId);
      }
      break;
    case 'reopen-tab':
      void bridge?.reopenClosedTab();
      break;
    case 'next-tab':
      void bridge?.nextTab();
      break;
    case 'prev-tab':
      void bridge?.prevTab();
      break;
    case 'focus-address':
      focusAddressInput();
      break;
    case 'reload':
      void bridge?.reload();
      break;
    case 'hard-reload':
      void bridge?.hardReload();
      break;
  }
}

// ----------------------------------------------------------------------
// Event wiring
// ----------------------------------------------------------------------
function attachToolbarHandlers(): void {
  backButton?.addEventListener('click', () => {
    void bridge?.goBack();
  });
  forwardButton?.addEventListener('click', () => {
    void bridge?.goForward();
  });
  reloadButton?.addEventListener('click', () => {
    void bridge?.reload();
  });
  stopButton?.addEventListener('click', () => {
    void bridge?.stop();
  });
  newTabButton?.addEventListener('click', () => {
    void bridge?.newTab();
  });
  menuButton?.addEventListener('click', toggleMenu);

  addressInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submitFromAddressBar();
    }
  });
  addressInput?.addEventListener('focus', () => {
    addressEditing = true;
    addressInput.select();
  });
  addressInput?.addEventListener('blur', () => {
    addressEditing = false;
    if (currentState.activeTabId !== null) {
      const active = currentState.tabs.find(
        (t) => t.id === currentState.activeTabId,
      );
      if (active !== undefined) {
        addressInput.value = active.url;
      }
    }
  });
}

function attachNtpHandlers(): void {
  ntpSearch?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submitAddress(ntpSearch.value);
      ntpSearch.value = '';
    }
  });
  ntpSearch?.addEventListener('focus', () => {
    ntpSearch.select();
  });
}

function toggleMenu(): void {
  const menu = document.querySelector<HTMLElement>('#menu');
  if (menu === null) {
    return;
  }
  const open = menu.classList.toggle('open');
  menu.hidden = !open;
  if (!open) {
    return;
  }
  // Close on outside click / Escape.
  const close = () => {
    menu.classList.remove('open');
    menu.hidden = true;
    document.removeEventListener('click', close);
    document.removeEventListener('keydown', onEscape);
  };
  const onEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      close();
    }
  };
  setTimeout(() => {
    document.addEventListener('click', close);
    document.addEventListener('keydown', onEscape);
  }, 0);
}

function handleMenuAction(action: string): void {
  switch (action) {
    case 'new-tab':
      void bridge?.newTab();
      break;
    case 'close-tab':
      if (currentState.activeTabId !== null) {
        void bridge?.closeTab(currentState.activeTabId);
      }
      break;
    case 'reload':
      void bridge?.reload();
      break;
    case 'reopen-closed':
      void bridge?.reopenClosedTab();
      break;
    case 'privacy-center':
      openPrivacyCenter();
      break;
  }
  const menu = document.querySelector<HTMLElement>('#menu');
  if (menu !== null) {
    menu.classList.remove('open');
    menu.hidden = true;
  }
}

function attachMenuHandlers(): void {
  const menu = document.querySelector<HTMLElement>('#menu');
  if (menu === null) {
    return;
  }
  menu.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    const action = target?.dataset.action;
    if (action !== undefined) {
      handleMenuAction(action);
    }
  });
}

// ----------------------------------------------------------------------
// SHODASHA Shield panel
// ----------------------------------------------------------------------
function toggleShieldPanel(): void {
  if (shieldPanel?.hidden === true) {
    openShieldPanel();
  } else {
    closeShieldPanels();
  }
}

function openShieldPanel(): void {
  if (shieldPanel === null) {
    return;
  }
  if (siteSettingsPanel !== null) {
    siteSettingsPanel.hidden = true;
  }
  shieldPanel.hidden = false;
  shieldButton?.setAttribute('aria-expanded', 'true');
  shieldUnsubPanel = shieldBridge?.onPanelChanged(applyShieldState) ?? null;
  shieldBridge?.subscribe();
  void shieldBridge?.getState().then(applyShieldState);
  setTimeout(() => {
    document.addEventListener('click', onShieldOutsideClick);
    document.addEventListener('keydown', onShieldEscape);
  }, 0);
}

function closeShieldPanels(): void {
  if (shieldPanel !== null) {
    shieldPanel.hidden = true;
  }
  if (siteSettingsPanel !== null) {
    siteSettingsPanel.hidden = true;
  }
  shieldButton?.setAttribute('aria-expanded', 'false');
  shieldUnsubPanel?.();
  shieldUnsubPanel = null;
  shieldBridge?.unsubscribe();
  document.removeEventListener('click', onShieldOutsideClick);
  document.removeEventListener('keydown', onShieldEscape);
}

function onShieldOutsideClick(event: MouseEvent): void {
  const target = event.target as Node | null;
  const actions = document.querySelector<HTMLElement>('.toolbar-actions');
  if (actions !== null && target !== null && actions.contains(target)) {
    return;
  }
  closeShieldPanels();
}

function onShieldEscape(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    closeShieldPanels();
  }
}

function applyShieldState(state: ShieldPanelState): void {
  shieldState = state;
  shieldButton?.classList.toggle('active', state.enabled);
  shieldButton?.classList.toggle('inactive', !state.enabled);
  if (shieldProtection !== null) {
    shieldProtection.textContent = state.enabled ? 'ON' : 'OFF';
    shieldProtection.className = `shield-badge ${
      state.enabled ? 'shield-badge-on' : 'shield-badge-off'
    }`;
  }
  setText(shieldStatEvaluated, state.stats.requestsEvaluated);
  setText(shieldStatFiltered, state.stats.requestsBlocked);
  setText(shieldStatTrackers, state.stats.trackersBlocked);
  setText(shieldStatAds, state.stats.adsFiltered);
  setText(shieldCurrentSite, state.currentSite ?? '\u2014');
  renderShieldSiteStats(state);
  renderShieldRecent(state);
  if (shieldMode !== null) {
    shieldMode.value = state.mode;
  }
  if (shieldToggle !== null) {
    shieldToggle.textContent = state.enabled ? 'Shield ON' : 'Shield OFF';
    shieldToggle.setAttribute('aria-pressed', String(state.enabled));
    shieldToggle.classList.toggle('shield-toggle-off', !state.enabled);
  }
  if (shieldSiteSettingsButton !== null) {
    shieldSiteSettingsButton.disabled = state.currentSite === null;
  }
  renderSiteSettings(state);
  if (privacyCenterActive) {
    void refreshPrivacyCenter();
  }
}

function renderShieldSiteStats(state: ShieldPanelState): void {
  const stats = state.siteStats;
  if (stats === null) {
    setText(shieldSiteStats, '\u2014');
    return;
  }
  setText(
    shieldSiteStats,
    `${String(stats.requestsEvaluated)} evaluated \u00b7 ${String(stats.requestsBlocked)} filtered`,
  );
}

function renderShieldRecent(state: ShieldPanelState): void {
  if (shieldRecent === null || shieldRecentList === null) {
    return;
  }
  const events = state.recentEvents;
  if (events.length === 0) {
    shieldRecent.hidden = true;
    shieldRecentList.replaceChildren();
    return;
  }
  shieldRecent.hidden = false;
  const fragment = document.createDocumentFragment();
  for (const event of events) {
    const item = document.createElement('li');
    item.className = `shield-event shield-event-${event.action}`;
    const label = document.createElement('span');
    label.className = 'shield-event-label';
    label.textContent = event.action === 'block' ? 'Blocked' : 'Allowed';
    const detail = document.createElement('span');
    detail.className = 'shield-event-detail';
    detail.textContent = `${event.category} \u00b7 ${event.resourceType} \u00b7 ${event.hostname}`;
    item.append(label, detail);
    fragment.append(item);
  }
  shieldRecentList.replaceChildren(fragment);
}

function renderSiteSettings(state: ShieldPanelState): void {
  if (state.currentSite === null) {
    setText(siteSettingsCurrent, '\u2014');
    setText(siteSettingsStatEvaluated, 0);
    setText(siteSettingsStatFiltered, 0);
    setText(siteSettingsStatTrackers, 0);
    setText(siteSettingsStatAds, 0);
    if (siteSettingsShieldAction !== null) {
      siteSettingsShieldAction.disabled = true;
    }
    if (siteSettingsAllowlistAction !== null) {
      siteSettingsAllowlistAction.disabled = true;
    }
    return;
  }
  setText(siteSettingsCurrent, state.currentSite);
  if (siteSettingsShield !== null) {
    siteSettingsShield.textContent = state.siteEnabled ? 'ON' : 'OFF';
    siteSettingsShield.setAttribute('aria-pressed', String(state.siteEnabled));
  }
  if (siteSettingsMode !== null) {
    siteSettingsMode.value = state.siteMode;
  }
  if (siteSettingsAllowlist !== null) {
    siteSettingsAllowlist.textContent = state.siteAllowlisted ? 'ON' : 'OFF';
    siteSettingsAllowlist.setAttribute('aria-pressed', String(state.siteAllowlisted));
  }
  const stats = state.siteStats;
  setText(siteSettingsStatEvaluated, stats?.requestsEvaluated ?? 0);
  setText(siteSettingsStatFiltered, stats?.requestsBlocked ?? 0);
  setText(siteSettingsStatTrackers, stats?.trackersBlocked ?? 0);
  setText(siteSettingsStatAds, stats?.adsFiltered ?? 0);
  if (siteSettingsShieldAction !== null) {
    siteSettingsShieldAction.disabled = false;
    siteSettingsShieldAction.textContent = state.siteEnabled
      ? 'Turn Shield Off'
      : 'Turn Shield On';
  }
  if (siteSettingsAllowlistAction !== null) {
    siteSettingsAllowlistAction.disabled = false;
    siteSettingsAllowlistAction.textContent = state.siteAllowlisted
      ? 'Remove from Allowlist'
      : 'Add to Allowlist';
  }
}

function setText(element: HTMLElement | null, value: number | string): void {
  if (element !== null) {
    element.textContent = String(value);
  }
}

function attachShieldHandlers(): void {
  shieldButton?.addEventListener('click', toggleShieldPanel);
  shieldToggle?.addEventListener('click', () => {
    if (shieldState !== null) {
      void shieldBridge?.setEnabled(!shieldState.enabled);
    }
  });
  shieldMode?.addEventListener('change', () => {
    void shieldBridge?.setMode(shieldMode.value as ShieldMode);
  });
  shieldSiteSettingsButton?.addEventListener('click', () => {
    if (shieldState?.currentSite === null || shieldState === null) {
      return;
    }
    if (shieldPanel !== null) {
      shieldPanel.hidden = true;
    }
    if (siteSettingsPanel !== null) {
      siteSettingsPanel.hidden = false;
    }
  });
  siteSettingsClose?.addEventListener('click', () => {
    if (siteSettingsPanel !== null) {
      siteSettingsPanel.hidden = true;
    }
    if (shieldPanel !== null) {
      shieldPanel.hidden = false;
    }
  });
  siteSettingsShield?.addEventListener('click', () => {
    const state = shieldState;
    const site = state?.currentSite;
    if (state === null || site === null || site === undefined) {
      return;
    }
    void shieldBridge?.setSiteSetting(site, { enabled: !state.siteEnabled });
  });
  siteSettingsMode?.addEventListener('change', () => {
    const state = shieldState;
    const site = state?.currentSite;
    if (state === null || site === null || site === undefined) {
      return;
    }
    void shieldBridge?.setSiteSetting(site, {
      mode: siteSettingsMode.value as ShieldMode,
    });
  });
  siteSettingsAllowlist?.addEventListener('click', () => {
    const site = shieldState?.currentSite;
    if (site === null || site === undefined) {
      return;
    }
    void shieldBridge?.toggleAllowlist(site);
  });
  shieldPrivacyCenterButton?.addEventListener('click', () => {
    openPrivacyCenter();
  });
  siteSettingsShieldAction?.addEventListener('click', () => {
    const state = shieldState;
    const site = state?.currentSite;
    if (state === null || site === null || site === undefined) {
      return;
    }
    void shieldBridge?.setSiteSetting(site, { enabled: !state.siteEnabled });
  });
  siteSettingsAllowlistAction?.addEventListener('click', () => {
    const state = shieldState;
    const site = state?.currentSite;
    if (state === null || site === null || site === undefined) {
      return;
    }
    void shieldBridge?.toggleAllowlist(site);
  });
}

/** Navigates the active tab to the SHODASHA Privacy Center (chrome-rendered). */
function openPrivacyCenter(): void {
  closeShieldPanels();
  void bridge?.submitAddress(PRIVACY_CENTER_URL);
}

function attachPrivacyCenterHandlers(): void {
  privacyGlobalToggle?.addEventListener('click', () => {
    const panel = privacyState?.panel;
    if (panel !== undefined) {
      void shieldBridge?.setEnabled(!panel.enabled);
    }
  });
  privacyMode?.addEventListener('change', () => {
    void shieldBridge?.setMode(privacyMode.value as ShieldMode);
  });
  privacyResetStats?.addEventListener('click', () => {
    void privacyBridge?.resetStatistics();
  });
  privacySiteToggle?.addEventListener('click', () => {
    const panel = privacyState?.panel;
    const site = panel?.currentSite;
    if (site === null || site === undefined) {
      return;
    }
    void shieldBridge?.setSiteSetting(site, {
      enabled: !panel?.siteEnabled,
    });
  });
  privacyAllowlistForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = privacyAllowlistInput?.value.trim() ?? '';
    if (input.length === 0) {
      return;
    }
    void privacyBridge?.addToAllowlist(input).then((result) => {
      if (privacyAllowlistInput !== null) {
        privacyAllowlistInput.value = '';
      }
      setText(
        privacyAllowlistFeedback,
        result.ok ? '' : 'That does not look like a valid website address.',
      );
      void refreshPrivacyCenter();
    });
  });
}

// ----------------------------------------------------------------------
// SHODASHA Privacy Center
// ----------------------------------------------------------------------

/**
 * Keeps the Privacy Center's live subscription in sync with visibility. Panel
 * pushes are throttled by the main process, so subscribing while the Privacy
 * Center is open never floods the renderer.
 */
function syncPrivacySubscription(active: boolean): void {
  if (active === privacyCenterActive) {
    return;
  }
  privacyCenterActive = active;
  if (active) {
    privacyUnsub = shieldBridge?.onPanelChanged(() => {
      void refreshPrivacyCenter();
    }) ?? null;
    shieldBridge?.subscribe();
    void refreshPrivacyCenter();
  } else {
    privacyUnsub?.();
    privacyUnsub = null;
    shieldBridge?.unsubscribe();
  }
}

async function refreshPrivacyCenter(): Promise<void> {
  if (!privacyCenterActive) {
    return;
  }
  try {
    const state = await privacyBridge?.getState();
    renderPrivacyCenter(state ?? null);
  } catch {
    renderPrivacyCenter(null);
  }
}

function renderPrivacyCenter(state: PrivacyCenterState | null): void {
  privacyState = state;
  if (state === null) {
    if (privacyError !== null) {
      privacyError.removeAttribute('hidden');
    }
    return;
  }
  if (privacyError !== null) {
    privacyError.setAttribute('hidden', '');
  }
  const panel = state.panel;

  // Protection status (honest; never claims absolute privacy).
  if (privacyStatusBadge !== null) {
    privacyStatusBadge.textContent = state.protectionLabel;
    privacyStatusBadge.dataset.status = state.protectionStatus;
  }
  setText(privacyStatusNote, state.protectionNote);

  // Overview.
  setText(privacyOverviewShield, panel.enabled ? 'ON' : 'OFF');
  setText(privacyOverviewFiltering, panel.enabled ? 'ACTIVE' : 'PAUSED');
  setText(privacyOverviewMode, MODE_LABELS[panel.mode]);

  // Session statistics (real engine counters).
  setText(privacyStatEvaluated, panel.stats.requestsEvaluated);
  setText(privacyStatAllowed, panel.stats.requestsAllowed);
  setText(privacyStatBlocked, panel.stats.requestsBlocked);
  setText(privacyStatAds, panel.stats.adsFiltered);
  setText(privacyStatTrackers, panel.stats.trackersBlocked);
  if (panel.siteStats === null) {
    setText(privacySiteLine, '\u2014');
  } else {
    setText(
      privacySiteLine,
      `${String(panel.siteStats.requestsEvaluated)} evaluated \u00b7 ${String(panel.siteStats.requestsBlocked)} filtered`,
    );
  }

  // Controls.
  if (privacyGlobalToggle !== null) {
    privacyGlobalToggle.textContent = panel.enabled ? 'Shield ON' : 'Shield OFF';
    privacyGlobalToggle.setAttribute('aria-pressed', String(panel.enabled));
    privacyGlobalToggle.classList.toggle('shield-toggle-off', !panel.enabled);
  }
  if (privacyMode !== null) {
    privacyMode.value = panel.mode;
  }

  // Site protection.
  setText(privacySite, panel.currentSite ?? '\u2014');
  setText(
    privacySiteProtection,
    panel.currentSite === null ? '\u2014' : panel.siteEnabled ? 'ON' : 'OFF',
  );
  if (privacySiteToggle !== null) {
    privacySiteToggle.disabled = panel.currentSite === null;
    privacySiteToggle.textContent = panel.siteEnabled
      ? 'Site Shield ON'
      : 'Site Shield OFF';
    privacySiteToggle.setAttribute('aria-pressed', String(panel.siteEnabled));
  }

  renderFilterLists(state);
  renderPrivacyAllowlist(state.allowlist);
  renderPrivacyRecent(state.panel.recentEvents);
}

function renderFilterLists(state: PrivacyCenterState): void {
  setText(privacyListsRules, state.totalRulesLoaded);
  if (state.filterLists.length === 0) {
    setText(
      privacyListsUpdates,
      'Local lists (no auto-download)',
    );
  } else {
    setText(
      privacyListsUpdates,
      `Local lists \u00b7 last update ${state.filterLists[0]?.updatedAt ?? 'never'}`,
    );
  }
  if (privacyLists === null) {
    return;
  }
  const fragment = document.createDocumentFragment();
  for (const list of state.filterLists) {
    const item = document.createElement('li');
    item.className = 'privacy-list-item';
    const name = document.createElement('span');
    name.className = 'privacy-list-name';
    name.textContent = list.name;
    const meta = document.createElement('span');
    meta.className = 'privacy-list-meta';
    meta.textContent = `${list.active ? 'Active' : 'Inactive'} \u00b7 ${String(list.rulesLoaded)} rules \u00b7 v${list.version} \u00b7 ${list.updatedAt}`;
    const license = document.createElement('span');
    license.className = 'privacy-list-license';
    license.textContent = list.license;
    item.append(name, meta, license);
    fragment.append(item);
  }
  privacyLists.replaceChildren(fragment);
}

function renderPrivacyAllowlist(allowlist: readonly string[]): void {
  if (privacyAllowlistList === null) {
    return;
  }
  if (allowlist.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'privacy-empty';
    empty.textContent = 'No sites allowlisted.';
    privacyAllowlistList.replaceChildren(empty);
    return;
  }
  const fragment = document.createDocumentFragment();
  for (const site of allowlist) {
    const item = document.createElement('li');
    item.className = 'privacy-list-item privacy-allowlist-item';
    const name = document.createElement('span');
    name.className = 'privacy-list-name';
    name.textContent = site;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'privacy-btn privacy-btn-ghost';
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', `Remove ${site} from allowlist`);
    remove.addEventListener('click', () => {
      void privacyBridge?.removeFromAllowlist(site).then(() => {
        void refreshPrivacyCenter();
      });
    });
    item.append(name, remove);
    fragment.append(item);
  }
  privacyAllowlistList.replaceChildren(fragment);
}

function renderPrivacyRecent(events: readonly ShieldFilterEvent[]): void {
  if (privacyRecentList === null) {
    return;
  }
  if (events.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'privacy-empty';
    empty.textContent = 'No filter activity yet this session.';
    privacyRecentList.replaceChildren(empty);
    return;
  }
  const fragment = document.createDocumentFragment();
  for (const event of events) {
    const item = document.createElement('li');
    item.className = `shield-event shield-event-${event.action}`;
    const label = document.createElement('span');
    label.className = 'shield-event-label';
    label.textContent = event.action === 'block' ? 'Blocked' : 'Allowed';
    const detail = document.createElement('span');
    detail.className = 'shield-event-detail';
    detail.textContent = `${event.category} \u00b7 ${event.resourceType} \u00b7 ${event.hostname}`;
    item.append(label, detail);
    fragment.append(item);
  }
  privacyRecentList.replaceChildren(fragment);
}

const MODE_LABELS: Record<ShieldMode, string> = {
  standard: 'Standard',
  strict: 'Strict',
  custom: 'Custom',
};

// ----------------------------------------------------------------------
// Tab context menu
// ----------------------------------------------------------------------
function openTabContextMenu(tabId: string, x: number, y: number): void {
  contextTabId = tabId;
  if (tabContextMenu === null) {
    return;
  }
  const reopen = tabContextMenu.querySelector<HTMLButtonElement>(
    '[data-action="reopen-closed"]',
  );
  if (reopen !== null) {
    reopen.disabled = !currentState.canReopenClosedTab;
  }
  tabContextMenu.hidden = false;
  tabContextMenu.classList.add('open');
  const rect = tabContextMenu.getBoundingClientRect();
  const left = Math.max(8, Math.min(x, window.innerWidth - rect.width - 8));
  const top = Math.max(8, Math.min(y, window.innerHeight - rect.height - 8));
  tabContextMenu.style.left = `${left.toFixed(0)}px`;
  tabContextMenu.style.top = `${top.toFixed(0)}px`;

  const close = () => {
    closeTabContextMenu();
    document.removeEventListener('click', close);
    document.removeEventListener('keydown', onEscape);
  };
  const onEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      close();
    }
  };
  setTimeout(() => {
    document.addEventListener('click', close);
    document.addEventListener('keydown', onEscape);
  }, 0);
}

function closeTabContextMenu(): void {
  if (tabContextMenu === null) {
    return;
  }
  tabContextMenu.classList.remove('open');
  tabContextMenu.hidden = true;
  contextTabId = null;
}

function handleTabMenuAction(action: string): void {
  const tabId = contextTabId;
  switch (action) {
    case 'new-tab':
      void bridge?.newTab();
      break;
    case 'reload-tab':
      if (tabId !== null) {
        void bridge?.reloadTab(tabId);
      }
      break;
    case 'duplicate-tab':
      if (tabId !== null) {
        void bridge?.duplicateTab(tabId);
      }
      break;
    case 'close-tab':
      if (tabId !== null) {
        void bridge?.closeTab(tabId);
      }
      break;
    case 'close-others':
      if (tabId !== null) {
        void bridge?.closeOtherTabs(tabId);
      }
      break;
    case 'close-right':
      if (tabId !== null) {
        void bridge?.closeTabsToRight(tabId);
      }
      break;
    case 'reopen-closed':
      void bridge?.reopenClosedTab();
      break;
  }
  closeTabContextMenu();
}

function attachTabContextMenuHandlers(): void {
  tabContextMenu?.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    const action = target?.dataset.action;
    if (action !== undefined) {
      handleTabMenuAction(action);
    }
  });
}

// ----------------------------------------------------------------------
// Keyboard shortcuts (chrome focus)
// ----------------------------------------------------------------------
function attachShortcutHandlers(): void {
  document.addEventListener('keydown', (event) => {
    const input: ShortcutInput = {
      key: event.key,
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      alt: event.altKey,
      meta: event.metaKey,
      type: event.type,
    };
    const action = shortcutActionFor(input);
    if (action === null) {
      return;
    }
    event.preventDefault();
    dispatchShortcut(action);
  });
}

// ----------------------------------------------------------------------
// Boot
// ----------------------------------------------------------------------
function applyState(state: BrowserState): void {
  currentState = state;
  renderToolbar(state);
  renderTabs(state);
  renderContent(state);
  maybeFocusNewTab(state);
}

async function boot(): Promise<void> {
  attachToolbarHandlers();
  attachNtpHandlers();
  attachMenuHandlers();
  attachTabContextMenuHandlers();
  attachShortcutHandlers();
  attachShieldHandlers();
  attachPrivacyCenterHandlers();

  if (bridge === undefined) {
    const root = document.querySelector<HTMLElement>('#app');
    if (root !== null) {
      root.textContent = 'Preload bridge unavailable.';
    }
    return;
  }
  bridge.onStateChanged(applyState);
  bridge.onFocusAddressBar(focusAddressInput);
  const initial = await bridge.getState();
  applyState(initial);
}

void boot();
