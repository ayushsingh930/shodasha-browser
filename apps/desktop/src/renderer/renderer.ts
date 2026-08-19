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
  BOOKMARKS_URL,
  DOWNLOADS_URL,
  HISTORY_URL,
  PRIVACY_CENTER_URL,
  bookmarkForUrl,
  downloadSourceFor,
  downloadStateView,
  formatDownloadBytes,
  groupHistoryByDate,
  hostnameFromHistoryUrl,
  internalPageInfoFor,
  isBlankTabUrl,
  searchBookmarks,
  searchDownloads,
  searchHistory,
  sortBookmarks,
  type BookmarkState,
  type BrowserState,
  type DownloadsState,
  type HistoryState,
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
  AddBookmarkResult,
  Bookmark,
  BookmarkCollection,
  BookmarkFolder,
  BookmarkSort,
  DownloadItem,
  HistoryEntry,
  ShieldFilterEvent,
  ShieldMode,
  UpdateBookmarkResult,
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
  bookmarks: {
    getState(): Promise<BookmarkState>;
    add(input: {
      title: string;
      url: string;
      folderId: string | null;
    }): Promise<AddBookmarkResult>;
    update(
      id: string,
      patch: { title?: string; url?: string; folderId?: string | null },
    ): Promise<UpdateBookmarkResult>;
    delete(id: string): Promise<boolean>;
    createFolder(name: string): Promise<BookmarkFolder | null>;
    renameFolder(id: string, name: string): Promise<boolean>;
    deleteFolder(id: string): Promise<boolean>;
    move(id: string, folderId: string | null): Promise<boolean>;
    search(query: string): Promise<Bookmark[]>;
    setToolbarVisible(visible: boolean): Promise<void>;
    onStateChanged(callback: (state: BookmarkState) => void): () => void;
    onOpenAddDialog(
      callback: (data: { url: string; title: string }) => void,
    ): () => void;
  };
  history: {
    getState(): Promise<HistoryState>;
    search(query: string): Promise<HistoryEntry[]>;
    deleteEntry(id: string): Promise<boolean>;
    clear(): Promise<number>;
    clearRange(start: number, end: number): Promise<number>;
    clearSite(site: string): Promise<number>;
    onStateChanged(callback: (state: HistoryState) => void): () => void;
  };
  downloads: {
    getState(): Promise<DownloadsState>;
    pause(id: string): Promise<boolean>;
    resume(id: string): Promise<boolean>;
    cancel(id: string): Promise<boolean>;
    remove(id: string): Promise<boolean>;
    clear(target: string): Promise<number>;
    open(id: string): Promise<{ ok: boolean }>;
    show(id: string): Promise<boolean>;
    onStateChanged(callback: (state: DownloadsState) => void): () => void;
    onCompleted(
      callback: (info: { id: string; filename: string }) => void,
    ): () => void;
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

// Bookmark UI elements.
const bookmarkButton = document.querySelector<HTMLButtonElement>('#btn-bookmark');
const bookmarksBar = document.querySelector<HTMLElement>('#bookmarks-bar');
const bookmarksBarItems = document.querySelector<HTMLElement>('#bookmarks-bar-items');
const bookmarksBarToggle = document.querySelector<HTMLButtonElement>('#bookmarks-bar-toggle');
const bookmarksManager = document.querySelector<HTMLElement>('#bookmarks-manager');
const bookmarksManagerSearch = document.querySelector<HTMLInputElement>('#bookmarks-manager-search');
const bookmarksManagerSort = document.querySelector<HTMLSelectElement>('#bookmarks-manager-sort');
const bookmarksManagerNewFolder = document.querySelector<HTMLButtonElement>('#bookmarks-manager-new-folder');
const bookmarksFoldersList = document.querySelector<HTMLElement>('#bookmarks-folders-list');
const bookmarksManagerEmpty = document.querySelector<HTMLElement>('#bookmarks-manager-empty');
const bookmarksManagerList = document.querySelector<HTMLUListElement>('#bookmarks-manager-list');
const bookmarkDialogBackdrop = document.querySelector<HTMLElement>('#bookmark-dialog-backdrop');
const bookmarkDialogTitle = document.querySelector<HTMLElement>('#bookmark-dialog-title');
const bookmarkDialogForm = document.querySelector<HTMLFormElement>('#bookmark-dialog-form');
const bookmarkDialogName = document.querySelector<HTMLInputElement>('#bookmark-dialog-name');
const bookmarkDialogUrl = document.querySelector<HTMLInputElement>('#bookmark-dialog-url');
const bookmarkDialogFolder = document.querySelector<HTMLSelectElement>('#bookmark-dialog-folder');
const bookmarkDialogError = document.querySelector<HTMLElement>('#bookmark-dialog-error');
const bookmarkDialogDelete = document.querySelector<HTMLButtonElement>('#bookmark-dialog-delete');
const bookmarkDialogCancel = document.querySelector<HTMLButtonElement>('#bookmark-dialog-cancel');

// History Manager elements.
const historyManager = document.querySelector<HTMLElement>('#history-manager');
const historyManagerSearch = document.querySelector<HTMLInputElement>('#history-manager-search');
const historyManagerClear = document.querySelector<HTMLButtonElement>('#history-manager-clear');
const historyManagerEmpty = document.querySelector<HTMLElement>('#history-manager-empty');
const historyManagerList = document.querySelector<HTMLElement>('#history-manager-list');
const historyManagerMore = document.querySelector<HTMLButtonElement>('#history-manager-more');
const historyItemMenu = document.querySelector<HTMLElement>('#history-item-menu');
const historyClearDialog = document.querySelector<HTMLElement>('#history-clear-dialog');
const historyClearDialogCancel = document.querySelector<HTMLButtonElement>('#history-clear-dialog-cancel');
const historyClearDialogConfirm = document.querySelector<HTMLButtonElement>('#history-clear-dialog-confirm');
const historyClearRanges = document.querySelectorAll<HTMLInputElement>(
  'input[name="history-clear-range"]',
);

// Downloads Manager elements.
const downloadsButton = document.querySelector<HTMLButtonElement>('#btn-downloads');
const downloadsBadge = document.querySelector<HTMLElement>('#downloads-badge');
const downloadsManager = document.querySelector<HTMLElement>('#downloads-manager');
const downloadsManagerSearch = document.querySelector<HTMLInputElement>('#downloads-manager-search');
const downloadsManagerClear = document.querySelector<HTMLButtonElement>('#downloads-manager-clear');
const downloadsManagerEmpty = document.querySelector<HTMLElement>('#downloads-manager-empty');
const downloadsManagerList = document.querySelector<HTMLElement>('#downloads-manager-list');

// ----------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------
/** How many history entries render before the "Show more" control. */
const HISTORY_PAGE_SIZE = 100;

/** The time ranges offered by the clear-history dialog. */
type HistoryClearRange = 'hour' | 'day' | 'week' | 'month' | 'all';

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
const bookmarksBridge = window.shodasha?.bookmarks;
const historyBridge = window.shodasha?.history;
const downloadsBridge = window.shodasha?.downloads;
let privacyCenterActive = false;
let privacyUnsub: (() => void) | null = null;
let privacyState: PrivacyCenterState | null = null;

// Bookmark state (single source of truth lives in the main process).
let bookmarkState: BookmarkState | null = null;
let bookmarkManagerActive = false;
/** The bookmark being edited in the dialog, or null when adding. */
let bookmarkDialogId: string | null = null;
/** The current folder filter in the Bookmark Manager (null = all). */
let managerFolderFilter: string | null = null;
let managerSort: BookmarkSort = 'recent';

// History state (single source of truth lives in the main process).
let historyState: HistoryState | null = null;
let historyManagerActive = false;
/** Whether the History Manager was active in the previous render pass. */
let historyWasActive = false;
let historySearchQuery = '';
/** How many entries are currently rendered (incremental loading). */
let historyShownCount = HISTORY_PAGE_SIZE;
/** The entry whose item menu is open, or null. */
let historyMenuEntry: HistoryEntry | null = null;
/** The selected time range in the clear-history dialog. */
let historyClearSelection: HistoryClearRange = 'all';

// Downloads state (single source of truth lives in the main process).
let downloadsState: DownloadsState | null = null;
let downloadsManagerActive = false;
/** Whether the Downloads Manager was active in the previous render pass. */
let downloadsWasActive = false;
let downloadsSearchQuery = '';

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
  const internalInfo =
    active !== null && !active.showErrorPage
      ? internalPageInfoFor(active.url)
      : null;
  const internal = internalInfo !== null;
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
    if (internalInfo?.kind === 'privacy') {
      privacyCenter.removeAttribute('hidden');
    } else {
      privacyCenter.setAttribute('hidden', '');
    }
  }
  syncPrivacySubscription(internalInfo?.kind === 'privacy');

  // The Bookmark Manager is chrome-rendered, like the Privacy Center.
  bookmarkManagerActive = internalInfo?.kind === 'bookmarks';
  if (bookmarksManager !== null) {
    if (bookmarkManagerActive) {
      bookmarksManager.removeAttribute('hidden');
      renderBookmarksManager();
    } else {
      bookmarksManager.setAttribute('hidden', '');
    }
  }

  // The History Manager is chrome-rendered, like the Bookmark Manager.
  historyManagerActive = internalInfo?.kind === 'history';
  if (historyManager !== null) {
    if (historyManagerActive) {
      if (!historyWasActive) {
        // Fresh entry to the page: reset the incremental list and any search.
        historyWasActive = true;
        historyShownCount = HISTORY_PAGE_SIZE;
        if (historySearchQuery.length > 0) {
          historySearchQuery = '';
          if (historyManagerSearch !== null) {
            historyManagerSearch.value = '';
          }
        }
      }
      historyManager.removeAttribute('hidden');
      renderHistoryManager();
    } else {
      historyWasActive = false;
      historyManager.setAttribute('hidden', '');
    }
  }

  // The Downloads Manager is chrome-rendered, like the History Manager.
  downloadsManagerActive = internalInfo?.kind === 'downloads';
  if (downloadsManager !== null) {
    if (downloadsManagerActive) {
      if (!downloadsWasActive) {
        downloadsWasActive = true;
        if (downloadsSearchQuery.length > 0) {
          downloadsSearchQuery = '';
          if (downloadsManagerSearch !== null) {
            downloadsManagerSearch.value = '';
          }
        }
      }
      downloadsManager.removeAttribute('hidden');
      renderDownloadsManager();
    } else {
      downloadsWasActive = false;
      downloadsManager.setAttribute('hidden', '');
    }
  }

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
    case 'toggle-bookmarks-bar':
      toggleBookmarksBar();
      break;
    case 'open-history':
      openHistoryManager();
      break;
    case 'open-downloads':
      openDownloadsManager();
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
    case 'bookmarks':
      openBookmarksManager();
      break;
    case 'history':
      openHistoryManager();
      break;
    case 'downloads':
      openDownloadsManager();
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

