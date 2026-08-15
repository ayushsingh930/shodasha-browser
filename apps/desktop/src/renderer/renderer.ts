/**
 * SHODASHA desktop - renderer UI.
 *
 * Runs inside the sandboxed renderer with context isolation. It renders the
 * browser chrome (toolbar, tab bar, content area) from state pushed by the
 * main process, and sends user commands over the preload bridge.
 *
 * Only the exposed `window.shodasha.browser` API is available; there is no
 * direct Node.js or filesystem access.
 */

import type { BrowserState, TabViewState } from '../shared/browserState.js';

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
    stop(): Promise<void>;
    newTab(): Promise<string>;
    closeTab(id: string): Promise<void>;
    activateTab(id: string): Promise<void>;
    onStateChanged(callback: (state: BrowserState) => void): () => void;
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

// ----------------------------------------------------------------------
// State
// ----------------------------------------------------------------------
let currentState: BrowserState = { tabs: [], activeTabId: null };
let addressEditing = false;

const bridge = window.shodasha?.browser;

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
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'tab' + (tab.active ? ' active' : '');
  el.dataset.tabId = tab.id;
  el.title = tab.title || tab.url || 'New tab';

  const favicon = document.createElement('span');
  favicon.className = 'tab-favicon';
  favicon.textContent = tab.favicon ? '' : '\u25cb';
  if (tab.favicon) {
    const img = document.createElement('img');
    img.src = tab.favicon;
    img.alt = '';
    favicon.replaceChildren(img);
  }
  el.appendChild(favicon);

  const title = document.createElement('span');
  title.className = 'tab-title';
  title.textContent = tab.title || tab.url || 'New tab';
  el.appendChild(title);

  if (tab.loading) {
    el.classList.add('loading');
  }

  const close = document.createElement('span');
  close.className = 'tab-close';
  close.textContent = '\u00d7';
  close.title = 'Close tab';
  close.addEventListener('click', (event) => {
    event.stopPropagation();
    void bridge?.closeTab(tab.id);
  });
  el.appendChild(close);

  el.addEventListener('click', () => {
    void bridge?.activateTab(tab.id);
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
  if (active === null) {
    contentFrame.classList.add('empty');
    contentFrame.replaceChildren();
    return;
  }
  contentFrame.classList.remove('empty');

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

// ----------------------------------------------------------------------
// Actions
// ----------------------------------------------------------------------
function submitAddress(): void {
  if (addressInput === null || bridge === undefined) {
    return;
  }
  const value = addressInput.value;
  if (value.trim().length === 0) {
    return;
  }
  addressEditing = false;
  addressInput.blur();
  void bridge.submitAddress(value);
}

function attachToolbarHandlers(): void {
  backButton?.addEventListener('click', () => void bridge?.goBack());
  forwardButton?.addEventListener('click', () => void bridge?.goForward());
  reloadButton?.addEventListener('click', () => void bridge?.reload());
  stopButton?.addEventListener('click', () => void bridge?.stop());
  newTabButton?.addEventListener('click', () => void bridge?.newTab());
  menuButton?.addEventListener('click', toggleMenu);

  addressInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submitAddress();
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
  }
  const menu = document.querySelector<HTMLElement>('#menu');
  if (menu !== null) {
    menu.classList.remove('open');
    menu.hidden = true;
  }
}

// ----------------------------------------------------------------------
// Boot
// ----------------------------------------------------------------------
function applyState(state: BrowserState): void {
  currentState = state;
  renderToolbar(state);
  renderTabs(state);
  renderContent(state);
}

async function boot(): Promise<void> {
  attachToolbarHandlers();
  attachMenuHandlers();
  if (bridge === undefined) {
    const root = document.querySelector<HTMLElement>('#app');
    if (root !== null) {
      root.textContent = 'Preload bridge unavailable.';
    }
    return;
  }
  bridge.onStateChanged(applyState);
  const initial = await bridge.getState();
  applyState(initial);
}

void boot();
