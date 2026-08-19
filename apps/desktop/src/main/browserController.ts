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
  Menu,
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
import {
  IPC,
  HISTORY_URL,
  DOWNLOADS_URL,
  internalPageInfoFor,
  isBlankTabUrl,
  isInternalPageUrl,
  type BrowserState,
  type TabViewState,
} from '../shared/browserState.js';
import {
  shortcutActionFor,
  type ShortcutAction,
  type ShortcutInput,
} from '../shared/shortcuts.js';
import { buildErrorPage } from './errorPage.js';
import type { HistoryRecorder } from './historyCoordinator.js';
import {
  destroyViewSafely,
  handleViewDestroyed,
} from './viewLifecycle.js';

/** Height reserved for the chrome (toolbar + tab bar). */
export const CHROME_HEIGHT = 88;

/** Height of the optional bookmarks toolbar row. */
export const BOOKMARKS_BAR_HEIGHT = 36;

export interface BrowserControllerOptions {
  /** The owning window. */
  readonly window: BrowserWindow;
  /** The tab state manager (core). */
  readonly manager: TabManager;
  /** The search engine used by the address bar. */
  readonly searchEngine?: { id: string; name: string; urlTemplate: string };
  /**
   * Called when the page context menu's "Bookmark this page" action fires,
   * with the page's URL and title (trusted, captured by the main process).
   */
  readonly onBookmarkPage?: (url: string, title: string) => void;
  /**
   * Called when the toggle-bookmarks-bar shortcut (Ctrl+Shift+B) is pressed
   * while a page has focus. The bookmark coordinator owns the preference.
   */
  readonly onToggleBookmarksBar?: () => void;
  /**
   * Returns whether the bookmarks toolbar is visible so the webview layout
   * leaves room for it below the tab bar.
   */
  readonly bookmarksBarVisible?: () => boolean;
  /**
   * Receives successful page navigations so the History Coordinator can record
   * visits. Never called from page content; the URL, title, and favicon all
   * come from trusted main-side events.
   */
  readonly historyRecorder?: HistoryRecorder;
}

/** A live tab: its core id plus its Electron view. */
interface LiveTab {
  readonly id: string;
  readonly view: WebContentsView;
  /**
   * Cached webContents reference. Safe to call `isDestroyed()` on forever,
   * even after the view/webContents pair is gone.
   */
  readonly wc: WebContents;
  /** Whether the view is attached to the window's content view. */
  attached: boolean;
  /** The last URL we explicitly navigated to (for error-page context). */
  lastRequestedUrl: string;
  /**
   * Bumped on every navigation initiation. Load events are only applied when
   * their captured sequence still matches, so a stale event from an
   * in-flight load can never overwrite a newer navigation (e.g. navigating to
   * a SHODASHA internal page while a web page is still loading).
   */
  navSeq: number;
  /** The sequence captured when the current webview load began. */
  activeSeq: number;
  /**
   * The id of the history entry recorded for the current page load, or null
   * when nothing recordable was loaded. Used to refresh the entry's title and
   * favicon after the page reports them.
   */
  historyEntryId: string | null;
}

export class BrowserController {
  private readonly window: BrowserWindow;
  private readonly manager: TabManager;
  private readonly searchEngine;
  private readonly logger: Logger;
  private readonly onBookmarkPage: ((url: string, title: string) => void) | undefined;
  private readonly onToggleBookmarksBar: (() => void) | undefined;
  private readonly bookmarksBarVisible: (() => boolean) | undefined;
  private readonly historyRecorder: HistoryRecorder | undefined;
  private readonly liveTabs = new Map<string, LiveTab>();
  private readonly chrome: WebContents;
  private readonly session: Session;
  private unsub: (() => void) | null = null;
  private disposed = false;