/** Navigates the active tab to the SHODASHA Bookmark Manager. */
function openBookmarksManager(): void {
  closeShieldPanels();
  void bridge?.submitAddress(BOOKMARKS_URL);
}

/** Navigates the active tab to the SHODASHA History Manager. */
function openHistoryManager(): void {
  closeShieldPanels();
  void bridge?.submitAddress(HISTORY_URL);
}

/** Navigates the active tab to the SHODASHA Downloads Manager. */
function openDownloadsManager(): void {
  closeShieldPanels();
  void bridge?.submitAddress(DOWNLOADS_URL);
}

// ----------------------------------------------------------------------
// Bookmarks
// ----------------------------------------------------------------------

/** Applies bookmark state pushed from the main process. */
function applyBookmarkState(state: BookmarkState): void {
  bookmarkState = state;
  renderStar();
  renderBookmarksBar();
  if (bookmarkManagerActive) {
    renderBookmarksManager();
  }
  // The History Manager shows bookmarked indicators; refresh them when the
  // bookmark collection changes so the state never goes stale.
  if (historyManagerActive) {
    renderHistoryManager();
  }
}

/** Renders the star button state for the current page. */
function renderStar(): void {
  if (bookmarkButton === null) {
    return;
  }
  const activeUrl = bookmarkState?.activeUrl ?? null;
  const hasPage = activeUrl !== null && activeUrl.length > 0;
  const bookmarked = hasPage && (bookmarkState?.activeBookmarkId ?? null) !== null;
  bookmarkButton.disabled = !hasPage;
  bookmarkButton.textContent = bookmarked ? '\u2605' : '\u2606';
  bookmarkButton.setAttribute('aria-pressed', String(bookmarked));
  bookmarkButton.title = bookmarked ? 'Edit bookmark' : 'Bookmark this page';
  bookmarkButton.classList.toggle('bookmarked', bookmarked);
}

