/**
 * BrowserController: wires the platform-agnostic core TabManager onto
 * Electron's `WebContentsView` per tab.
 *
 * Responsibilities:
 * - Renderer (chrome UI) lives in the BrowserWindow's own webContents.
 * - Each tab maps to a `WebContentsView` added to the window's content view.
 * - Handles navigation, security, permissions, downloads, and layout.
 * - Pushes serialized state to the renderer so the UI stays in sync.
 */

import {
  app,
  WebContentsView,
  ipcMain,
  type BrowserWindow,
  type WebContents,
  type Session,
} from 'electron';
import { Logger, classifyAddressInput, buildSearchUrl, type TabManager } from '@shodasha/core';
import { DEFAULT_SEARCH_ENGINE } from '@shodasha/core';
import { classifyLoadError } from '@shodasha/core';
import type { NavigationError } from '@shodasha/core';
import { IPC, type BrowserState, type TabViewState } from '../shared/browserState.js';
import { buildErrorPage } from './errorPage.js';

/** Height reserved for the chrome (toolbar + tab bar). */
export const CHROME_HEIGHT = 96;

export interface BrowserControllerOptions {
  /** The owning window. */
  readonly window: BrowserWindow;
  /** The tab state manager (core). */
  readonly manager: TabManager;
  /** The search engine used by the address bar. */
  readonly searchEngine?: { id: string; name: string; urlTemplate: string };
}

/** A live tab: its core id plus its Electron view. */
interface LiveTab {
  readonly id: string;
  readonly view: WebContentsView;
  /** The last URL we explicitly navigated to (for error-page context). */
  lastRequestedUrl: string;
}

export class BrowserController {
  private readonly window: BrowserWindow;
  private readonly manager: TabManager;
  private readonly searchEngine;
  private readonly logger: Logger;
  private readonly liveTabs = new Map<string, LiveTab>();
  private readonly chrome: WebContents;
  private readonly session: Session;
  private unsub: (() => void) | null = null;

  public constructor(options: BrowserControllerOptions) {
    this.window = options.window;
    this.manager = options.manager;
    this.searchEngine = options.searchEngine ?? DEFAULT_SEARCH_ENGINE;
    this.logger = new Logger({ level: 'info' });
    this.chrome = options.window.webContents;
    this.session = this.chrome.session;
  }

  /** Initializes the controller: wires IPC, events, and the initial tab. */
  public init(): void {
    this.installIpcHandlers();
    this.installSecurity();
    this.installWindowHandlers();
    this.unsub = this.manager.subscribe(() => {
      this.pushState();
    });

    // Seed one blank tab and give the UI time to load.
    const seedId = this.manager.createTab({ url: '', activate: true });
    this.ensureView(seedId);

    this.chrome.once('did-finish-load', () => {
      this.pushState();
    });
  }

  /** Releases all resources (views, listeners). Called on window close. */
  public dispose(): void {
    this.unsub?.();
    for (const tab of this.liveTabs.values()) {
      this.destroyView(tab);
    }
    this.liveTabs.clear();
    this.manager.clear();
  }

  // ------------------------------------------------------------------ IPC

  private installIpcHandlers(): void {
    ipcMain.handle(IPC.getState, () => this.serializeState());
    ipcMain.handle(IPC.submitAddress, (_e, input: unknown) => {
      this.handleSubmitAddress(String(input));
    });
    ipcMain.handle(IPC.goBack, () => {
      this.activeTabNavigate('back');
    });
    ipcMain.handle(IPC.goForward, () => {
      this.activeTabNavigate('forward');
    });
    ipcMain.handle(IPC.reload, () => {
      this.activeTabReload();
    });
    ipcMain.handle(IPC.stop, () => {
      this.activeTabStop();
    });
    ipcMain.handle(IPC.newTab, () => {
      this.newTab();
    });
    ipcMain.handle(IPC.closeTab, (_e, id: unknown) => {
      this.closeTab(String(id));
    });
    ipcMain.handle(IPC.activateTab, (_e, id: unknown) => {
      this.activateTab(String(id));
    });
  }