  public constructor(options: BrowserControllerOptions) {
    this.window = options.window;
    this.manager = options.manager;
    this.searchEngine = options.searchEngine ?? DEFAULT_SEARCH_ENGINE;
    this.onBookmarkPage = options.onBookmarkPage;
    this.onToggleBookmarksBar = options.onToggleBookmarksBar;
    this.bookmarksBarVisible = options.bookmarksBarVisible;
    this.historyRecorder = options.historyRecorder;
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
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.unsub?.();
    this.unsub = null;
    for (const tab of this.liveTabs.values()) {
      destroyViewSafely(tab, this.window);
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
    ipcMain.handle(IPC.hardReload, () => {
      this.activeTabHardReload();
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
    ipcMain.handle(IPC.reloadTab, (_e, id: unknown) => {
      this.reloadTab(String(id));
    });
    ipcMain.handle(IPC.duplicateTab, (_e, id: unknown) => {
      this.duplicateTab(String(id));
    });
    ipcMain.handle(IPC.closeOtherTabs, (_e, id: unknown) => {
      this.closeOtherTabs(String(id));
    });
    ipcMain.handle(IPC.closeTabsToRight, (_e, id: unknown) => {
      this.closeTabsToRight(String(id));
    });
    ipcMain.handle(IPC.reopenClosedTab, () => {
      this.reopenClosedTab();
    });
    ipcMain.handle(IPC.nextTab, () => {
      this.nextTab();
    });
    ipcMain.handle(IPC.prevTab, () => {
      this.prevTab();
    });
  }

  private handleSubmitAddress(input: string): void {
    const active = this.manager.activeTab;
    if (active === null) {
      return;
    }
    const trimmed = input.trim();
    const internal = internalPageInfoFor(trimmed);
    if (internal !== null) {
      // SHODASHA internal pages are never web URLs; route them directly.
      this.navigateInternal(active.id, internal.url);
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
    if (next === null) {
      // Never leave the browser without a valid active tab; open a fresh one.
      this.newTab();
    } else {
      this.ensureView(next);
    }
    this.relayout();
    this.pushState();
  }

  private closeActiveTab(): void {
    const active = this.manager.activeTab;
    if (active === null) {
      return;
    }
    this.closeTab(active.id);
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

  private nextTab(): void {
    const order = this.manager.list.map((t) => t.id);
    if (order.length === 0) {
      return;
    }
    const activeId = this.manager.activeTab?.id ?? null;
    const index = activeId === null ? -1 : order.indexOf(activeId);
    const next = order[(index + 1) % order.length];
    if (next !== undefined) {
      this.activateTab(next);
    }
  }

  private prevTab(): void {
    const order = this.manager.list.map((t) => t.id);
    if (order.length === 0) {
      return;
    }
    const activeId = this.manager.activeTab?.id ?? null;
    const index = activeId === null ? -1 : order.indexOf(activeId);
    const prev = order[(index - 1 + order.length) % order.length];
    if (prev !== undefined) {
      this.activateTab(prev);
    }
  }

  private duplicateTab(id: string): void {
    const source = this.manager.getTab(id);
    if (source === null) {
      return;
    }
    const newId = this.manager.duplicateTab(id);
    if (newId === null) {
      return;
    }
    this.ensureView(newId);
    const live = this.liveTabs.get(newId);
    if (live !== undefined && !isBlankTabUrl(source.url)) {
      this.loadInView(live, source.url, false);
    }
    this.relayout();
    this.pushState();
  }

  private reloadTab(id: string): void {
    const tab = this.liveTabs.get(id);
    if (tab === undefined || tab.wc.isDestroyed()) {
      return;
    }
    this.manager.setLoading(id, true);
    tab.wc.reload();
    this.pushState();
  }

  private reopenClosedTab(): void {
    const id = this.manager.reopenClosedTab();
    if (id === null) {
      return;
    }
    this.ensureView(id);
    const tab = this.manager.getTab(id);
    if (tab !== null && !isBlankTabUrl(tab.url)) {
      const live = this.liveTabs.get(id);
      if (live !== undefined) {
        this.loadInView(live, tab.url, false);
      }
    }
    this.relayout();
    this.pushState();
  }

  private closeOtherTabs(id: string): void {
    const before = this.manager.list.map((t) => t.id);
    this.manager.closeOtherTabs(id);
    for (const tid of before) {
      if (this.manager.getTab(tid) === null) {
        this.removeView(tid);
      }
    }
    this.ensureView(id);
    this.relayout();
    this.pushState();
  }

  private closeTabsToRight(id: string): void {
    const before = this.manager.list.map((t) => t.id);
    this.manager.closeTabsToRight(id);
    for (const tid of before) {
      if (this.manager.getTab(tid) === null) {
        this.removeView(tid);
      }
    }
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
      // The model already moved to the target entry; loading must not push a
      // new history entry (that would truncate the forward history).
      this.loadInView(tab, target, false);
    }
    this.pushState();
  }

  private activeTabReload(): void {
    const active = this.manager.activeTab;
    if (active === null) {
      return;
    }
    const tab = this.liveTabs.get(active.id);
    if (tab === undefined || tab.wc.isDestroyed()) {
      return;
    }
    this.manager.setLoading(active.id, true);
    tab.wc.reload();
    this.pushState();
  }

  private activeTabHardReload(): void {
    const active = this.manager.activeTab;
    if (active === null) {
      return;
    }
    const tab = this.liveTabs.get(active.id);
    if (tab === undefined || tab.wc.isDestroyed()) {
      return;
    }
    this.manager.setLoading(active.id, true);
    tab.wc.reloadIgnoringCache();
    this.pushState();
  }

  private activeTabStop(): void {
    const active = this.manager.activeTab;
    if (active === null) {
      return;
    }
    const tab = this.liveTabs.get(active.id);
    if (tab === undefined || tab.wc.isDestroyed()) {
      return;
    }
    tab.wc.stop();
    this.manager.setLoading(active.id, false);
    this.pushState();
  }

  // -------------------------------------------------------- shortcuts

  private handleShortcut(action: ShortcutAction): void {
    switch (action) {
      case 'new-tab':
        this.newTab();
        break;
      case 'close-tab':
        this.closeActiveTab();
        break;
      case 'reopen-tab':
        this.reopenClosedTab();
        break;
      case 'next-tab':
        this.nextTab();
        break;
      case 'prev-tab':
        this.prevTab();
        break;
      case 'focus-address':
        this.focusAddressBar();
        break;
      case 'reload':
        this.activeTabReload();
        break;
      case 'hard-reload':
        this.activeTabHardReload();
        break;
      case 'toggle-bookmarks-bar':
        this.onToggleBookmarksBar?.();
        break;
      case 'open-history':
        this.openHistoryPage();
        break;
      case 'open-downloads':
        this.openDownloadsPage();
        break;
    }
  }

  private focusAddressBar(): void {
    if (this.chrome.isDestroyed()) {
      return;
    }
    this.chrome.send(IPC.focusAddressBar);
  }

  /** Opens the SHODASHA History Manager in the active tab (Ctrl+H). */
  private openHistoryPage(): void {
    const active = this.manager.activeTab;
    if (active === null) {
      return;
    }
    this.navigateInternal(active.id, HISTORY_URL);
  }

  /** Opens the SHODASHA Downloads Manager in the active tab (Ctrl+J). */
  private openDownloadsPage(): void {
    const active = this.manager.activeTab;
    if (active === null) {
      return;
    }
    this.navigateInternal(active.id, DOWNLOADS_URL);
  }

  /**
   * Reports a committed page navigation to the History Coordinator. The URL,
   * title, and favicon are all trusted main-side values. A future private-tab
   * feature will pass `{ private: true }` here so those visits are skipped.
   */
  private recordHistoryVisit(live: LiveTab, url: string): string | null {
    const recorder = this.historyRecorder;
    if (recorder === undefined) {
      return null;
    }
    const tab = this.manager.getTab(live.id);
    return recorder.recordVisit({
      url,
      title: tab?.title ?? '',
      favicon: tab?.favicon ?? null,
    });
  }

  // ------------------------------------------------------------- views

  private ensureView(id: string): void {
    if (this.disposed || this.window.isDestroyed()) {
      return;
    }
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
      wc: view.webContents,
      attached: true,
      lastRequestedUrl: '',
      navSeq: 0,
      activeSeq: 0,
      historyEntryId: null,
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
    const wc = live.wc;

    // If the webContents is destroyed externally (renderer crash, window
    // teardown), drop the stale reference immediately so no later cleanup
    // ever touches the destroyed object.
    wc.once('destroyed', () => {
      this.onViewDestroyed(live);
    });

    // Browser shortcuts apply even while a page has keyboard focus. Only the
    // browser's own shortcuts are intercepted; everything else reaches the page.
    wc.on('before-input-event', (event, input) => {
      const inputView: ShortcutInput = {
        key: input.key,
        ctrl: input.control,
        shift: input.shift,
        alt: input.alt,
        meta: input.meta,
        type: input.type,
      };
      const action = shortcutActionFor(inputView);
      if (action !== null) {
        event.preventDefault();
        this.handleShortcut(action);
      }
    });

    wc.on('did-start-loading', () => {
      this.manager.setLoading(live.id, true);
    });

    wc.on('did-stop-loading', () => {
      this.manager.setLoading(live.id, false);
    });

    wc.on('did-navigate', (_e, url) => {
      // Ignore load events from a navigation that has been superseded by a
      // newer one (e.g. an in-flight web load when an internal page opened).
      if (live.activeSeq !== live.navSeq) {
        return;
      }
      this.manager.setUrl(live.id, url);
      live.lastRequestedUrl = url;
      this.manager.setSecurityState(live.id, securityStateFor(url));
      live.historyEntryId = this.recordHistoryVisit(live, url);
    });

    wc.on('did-navigate-in-page', (_e, url, isMainFrame) => {
      if (isMainFrame) {
        if (live.activeSeq !== live.navSeq) {
          return;
        }
        this.manager.setUrl(live.id, url);
        this.manager.setSecurityState(live.id, securityStateFor(url));
        // Same-document navigations are genuine page visits too; record them
        // the same way a full navigation is recorded.
        live.historyEntryId = this.recordHistoryVisit(live, url);
      }
    });

    wc.on('did-fail-load', (_e, errorCode, errorDescription, validatedUrl) => {
      // Ignore ERR_ABORTED caused by user actions (stop, new nav).
      if (errorCode === -3) {
        return;
      }
      if (live.activeSeq !== live.navSeq) {
        return;
      }
      const error = classifyLoadError(errorCode);
      this.showErrorPage(live, error, validatedUrl || live.lastRequestedUrl);
    });

    wc.on('page-title-updated', (_e, title) => {
      this.manager.setTitle(live.id, title);
      if (live.historyEntryId !== null) {
        this.historyRecorder?.updateVisitTitle(live.historyEntryId, title);
      }
    });

    wc.on('page-favicon-updated', (_e, favicons) => {
      const favicon = favicons[0] ?? null;
      this.manager.setFavicon(live.id, favicon);
      if (live.historyEntryId !== null) {
        this.historyRecorder?.updateVisitFavicon(live.historyEntryId, favicon);
      }
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

    // A right-click on a page opens a native menu with "Bookmark this page".
    // The page's own JS context menu is never modified or injected into; the
    // current page URL comes from Electron's params (trusted main-side data).
    wc.on('context-menu', (_event, params) => {
      if (this.onBookmarkPage === undefined) {
        return;
      }
      const pageUrl = params.pageURL.length > 0 ? params.pageURL : null;
      const target = pageUrl ?? this.manager.getTab(live.id)?.url ?? '';
      if (target.length === 0 || isInternalPageUrl(target)) {
        return;
      }
      const title = this.manager.getTab(live.id)?.title ?? '';
      const menu = Menu.buildFromTemplate([
        {
          label: 'Bookmark this page',
          click: () => {
            this.onBookmarkPage?.(target, title);
          },
        },
      ]);
      menu.popup({ window: this.window });
    });
  }

  private loadInView(live: LiveTab, url: string, recordHistory = true): void {
    if (live.wc.isDestroyed()) {
      return;
    }
    const internal = internalPageInfoFor(url);
    if (internal !== null) {
      // Internal pages are rendered by the chrome UI, never by the webview.
      this.navigateInternal(live.id, internal.url, recordHistory);
      return;
    }
    if (!isAllowedNavigationUrl(url)) {
      this.showErrorPage(
        live,
        { kind: 'blocked', title: 'Navigation blocked.', message: 'This address type is not supported.' },
        url,
      );
      return;
    }
    live.lastRequestedUrl = url;
    if (recordHistory) {
      this.manager.beginNavigation(live.id, url);
    } else {
      // Restored/duplicated tabs already carry their history; do not re-record.
      this.manager.setUrl(live.id, url);
      this.manager.setLoading(live.id, true);
    }
    // Bump the navigation sequence so load events from a superseded load can
    // never overwrite this newer navigation once it starts.
    live.navSeq += 1;
    live.activeSeq = live.navSeq;
    void live.wc.loadURL(url).catch(() => {
      // did-fail-load will surface the user-facing error; swallow here.
    });
    this.relayout();
  }

  /**
   * Navigates a tab to a SHODASHA internal page. The page is rendered by the
   * chrome UI (like the new-tab page), so nothing is loaded into the webview;
   * the tab model records the internal URL and its security state.
   */
  private navigateInternal(tabId: string, url: string, recordHistory = true): void {
    const info = internalPageInfoFor(url);
    if (this.manager.getTab(tabId) === null || info === null) {
      return;
    }
    // Internal pages are rendered by the chrome UI, so no webview load begins.
    // Bump the sequence: any in-flight webview load for this tab is now stale,
    // and its load events must not overwrite the internal page. Do NOT adopt
    // the new sequence as activeSeq — that stays with the abandoned webview
    // load so its stale events are rejected by the equality guard.
    const live = this.liveTabs.get(tabId);
    if (live !== undefined) {
      live.navSeq += 1;
    }
    if (recordHistory) {
      this.manager.beginNavigation(tabId, info.url);
    } else {
      this.manager.setUrl(tabId, info.url);
      this.manager.setLoading(tabId, false);
    }
    this.manager.setTitle(tabId, info.title);
    this.manager.setSecurityState(tabId, 'internal');
    this.relayout();
    this.pushState();
  }

  private showErrorPage(
    live: LiveTab,
    error: NavigationError,
    url: string,
  ): void {
    if (live.wc.isDestroyed()) {
      return;
    }
    this.manager.endNavigation(live.id, 'error', error.message);
    const errorUrl = buildErrorPage(error, url);
    void live.wc.loadURL(errorUrl).catch(() => {
      // The error page itself failing is not user-visible; ignore.
    });
    this.relayout();
  }

  private removeView(id: string): void {
    const live = this.liveTabs.get(id);
    if (live === undefined) {
      return;
    }
    destroyViewSafely(live, this.window);
    this.liveTabs.delete(id);
  }

  /**
   * Called when a tab's webContents is destroyed externally. Removes the
   * stale reference so later cleanup never touches the destroyed object.
   * Never destroys anything itself, so it cannot recurse.
   */
  private onViewDestroyed(live: LiveTab): void {
    if (this.disposed) {
      return;
    }
    const removed = handleViewDestroyed(live.id, this.liveTabs);
    if (removed !== null) {
      this.relayout();
      this.pushState();
    }
  }

  // --------------------------------------------------------- layout

  /** Recomputes webview bounds after chrome layout changes (window resize,
   * tab changes, bookmarks bar toggles). */
  public relayout(): void {
    const [width, height] = this.window.getContentSize();
    if (width === undefined || height === undefined) {
      return;
    }
    // Leave room for the optional bookmarks toolbar below the tab bar.
    const top = CHROME_HEIGHT + (this.bookmarksBarVisible?.() === true ? BOOKMARKS_BAR_HEIGHT : 0);
    for (const live of this.liveTabs.values()) {
      // A view whose webContents died externally must never be touched.
      if (live.wc.isDestroyed()) {
        continue;
      }
      const tab = this.manager.getTab(live.id);
      if (tab === null) {
        live.view.setVisible(false);
        continue;
      }
      // A blank tab renders the SHODASHA new-tab page in the chrome, and an
      // internal page (e.g. the Privacy Center) is also chrome-rendered, so
      // both keep their webview hidden.
      const isBlank = tab.active && isBlankTabUrl(tab.url) && !tab.showErrorPage;
      const isInternal = tab.active && isInternalPageUrl(tab.url);
      if (tab.active && !isBlank && !isInternal) {
        live.view.setBounds({ x: 0, y: top, width, height: height - top });
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
    return {
      tabs,
      activeTabId: this.manager.activeTab?.id ?? null,
      canReopenClosedTab: this.manager.canReopenClosedTab,
    };
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
  if (isInternalPageUrl(url)) {
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