/** Renders the optional bookmarks toolbar row (below the tab bar). */
function renderBookmarksBar(): void {
  if (bookmarksBar === null) {
    return;
  }
  const visible = bookmarkState?.toolbarVisible === true;
  bookmarksBar.hidden = !visible;
  if (!visible || bookmarksBarItems === null) {
    return;
  }
  // The toolbar shows unfiled bookmarks, sorted by name, scrolling horizontally
  // when there are more than fit (overflow never breaks the layout).
  const collection = bookmarkState?.collection;
  if (collection === undefined) {
    return;
  }
  const rootBookmarks = collection.bookmarks.filter(
    (bookmark) => bookmark.folderId === null,
  );
  const fragment = document.createDocumentFragment();
  for (const bookmark of sortBookmarks(rootBookmarks, 'name-asc')) {
    fragment.appendChild(buildBookmarkBarItem(bookmark));
  }
  bookmarksBarItems.replaceChildren(fragment);
}

function buildBookmarkBarItem(bookmark: Bookmark): HTMLElement {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'bookmark-bar-item';
  el.title = bookmark.url;

  const icon = document.createElement('span');
  icon.className = 'bookmark-favicon';
  icon.setAttribute('aria-hidden', 'true');
  if (bookmark.favicon) {
    const img = document.createElement('img');
    img.src = bookmark.favicon;
    img.alt = '';
    img.loading = 'lazy';
    icon.replaceChildren(img);
  } else {
    icon.textContent = '\u2606';
  }

  const label = document.createElement('span');
  label.className = 'bookmark-bar-label';
  label.textContent = bookmark.title;
  label.title = bookmark.url;

  el.append(icon, label);
  el.addEventListener('click', () => {
    void bridge?.submitAddress(bookmark.url);
  });
  return el;
}

/** Toggles the bookmarks toolbar (Ctrl+Shift+B). */
function toggleBookmarksBar(): void {
  const visible = bookmarkState?.toolbarVisible === true;
  void bookmarksBridge?.setToolbarVisible(!visible);
}

// ------------------------------------------------------------- manager

function renderBookmarksManager(): void {
  const collection = bookmarkState?.collection;
  if (collection === undefined) {
    return;
  }
  renderManagerFolders(collection);
  renderManagerList(collection);
}

function renderManagerFolders(collection: BookmarkCollection): void {
  if (bookmarksFoldersList === null) {
    return;
  }
  const fragment = document.createDocumentFragment();

  const allRow = document.createElement('div');
  allRow.className =
    'bookmarks-folder-row' + (managerFolderFilter === null ? ' active' : '');
  const allButton = document.createElement('button');
  allButton.type = 'button';
  allButton.className = 'bookmarks-folder';
  allButton.textContent = 'All bookmarks';
  allButton.addEventListener('click', () => {
    managerFolderFilter = null;
    renderBookmarksManager();
  });
  allRow.appendChild(allButton);
  fragment.appendChild(allRow);

  for (const folder of collection.folders) {
    const row = document.createElement('div');
    row.className =
      'bookmarks-folder-row' + (managerFolderFilter === folder.id ? ' active' : '');

    const select = document.createElement('button');
    select.type = 'button';
    select.className = 'bookmarks-folder';
    select.textContent = folder.name;
    select.title = folder.name;
    select.addEventListener('click', () => {
      managerFolderFilter = folder.id;
      renderBookmarksManager();
    });

    const rename = document.createElement('button');
    rename.type = 'button';
    rename.className = 'bookmarks-folder-action';
    rename.textContent = '\u270e';
    rename.title = `Rename ${folder.name}`;
    rename.setAttribute('aria-label', `Rename ${folder.name}`);
    rename.addEventListener('click', () => {
      renameFolderPrompt(folder.id, folder.name);
    });

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'bookmarks-folder-action';
    remove.textContent = '\u00d7';
    remove.title = `Delete ${folder.name}`;
    remove.setAttribute('aria-label', `Delete ${folder.name}`);
    remove.addEventListener('click', () => {
      void deleteFolder(folder.id);
    });

    row.append(select, rename, remove);
    fragment.appendChild(row);
  }

  bookmarksFoldersList.replaceChildren(fragment);
}