  private handleSubmitAddress(input: string): void {
    const active = this.manager.activeTab;
    if (active === null) {
      return;
    }
    const interpretation = classifyAddressInput(input);
    let target: string;
    if (interpretation.kind === 'url' && interpretation.url !== null) {
      target = interpretation.url;
    } else {
      target = buildSearchUrl(this.searchEngine, interpretation.query ?? '');
    }
    this.navigate(active.id, target);
  }

  private navigate(tabId: string, url: string): void {
    const tab = this.liveTabs.get(tabId);
    if (tab === undefined) {
      return;
    }
    this.loadInView(tab, url);
  }

  private newTab(): string {
    const id = this.manager.createTab({ url: '', activate: true });
    this.ensureView(id);
    return id;
  }

  private closeTab(id: string): void {
    const next = this.manager.closeTab(id);
    this.removeView(id);
    if (next !== null) {
      this.ensureView(next);
    }
    this.relayout();
    this.pushState();
  }

  private activateTab(id: string): void {
    if (this.manager.getTab(id) === null) {
      return;
    }
    this.manager.setActiveTab(id);
    this.ensureView(id);
    this.relayout();
    this.pushState();
  }

  private activeTabNavigate(direction: 'back' | 'forward'): void {
    const active = this.manager.activeTab;
    if (active === null) {
      return;
    }
    const target = this.manager.navigateHistory(active.id, direction);
    if (target === null) {
      return;
    }
    const tab = this.liveTabs.get(active.id);
    if (tab !== undefined) {
      this.loadInView(tab, target);
    }
    this.pushState();
  }

  private activeTabReload(): void {
    const active = this.manager.activeTab;
    if (active === null) {
      return;
    }
    const tab = this.liveTabs.get(active.id);
    if (tab === undefined) {
      return;
    }
    this.manager.setLoading(active.id, true);
    tab.view.webContents.reload();
    this.pushState();
  }

  private activeTabStop(): void {
    const active = this.manager.activeTab;
    if (active === null) {
      return;
    }
    const tab = this.liveTabs.get(active.id);
    if (tab === undefined) {
      return;
    }
    tab.view.webContents.stop();
    this.manager.setLoading(active.id, false);
    this.pushState();
  }

  // ------------------------------------------------------------- views

  private ensureView(id: string): void {
    if (this.liveTabs.has(id)) {
      return;
    }
    const view = new WebContentsView({
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
      },
    });
    this.window.contentView.addChildView(view);
    const live: LiveTab = {
      id,
      view,
      lastRequestedUrl: '',
    };
    this.liveTabs.set(id, live);
    this.wireView(live);