function renderManagerList(collection: BookmarkCollection): void {
  if (bookmarksManagerList === null || bookmarksManagerEmpty === null) {
    return;
  }
  const query = bookmarksManagerSearch?.value ?? '';
  let bookmarks = searchBookmarks(collection.bookmarks, query);
  if (managerFolderFilter !== null) {
    bookmarks = bookmarks.filter(
      (bookmark) => bookmark.folderId === managerFolderFilter,
    );
  }
  bookmarks = sortBookmarks(bookmarks, managerSort);

  if (bookmarks.length === 0) {
    bookmarksManagerEmpty.hidden = false;
    bookmarksManagerList.replaceChildren();
    return;
  }
  bookmarksManagerEmpty.hidden = true;

  const folderNames = new Map(
    collection.folders.map((folder) => [folder.id, folder.name]),
  );
  const fragment = document.createDocumentFragment();
  for (const bookmark of bookmarks) {
    fragment.appendChild(
      buildManagerItem(bookmark, folderNames.get(bookmark.folderId ?? '') ?? null),
    );
  }
  bookmarksManagerList.replaceChildren(fragment);
}

function buildManagerItem(
  bookmark: Bookmark,
  folderName: string | null,
): HTMLElement {
  const item = document.createElement('li');
  item.className = 'bookmarks-manager-item';

  const icon = document.createElement('span');
  icon.className = 'bookmark-favicon bookmark-favicon-lg';
  icon.setAttribute('aria-hidden', 'true');
  if (bookmark.favicon) {
    const img = document.createElement('img');
    img.src = bookmark.favicon;
    img.alt = '';
    img.loading = 'lazy';
    icon.replaceChildren(img);
  } else {
    icon.textContent = '\u2606';
  }

  const main = document.createElement('div');
  main.className = 'bookmarks-manager-item-main';
  const title = document.createElement('span');
  title.className = 'bookmarks-manager-item-title';
  title.textContent = bookmark.title;
  title.title = bookmark.title;
  const meta = document.createElement('span');
  meta.className = 'bookmarks-manager-item-meta';
  meta.textContent = folderName === null ? bookmark.url : `${folderName} \u00b7 ${bookmark.url}`;
  main.append(title, meta);

  const actions = document.createElement('div');
  actions.className = 'bookmarks-manager-item-actions';

  const open = document.createElement('button');
  open.type = 'button';
  open.className = 'privacy-btn privacy-btn-ghost';
  open.textContent = 'Open';
  open.addEventListener('click', () => {
    void bridge?.submitAddress(bookmark.url);
  });

  const edit = document.createElement('button');
  edit.type = 'button';
  edit.className = 'privacy-btn privacy-btn-ghost';
  edit.textContent = 'Edit';
  edit.addEventListener('click', () => {
    showBookmarkDialog({ editing: bookmark, url: bookmark.url, title: bookmark.title });
  });

  const move = document.createElement('select');
  move.className = 'shield-select bookmark-move-select';
  move.setAttribute('aria-label', `Move ${bookmark.title} to folder`);
  move.appendChild(new Option('Root', '__root__'));
  for (const folder of bookmarkState?.collection.folders ?? []) {
    move.appendChild(new Option(folder.name, folder.id));
  }
  move.value = bookmark.folderId ?? '__root__';
  move.addEventListener('change', () => {
    const target = move.value === '__root__' ? null : move.value;
    void bookmarksBridge?.move(bookmark.id, target);
  });

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'privacy-btn privacy-btn-ghost bookmark-delete-btn';
  remove.textContent = 'Delete';
  remove.addEventListener('click', () => {
    void bookmarksBridge?.delete(bookmark.id);
  });

  actions.append(open, edit, move, remove);
  item.append(icon, main, actions);
  return item;
}

async function deleteFolder(id: string): Promise<void> {
  await bookmarksBridge?.deleteFolder(id);
  if (managerFolderFilter === id) {
    managerFolderFilter = null;
  }
}

/** Shows a small inline editor for creating a folder. */
function beginNewFolder(): void {
  if (bookmarksFoldersList === null) {
    return;
  }
  removeInlineFolderEditor();
  const row = document.createElement('div');
  row.className = 'bookmarks-inline-editor';
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Folder name';
  input.setAttribute('aria-label', 'New folder name');
  const create = document.createElement('button');
  create.type = 'button';
  create.textContent = 'Create';
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.textContent = 'Cancel';
  const commit = () => {
    const name = input.value.trim();
    row.remove();
    if (name.length > 0) {
      void bookmarksBridge?.createFolder(name);
    }
  };
  create.addEventListener('click', commit);
  cancel.addEventListener('click', () => {
    row.remove();
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      commit();
    } else if (event.key === 'Escape') {
      row.remove();
    }
  });
  row.append(input, create, cancel);
  bookmarksFoldersList.appendChild(row);
  input.focus();
}

/** Shows a small inline editor for renaming a folder. */
function renameFolderPrompt(id: string, currentName: string): void {
  if (bookmarksFoldersList === null) {
    return;
  }
  removeInlineFolderEditor();
  const row = document.createElement('div');
  row.className = 'bookmarks-inline-editor';
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentName;
  input.setAttribute('aria-label', 'Rename folder');
  const save = document.createElement('button');
  save.type = 'button';
  save.textContent = 'Save';
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.textContent = 'Cancel';
  const commit = () => {
    const name = input.value.trim();
    row.remove();
    if (name.length > 0) {
      void bookmarksBridge?.renameFolder(id, name);
    }
  };
  save.addEventListener('click', commit);
  cancel.addEventListener('click', () => {
    row.remove();
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      commit();
    } else if (event.key === 'Escape') {
      row.remove();
    }
  });
  row.append(input, save, cancel);
  bookmarksFoldersList.appendChild(row);
  input.focus();
  input.select();
}

function removeInlineFolderEditor(): void {
  bookmarksFoldersList
    ?.querySelector('.bookmarks-inline-editor')
    ?.remove();
}

// ------------------------------------------------------------- dialog

/**
 * Opens the add/edit bookmark dialog. `editing` is the bookmark being edited,
 * or null when adding a new one; `url`/`title` prefill the fields (the main
 * process validates the final data before anything is stored).
 */
function showBookmarkDialog(opts: {
  editing: Bookmark | null;
  url: string;
  title: string;
}): void {
  if (bookmarkDialogBackdrop === null) {
    return;
  }
  bookmarkDialogId = opts.editing?.id ?? null;
  if (bookmarkDialogTitle !== null) {
    bookmarkDialogTitle.textContent =
      opts.editing === null ? 'Add Bookmark' : 'Edit Bookmark';
  }
  if (bookmarkDialogName !== null) {
    bookmarkDialogName.value = opts.editing?.title ?? opts.title;
  }
  if (bookmarkDialogUrl !== null) {
    bookmarkDialogUrl.value = opts.editing?.url ?? opts.url;
  }
  if (bookmarkDialogDelete !== null) {
    bookmarkDialogDelete.hidden = opts.editing === null;
  }
  populateFolderSelect(opts.editing?.folderId ?? null);
  if (bookmarkDialogError !== null) {
    bookmarkDialogError.hidden = true;
  }
  bookmarkDialogBackdrop.hidden = false;
  bookmarkDialogName?.focus();
  bookmarkDialogName?.select();
}

function populateFolderSelect(currentFolderId: string | null): void {
  if (bookmarkDialogFolder === null) {
    return;
  }
  bookmarkDialogFolder.replaceChildren();
  bookmarkDialogFolder.appendChild(new Option('Root', '__root__'));
  for (const folder of bookmarkState?.collection.folders ?? []) {
    bookmarkDialogFolder.appendChild(new Option(folder.name, folder.id));
  }
  bookmarkDialogFolder.value = currentFolderId ?? '__root__';
}

function closeBookmarkDialog(): void {
  if (bookmarkDialogBackdrop !== null) {
    bookmarkDialogBackdrop.hidden = true;
  }
  bookmarkDialogId = null;
}

function showDialogError(message: string): void {
  if (bookmarkDialogError === null) {
    return;
  }
  bookmarkDialogError.textContent = message;
  bookmarkDialogError.hidden = false;
}

async function submitBookmarkDialog(): Promise<void> {
  const name = bookmarkDialogName?.value.trim() ?? '';
  const url = bookmarkDialogUrl?.value.trim() ?? '';
  const folderValue = bookmarkDialogFolder?.value ?? '__root__';
  const folderId = folderValue === '__root__' ? null : folderValue;
  if (name.length === 0 || url.length === 0) {
    showDialogError('Please enter a name and a URL.');
    return;
  }
  try {
    if (bookmarkDialogId === null) {
      const result = await bookmarksBridge?.add({ title: name, url, folderId });
      if (result?.ok === false) {
        showDialogError('Unable to save bookmark.');
        return;
      }
    } else {
      const result = await bookmarksBridge?.update(bookmarkDialogId, {
        title: name,
        url,
        folderId,
      });
      if (result?.ok === false) {
        showDialogError('Unable to save bookmark.');
        return;
      }
    }
    closeBookmarkDialog();
  } catch {
    showDialogError('Unable to save bookmark.');
  }
}

function onDialogDelete(): void {
  if (bookmarkDialogId === null) {
    return;
  }
  void bookmarksBridge?.delete(bookmarkDialogId);
  closeBookmarkDialog();
}

/** Star button: open the edit dialog when bookmarked, the add dialog otherwise. */
function onStarClick(): void {
  const state = bookmarkState;
  if (state === null) {
    return;
  }
  const activeUrl = state.activeUrl;
  if (activeUrl === null || activeUrl.length === 0) {
    return;
  }
  const active = currentState.tabs.find((t) => t.id === currentState.activeTabId);
  const pageTitle = active?.title ?? activeUrl;
  const existingId = state.activeBookmarkId;
  const existing =
    existingId === null
      ? null
      : (state.collection.bookmarks.find((b) => b.id === existingId) ?? null);
  if (existing !== null) {
    showBookmarkDialog({
      editing: existing,
      url: activeUrl,
      title: existing.title,
    });
  } else {
    showBookmarkDialog({ editing: null, url: activeUrl, title: pageTitle });
  }
}

function attachBookmarkHandlers(): void {
  bookmarkButton?.addEventListener('click', onStarClick);
  bookmarksBarToggle?.addEventListener('click', toggleBookmarksBar);
  bookmarksManagerSearch?.addEventListener('input', () => {
    renderBookmarksManager();
  });
  bookmarksManagerSort?.addEventListener('change', () => {
    managerSort = bookmarksManagerSort.value as BookmarkSort;
    renderBookmarksManager();
  });
  bookmarksManagerNewFolder?.addEventListener('click', beginNewFolder);
  bookmarkDialogForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    void submitBookmarkDialog();
  });
  bookmarkDialogCancel?.addEventListener('click', closeBookmarkDialog);
  bookmarkDialogDelete?.addEventListener('click', onDialogDelete);
  bookmarkDialogBackdrop?.addEventListener('click', (event) => {
    if (event.target === bookmarkDialogBackdrop) {
      closeBookmarkDialog();
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && bookmarkDialogBackdrop?.hidden === false) {
      closeBookmarkDialog();
    }
  });
}

// ----------------------------------------------------------------------
// History Manager
// ----------------------------------------------------------------------