    const tab = this.manager.getTab(id);
    if (tab !== null && tab.url.length > 0 && tab.url !== 'about:blank') {
      this.loadInView(live, tab.url);
    }
    this.relayout();
  }

  private wireView(live: LiveTab): void {
    const wc = live.view.webContents;

    wc.on('did-start-loading', () => {
      this.manager.setLoading(live.id, true);
    });

    wc.on('did-stop-loading', () => {
      this.manager.setLoading(live.id, false);
    });

    wc.on('did-navigate', (_e, url) => {
      this.manager.setUrl(live.id, url);
      live.lastRequestedUrl = url;
      this.manager.setSecurityState(live.id, securityStateFor(url));
    });

    wc.on('did-navigate-in-page', (_e, url, isMainFrame) => {
      if (isMainFrame) {
        this.manager.setUrl(live.id, url);
        this.manager.setSecurityState(live.id, securityStateFor(url));
      }
    });

    wc.on('did-fail-load', (_e, errorCode, errorDescription, validatedUrl) => {
      // Ignore ERR_ABORTED caused by user actions (stop, new nav).
      if (errorCode === -3) {
        return;
      }
      const error = classifyLoadError(errorCode);
      this.showErrorPage(live, error, validatedUrl || live.lastRequestedUrl);
    });

    wc.on('page-title-updated', (_e, title) => {
      this.manager.setTitle(live.id, title);
    });

    wc.on('page-favicon-updated', (_e, favicons) => {
      const favicon = favicons[0] ?? null;
      this.manager.setFavicon(live.id, favicon);
    });

    // Intercept navigations initiated by the page (links/scripts).
    wc.on('will-navigate', (event, url) => {
      if (!isAllowedNavigationUrl(url)) {
        event.preventDefault();
        this.logger.warn('security', 'navigation', 'blocked disallowed navigation');
        return;
      }
    });

    // Open target=_blank / window.open in a new SHODASHA tab.
    wc.setWindowOpenHandler(({ url }) => {
      const id = this.manager.createTab({ url: '', activate: true });
      this.ensureView(id);
      const liveTab = this.liveTabs.get(id);
      if (liveTab !== undefined) {
        this.loadInView(liveTab, url);
      }
      return { action: 'deny' };
    });
  }

  private loadInView(live: LiveTab, url: string): void {
    if (!isAllowedNavigationUrl(url)) {
      this.showErrorPage(
        live,
        { kind: 'blocked', title: 'Navigation blocked.', message: 'This address type is not supported.' },
        url,
      );
      return;
    }
    live.lastRequestedUrl = url;
    this.manager.beginNavigation(live.id, url);
    void live.view.webContents.loadURL(url).catch(() => {
      // did-fail-load will surface the user-facing error; swallow here.
    });
  }

  private showErrorPage(
    live: LiveTab,
    error: NavigationError,
    url: string,
  ): void {
    this.manager.endNavigation(live.id, 'error', error.message);
    const errorUrl = buildErrorPage(error, url);
    void live.view.webContents.loadURL(errorUrl).catch(() => {
      // The error page itself failing is not user-visible; ignore.
    });
  }

  private removeView(id: string): void {
    const live = this.liveTabs.get(id);
    if (live === undefined) {
      return;
    }
    this.destroyView(live);
    this.liveTabs.delete(id);
  }

  private destroyView(live: LiveTab): void {
    // Remove from the window and close to free the renderer process.
    this.window.contentView.removeChildView(live.view);
    live.view.webContents.close({ waitForBeforeUnload: false });
  }

  // --------------------------------------------------------- layout

  private relayout(): void {
    const [width, height] = this.window.getContentSize();
    if (width === undefined || height === undefined) {
      return;
    }
    for (const live of this.liveTabs.values()) {
      const active = this.manager.getTab(live.id)?.active === true;
      if (active) {
        live.view.setBounds({ x: 0, y: CHROME_HEIGHT, width, height: height - CHROME_HEIGHT });
        live.view.setVisible(true);
      } else {
        live.view.setVisible(false);
      }
    }
  }

  private installWindowHandlers(): void {
    this.window.on('resize', () => {
      this.relayout();
    });
  }

  // -------------------------------------------------------- security

  private installSecurity(): void {
    // Never auto-grant sensitive permissions.
    this.session.setPermissionRequestHandler((_wc, _permission, callback) => {
      callback(false);
    });

    // Deny certificate errors (never bypass HTTPS/certificate security).
    app.on(
      'certificate-error',
      (event, _webContents, _url, _error, _certificate, callback) => {
        event.preventDefault();
        callback(false);
      },
    );

    // Block all downloads for now (a real download manager comes later).
    this.session.on('will-download', (event) => {
      event.preventDefault();
    });
  }

  // --------------------------------------------------------- state

  private serializeState(): BrowserState {
    const tabs: TabViewState[] = this.manager.list.map((tab) => ({
      id: tab.id,
      url: tab.url,
      title: tab.title,
      loading: tab.loading,
      active: tab.active,
      favicon: tab.favicon,
      securityState: tab.securityState,
      error: tab.error,
      showErrorPage: tab.showErrorPage,
      canGoBack: this.manager.canGoBackFor(tab.id),
      canGoForward: this.manager.canGoForwardFor(tab.id),
    }));
    return { tabs, activeTabId: this.manager.activeTab?.id ?? null };
  }

  private pushState(): void {
    if (this.chrome.isDestroyed()) {
      return;
    }
    this.chrome.send(IPC.stateChanged, this.serializeState());
  }
}

/** Whether a URL may be loaded by SHODASHA. */
function isAllowedNavigationUrl(url: string): boolean {
  if (url === 'about:blank' || url.startsWith('about:blank')) {
    return true;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Derive a basic security state from a URL scheme. */
function securityStateFor(url: string): 'secure' | 'insecure' | 'internal' | 'none' {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:') {
      return 'secure';
    }
    if (parsed.protocol === 'http:') {
      return 'insecure';
    }
    return 'internal';
  } catch {
    return 'none';
  }
}