/** Applies history state pushed from the main process. */
function applyHistoryState(state: HistoryState): void {
  historyState = state;
  if (historyManagerActive) {
    renderHistoryManager();
  }
}

function renderHistoryManager(): void {
  if (historyManagerList === null || historyManagerEmpty === null) {
    return;
  }
  const entries = searchHistory(historyState?.entries ?? [], historySearchQuery);
  if (entries.length === 0) {
    historyManagerEmpty.hidden = false;
    historyManagerList.replaceChildren();
    if (historyManagerMore !== null) {
      historyManagerMore.hidden = true;
    }
    return;
  }
  historyManagerEmpty.hidden = true;
  const visible = entries.slice(0, historyShownCount);
  const groups = groupHistoryByDate(visible, Date.now());
  const fragment = document.createDocumentFragment();
  for (const group of groups) {
    const heading = document.createElement('h3');
    heading.className = 'history-group-title';
    heading.textContent = group.label;
    fragment.appendChild(heading);
    const list = document.createElement('ul');
    list.className = 'history-manager-list';
    for (const entry of group.entries) {
      list.appendChild(buildHistoryItem(entry));
    }
    fragment.appendChild(list);
  }
  historyManagerList.replaceChildren(fragment);
  if (historyManagerMore !== null) {
    historyManagerMore.hidden = visible.length >= entries.length;
  }
}

function buildHistoryItem(entry: HistoryEntry): HTMLElement {
  const li = document.createElement('li');
  li.className = 'history-manager-item';

  const favicon = document.createElement('span');
  favicon.className = 'history-favicon';
  favicon.setAttribute('aria-hidden', 'true');
  if (entry.favicon !== null) {
    const img = document.createElement('img');
    img.src = entry.favicon;
    img.alt = '';
    img.loading = 'lazy';
    favicon.replaceChildren(img);
  }

  const main = document.createElement('div');
  main.className = 'history-manager-item-main';

  const title = document.createElement('span');
  title.className = 'history-manager-item-title';
  title.textContent = entry.title.length > 0 ? entry.title : entry.url;

  const url = document.createElement('span');
  url.className = 'history-manager-item-url';
  url.textContent = entry.url;
  url.title = entry.url;

  main.append(title, url);

  const bookmarked =
    bookmarkForUrl(bookmarkState?.collection.bookmarks ?? [], entry.url) !== null;
  if (bookmarked) {
    const star = document.createElement('span');
    star.className = 'history-bookmarked';
    star.textContent = '\u2605';
    star.setAttribute('aria-label', 'Bookmarked');
    star.title = 'Bookmarked';
    li.appendChild(star);
  }

  const time = document.createElement('span');
  time.className = 'history-manager-item-time';
  time.textContent = formatHistoryTime(entry.visitedAt);
  time.title = formatHistoryDate(entry.visitedAt);

  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'history-manager-more';
  more.textContent = '\u22ef';
  more.setAttribute('aria-label', 'More actions');
  more.addEventListener('click', (event) => {
    event.stopPropagation();
    openHistoryItemMenu(entry, more);
  });

  li.append(favicon, main, time, more);
  li.addEventListener('click', () => {
    void bridge?.submitAddress(entry.url);
  });
  return li;
}

function formatHistoryTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatHistoryDate(ts: number): string {
  return new Date(ts).toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ----------------------------------------------------------- item menu

function openHistoryItemMenu(entry: HistoryEntry, anchor: HTMLElement): void {
  const menu = historyItemMenu;
  if (menu === null) {
    return;
  }
  historyMenuEntry = entry;
  const bookmarkAction = menu.querySelector<HTMLButtonElement>(
    '[data-action="bookmark"]',
  );
  const existing = bookmarkForUrl(
    bookmarkState?.collection.bookmarks ?? [],
    entry.url,
  );
  if (bookmarkAction !== null) {
    bookmarkAction.textContent =
      existing !== null ? 'Edit bookmark' : 'Bookmark page';
  }
  const rect = anchor.getBoundingClientRect();
  menu.style.left = `${String(Math.min(rect.right, window.innerWidth - 200))}px`;
  menu.style.top = `${String(rect.bottom + 4)}px`;
  menu.hidden = false;

  const close = (): void => {
    menu.hidden = true;
    historyMenuEntry = null;
    document.removeEventListener('click', onDocClick);
    document.removeEventListener('keydown', onEsc);
    document.removeEventListener('scroll', onScroll, true);
  };
  const onDocClick = (event: MouseEvent): void => {
    const target = event.target as Node | null;
    if (target !== null && menu.contains(target)) {
      return;
    }
    close();
  };
  const onEsc = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      close();
    }
  };
  const onScroll = (): void => {
    close();
  };
  setTimeout(() => {
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onEsc);
    document.addEventListener('scroll', onScroll, true);
  }, 0);
}

function closeHistoryItemMenu(): void {
  if (historyItemMenu !== null) {
    historyItemMenu.hidden = true;
  }
  historyMenuEntry = null;
}

function handleHistoryItemMenuAction(action: string): void {
  const entry = historyMenuEntry;
  closeHistoryItemMenu();
  if (entry === null) {
    return;
  }
  switch (action) {
    case 'open':
      void bridge?.submitAddress(entry.url);
      break;
    case 'bookmark': {
      const existing = bookmarkForUrl(
        bookmarkState?.collection.bookmarks ?? [],
        entry.url,
      );
      if (existing !== null) {
        showBookmarkDialog({
          editing: existing,
          url: existing.url,
          title: existing.title,
        });
      } else {
        showBookmarkDialog({
          editing: null,
          url: entry.url,
          title: entry.title.length > 0 ? entry.title : entry.url,
        });
      }
      break;
    }
    case 'clear-site': {
      const hostname = hostnameFromHistoryUrl(entry.url);
      if (hostname !== null) {
        void historyBridge?.clearSite(hostname);
      }
      break;
    }
    case 'remove':
      void historyBridge?.deleteEntry(entry.id);
      break;
  }
}

// ------------------------------------------------------- clear dialog

function openClearHistoryDialog(): void {
  if (historyClearDialog === null) {
    return;
  }
  for (const radio of Array.from(historyClearRanges)) {
    radio.checked = radio.value === historyClearSelection;
  }
  historyClearDialog.hidden = false;
  historyClearDialogCancel?.focus();
}

function closeClearHistoryDialog(): void {
  if (historyClearDialog !== null) {
    historyClearDialog.hidden = true;
  }
}

/** The start of the selected clear range, or null for "all time". */
function clearRangeStart(range: HistoryClearRange, now: number): number | null {
  switch (range) {
    case 'hour':
      return now - 3_600_000;
    case 'day':
      return now - 24 * 3_600_000;
    case 'week':
      return now - 7 * 24 * 3_600_000;
    case 'month':
      return now - 28 * 24 * 3_600_000;
    case 'all':
      return null;
  }
}

function confirmClearHistory(): void {
  const now = Date.now();
  const start = clearRangeStart(historyClearSelection, now);
  closeClearHistoryDialog();
  if (start === null) {
    void historyBridge?.clear();
  } else {
    void historyBridge?.clearRange(start, now);
  }
}

function attachHistoryHandlers(): void {
  historyManagerSearch?.addEventListener('input', () => {
    historySearchQuery = historyManagerSearch.value;
    historyShownCount = HISTORY_PAGE_SIZE;
    renderHistoryManager();
  });
  historyManagerClear?.addEventListener('click', openClearHistoryDialog);
  historyManagerMore?.addEventListener('click', () => {
    historyShownCount += HISTORY_PAGE_SIZE;
    renderHistoryManager();
  });
  historyItemMenu?.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    const action = target?.dataset.action;
    if (action !== undefined) {
      handleHistoryItemMenuAction(action);
    }
  });
  historyClearDialogCancel?.addEventListener('click', closeClearHistoryDialog);
  historyClearDialogConfirm?.addEventListener('click', confirmClearHistory);
  historyClearDialog?.addEventListener('click', (event) => {
    if (event.target === historyClearDialog) {
      closeClearHistoryDialog();
    }
  });
  for (const radio of Array.from(historyClearRanges)) {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        historyClearSelection = radio.value as HistoryClearRange;
      }
    });
  }
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (historyClearDialog?.hidden === false) {
        closeClearHistoryDialog();
      }
      if (historyItemMenu?.hidden === false) {
        closeHistoryItemMenu();
      }
    }
  });
}

// ----------------------------------------------------------------------
// Downloads Manager
// ----------------------------------------------------------------------

/** Applies download state pushed from the main process. */
function applyDownloadsState(state: DownloadsState): void {
  downloadsState = state;
  renderDownloadsBadge();
  if (downloadsManagerActive) {
    renderDownloadsManager();
  }
}

/** Renders the toolbar Downloads badge with the active download count. */
function renderDownloadsBadge(): void {
  if (downloadsBadge === null) {
    return;
  }
  const items = downloadsState?.items ?? [];
  const active = items.filter(
    (item) =>
      item.state === 'pending' ||
      item.state === 'progressing' ||
      item.state === 'paused',
  ).length;
  if (active === 0) {
    downloadsBadge.hidden = true;
    downloadsBadge.textContent = '';
    return;
  }
  downloadsBadge.hidden = false;
  downloadsBadge.textContent = active > 99 ? '99+' : String(active);
}

function renderDownloadsManager(): void {
  if (downloadsManagerList === null || downloadsManagerEmpty === null) {
    return;
  }
  const items = searchDownloads(
    downloadsState?.items ?? [],
    downloadsSearchQuery,
  );
  if (items.length === 0) {
    downloadsManagerEmpty.hidden = false;
    downloadsManagerList.replaceChildren();
    return;
  }
  downloadsManagerEmpty.hidden = true;
  const fragment = document.createDocumentFragment();
  for (const item of items) {
    fragment.appendChild(buildDownloadItem(item));
  }
  downloadsManagerList.replaceChildren(fragment);
}

function buildDownloadItem(item: DownloadItem): HTMLElement {
  const li = document.createElement('li');
  li.className = `downloads-manager-item ${downloadStateView(item.state).className}`;
  li.dataset.downloadId = item.id;

  const main = document.createElement('div');
  main.className = 'downloads-manager-item-main';

  const filename = document.createElement('span');
  filename.className = 'downloads-manager-item-filename';
  filename.textContent = item.filename;
  filename.title = item.filename;

  const meta = document.createElement('span');
  meta.className = 'downloads-manager-item-meta';
  const source = downloadSourceFor(item);
  const size = formatDownloadSize(item);
  const stateLabel = downloadStateView(item.state).label;
  const parts: string[] = [stateLabel];
  if (source !== null) {
    parts.push(source);
  }
  if (size !== null) {
    parts.push(size);
  }
  if (item.executable) {
    parts.push('Executable file');
  }
  meta.textContent = parts.join(' \u00b7 ');

  main.append(filename, meta);

  // Live progress for active downloads.
  const progress =
    item.state === 'progressing' ||
    item.state === 'pending' ||
    item.state === 'paused';
  const progressBar = document.createElement('div');
  progressBar.className = 'downloads-progress';
  progressBar.hidden = !progress;
  const track = document.createElement('div');
  track.className = 'downloads-progress-track';
  const fill = document.createElement('div');
  fill.className = 'downloads-progress-fill';
  if (item.totalBytes > 0 && item.totalBytes >= item.receivedBytes) {
    const pct = Math.round((item.receivedBytes / item.totalBytes) * 100);
    fill.style.width = `${String(pct)}%`;
    fill.setAttribute('aria-valuenow', String(pct));
  } else {
    fill.style.width = '0%';
    fill.setAttribute('aria-valuenow', '0');
  }
  track.setAttribute('role', 'progressbar');
  track.setAttribute('aria-label', `Progress for ${item.filename}`);
  track.appendChild(fill);
  progressBar.appendChild(track);
  li.appendChild(progressBar);

  // Error note for failed downloads.
  if (item.state === 'failed' && item.error !== null) {
    const error = document.createElement('span');
    error.className = 'downloads-manager-item-error';
    error.textContent = item.error;
    li.appendChild(error);
  }

  const actions = document.createElement('div');
  actions.className = 'downloads-manager-item-actions';

  if (item.state === 'progressing' || item.state === 'pending') {
    actions.appendChild(
      buildDownloadAction('Pause', () => {
        void downloadsBridge?.pause(item.id);
      }),
    );
    actions.appendChild(
      buildDownloadAction('Cancel', () => {
        void downloadsBridge?.cancel(item.id);
      }),
    );
  } else if (item.state === 'paused') {
    actions.appendChild(
      buildDownloadAction('Resume', () => {
        void downloadsBridge?.resume(item.id);
      }),
    );
    actions.appendChild(
      buildDownloadAction('Cancel', () => {
        void downloadsBridge?.cancel(item.id);
      }),
    );
  } else if (item.state === 'completed') {
    actions.appendChild(
      buildDownloadAction('Open', () => {
        void downloadsBridge?.open(item.id);
      }),
    );
    actions.appendChild(
      buildDownloadAction('Show in Folder', () => {
        void downloadsBridge?.show(item.id);
      }),
    );
    actions.appendChild(
      buildDownloadAction('Remove', () => {
        void downloadsBridge?.remove(item.id);
      }),
    );
  } else {
    actions.appendChild(
      buildDownloadAction('Remove', () => {
        void downloadsBridge?.remove(item.id);
      }),
    );
  }

  li.append(main, actions);
  return li;
}

function buildDownloadAction(label: string, onClick: () => void): HTMLElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'privacy-btn privacy-btn-ghost';
  button.textContent = label;
  button.addEventListener('click', onClick);
  return button;
}

/** A human-readable size summary, or null when no size is meaningful. */
function formatDownloadSize(item: DownloadItem): string | null {
  if (item.totalBytes > 0) {
    if (item.totalBytes >= item.receivedBytes) {
      return `${formatDownloadBytes(item.receivedBytes)} / ${formatDownloadBytes(item.totalBytes)}`;
    }
    return formatDownloadBytes(item.totalBytes);
  }
  if (item.receivedBytes > 0) {
    // The server did not announce a total; show honest "downloaded so far".
    return `${formatDownloadBytes(item.receivedBytes)} downloaded`;
  }
  return null;
}

/** Shows a subtle in-browser notice when a download completes. */
function showDownloadToast(info: { id: string; filename: string }): void {
  const toast = document.createElement('div');
  toast.className = 'download-toast';
  const icon = document.createElement('span');
  icon.className = 'download-toast-icon';
  icon.textContent = '\u2713';
  const text = document.createElement('span');
  text.className = 'download-toast-text';
  text.textContent = `Download complete: ${info.filename}`;
  const open = document.createElement('button');
  open.type = 'button';
  open.className = 'download-toast-action';
  open.textContent = 'Open';
  open.addEventListener('click', () => {
    void downloadsBridge?.open(info.id);
    toast.remove();
  });
  toast.append(icon, text, open);
  document.body.appendChild(toast);
  window.setTimeout(() => {
    toast.classList.add('leaving');
    window.setTimeout(() => {
      toast.remove();
    }, 300);
  }, 6000);
}

function attachDownloadsHandlers(): void {
  downloadsButton?.addEventListener('click', openDownloadsManager);
  downloadsManagerSearch?.addEventListener('input', () => {
    downloadsSearchQuery = downloadsManagerSearch.value;
    renderDownloadsManager();
  });
  downloadsManagerClear?.addEventListener('click', () => {
    void downloadsBridge?.clear('all');
  });
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
  attachBookmarkHandlers();
  attachHistoryHandlers();
  attachDownloadsHandlers();

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

  // Bookmarks: a single subscription at boot keeps the star, the toolbar, and
  // the Bookmark Manager in sync. The main process pushes on every mutation
  // and (throttled) on navigation.
  bookmarksBridge?.onStateChanged(applyBookmarkState);
  bookmarksBridge?.onOpenAddDialog(({ url, title }) => {
    showBookmarkDialog({ editing: null, url, title });
  });
  const bookmarkInitial = await bookmarksBridge?.getState();
  if (bookmarkInitial !== undefined) {
    applyBookmarkState(bookmarkInitial);
  }

  // History: a single subscription keeps the History Manager in sync. The
  // main process pushes immediately for mutations and (throttled) after
  // page visits.
  historyBridge?.onStateChanged(applyHistoryState);
  const historyInitial = await historyBridge?.getState();
  if (historyInitial !== undefined) {
    applyHistoryState(historyInitial);
  }

  // Downloads: a single subscription keeps the badge and the Downloads
  // Manager in sync. The main process pushes immediately for state changes
  // and throttles high-frequency progress updates.
  downloadsBridge?.onStateChanged(applyDownloadsState);
  downloadsBridge?.onCompleted(showDownloadToast);
  const downloadsInitial = await downloadsBridge?.getState();
  if (downloadsInitial !== undefined) {
    applyDownloadsState(downloadsInitial);
  }
}

void boot();
