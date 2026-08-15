/**
 * TabManager: pure, observable tab-state management.
 *
 * The TabManager owns the array of {@link Tab} objects and the identity of
 * the active tab. It is fully platform-agnostic: hosts (Electron) subscribe
 * to changes and map the state onto real web contents. Keeping this logic
 * pure makes it easy to unit-test and to reuse on other platforms.
 */

import type { Tab, NavigationHistory, SecurityState } from './tabModel.js';
import {
  currentHistoryUrl,
  emptyHistory,
  goBack,
  goForward,
  canGoBack,
  canGoForward,
  pushNavigation,
} from './tabModel.js';

/** An event describing a change to the tab set. */
export type TabEvent =
  | { type: 'tabs-changed' }
  | { type: 'tab-updated'; tabId: string }
  | { type: 'active-tab-changed'; tabId: string };

/** Listener for tab events. */
export type TabListener = (event: TabEvent) => void;

/** Maximum number of recently-closed tabs remembered for "Reopen closed tab". */
export const MAX_CLOSED_TABS = 20;

/** Snapshot of a tab that was closed, enough to restore it on reopen. */
interface ClosedTab {
  readonly url: string;
  readonly title: string;
  readonly favicon: string | null;
  readonly securityState: SecurityState;
  readonly history: NavigationHistory;
}

export interface CreateTabOptions {
  /** Initial URL to load (may be empty for a blank tab). */
  readonly url?: string;
  /** Whether this tab should become active immediately. */
  readonly activate?: boolean;
}

/**
 * Creates a new unique tab identifier.
 */
function createId(): string {
  return `tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export class TabManager {
  private readonly tabs: Tab[] = [];
  private activeTabId: string | null = null;
  private readonly closedTabs: ClosedTab[] = [];
  private readonly listeners = new Set<TabListener>();

  /** All tabs, in creation order (oldest first, the left-to-right order). */
  public get list(): readonly Tab[] {
    return this.tabs;
  }

  /** The active tab, or `null` when there are no tabs. */
  public get activeTab(): Tab | null {
    if (this.activeTabId === null) {
      return null;
    }
    return this.tabs.find((t) => t.id === this.activeTabId) ?? null;
  }

  /** Returns the tab with the given id, or `null`. */
  public getTab(tabId: string): Tab | null {
    return this.tabs.find((t) => t.id === tabId) ?? null;
  }

  /** Number of open tabs. */
  public get size(): number {
    return this.tabs.length;
  }

  /** Subscribes a listener to tab events. Returns an unsubscribe function. */
  public subscribe(listener: TabListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Creates a new tab.
   *
   * @returns The id of the newly created tab.
   */
  public createTab(options: CreateTabOptions = {}): string {
    const id = createId();
    const url = options.url ?? '';
    const tab: Tab = {
      id,
      url,
      title: '',
      loading: url.length > 0,
      active: false,
      favicon: null,
      securityState: securityForUrl(url),
      error: null,
      showErrorPage: false,
      // A tab created with an initial URL starts its history at that URL
      // (no back target). A blank tab starts with a single empty entry.
      history:
        url.length > 0 ? { entries: [url], index: 0 } : emptyHistory(),
    };
    this.tabs.push(tab);
    this.emit({ type: 'tabs-changed' });
    if (options.activate ?? true) {
      this.setActiveTab(id);
    }
    return id;
  }

  /**
   * Closes a tab. If the active tab is closed, activates a neighbouring tab.
   * Returns the id of the newly-active tab, or `null` when none remains.
   */
  public closeTab(tabId: string): string | null {
    const index = this.tabs.findIndex((t) => t.id === tabId);
    if (index === -1) {
      return this.activeTabId;
    }
    const wasActive = this.tabs[index]?.active === true;
    this.removeTab(tabId);

    if (this.tabs.length === 0) {
      this.activeTabId = null;
      this.emit({ type: 'tabs-changed' });
      return null;
    }

    if (wasActive) {
      // Activate the nearest neighbour (prefer the one now at `index`).
      const nextIndex = Math.min(index, this.tabs.length - 1);
      const next = this.tabs[nextIndex];
      if (next !== undefined) {
        this.setActiveTab(next.id);
      }
      return this.activeTabId;
    }
    this.emit({ type: 'tabs-changed' });
    return this.activeTabId;
  }

  /**
   * Closes every tab except the one with the given id. The kept tab is made
   * active. Tabs closed here are still candidates for "Reopen closed tab".
   */
  public closeOtherTabs(tabId: string): void {
    if (this.getTab(tabId) === null) {
      return;
    }
    // Iterate backwards so removal never shifts an unvisited index.
    for (let i = this.tabs.length - 1; i >= 0; i -= 1) {
      const tab = this.tabs[i];
      if (tab !== undefined && tab.id !== tabId) {
        this.removeTab(tab.id);
      }
    }
    this.setActiveTab(tabId);
    this.emit({ type: 'tabs-changed' });
  }

  /**
   * Closes every tab positioned to the right of the given tab (later in the
   * tab strip). If the active tab was one of the closed tabs, the kept tab is
   * activated.
   */
  public closeTabsToRight(tabId: string): void {
    const index = this.tabs.findIndex((t) => t.id === tabId);
    if (index === -1) {
      return;
    }
    for (let i = this.tabs.length - 1; i > index; i -= 1) {
      const tab = this.tabs[i];
      if (tab !== undefined) {
        this.removeTab(tab.id);
      }
    }
    if (this.activeTabId === null || this.getTab(this.activeTabId) === null) {
      this.setActiveTab(tabId);
    }
    this.emit({ type: 'tabs-changed' });
  }

  /**
   * Duplicates the given tab (URL, title, favicon, history) and inserts the
   * copy directly to its right. The copy becomes the active tab.
   *
   * @returns The id of the new tab, or `null` when the source tab is missing.
   */
  public duplicateTab(tabId: string): string | null {
    const index = this.tabs.findIndex((t) => t.id === tabId);
    const source = this.tabs[index];
    if (source === undefined) {
      return null;
    }
    const id = createId();
    const copy: Tab = {
      id,
      url: source.url,
      title: source.title,
      loading: false,
      active: false,
      favicon: source.favicon,
      securityState: source.securityState,
      error: null,
      showErrorPage: false,
      history: source.history,
    };
    this.tabs.splice(index + 1, 0, copy);
    this.emit({ type: 'tabs-changed' });
    this.setActiveTab(id);
    return id;
  }

  /** Whether there is a recently-closed tab to reopen. */
  public get canReopenClosedTab(): boolean {
    return this.closedTabs.length > 0;
  }

  /**
   * Reopens the most recently closed tab (e.g. Ctrl+Shift+T). The restored tab
   * keeps its URL, title, favicon, and navigation history, and becomes active.
   *
   * @returns The id of the reopened tab, or `null` when nothing is available.
   */
  public reopenClosedTab(): string | null {
    const closed = this.closedTabs.pop();
    if (closed === undefined) {
      return null;
    }
    const id = createId();
    const tab: Tab = {
      id,
      url: closed.url,
      title: closed.title,
      loading: false,
      active: false,
      favicon: closed.favicon,
      securityState: closed.securityState,
      error: null,
      showErrorPage: false,
      history: closed.history,
    };
    this.tabs.push(tab);
    this.emit({ type: 'tabs-changed' });
    this.setActiveTab(id);
    return id;
  }

  /**
   * Removes a tab from the model, remembering it for "Reopen closed tab" when
   * it is not a blank tab. Does not emit an event; callers emit once.
   */
  private removeTab(tabId: string): void {
    const index = this.tabs.findIndex((t) => t.id === tabId);
    const tab = this.tabs[index];
    if (tab === undefined) {
      return;
    }
    if (tab.url.length > 0) {
      this.closedTabs.push({
        url: tab.url,
        title: tab.title,
        favicon: tab.favicon,
        securityState: tab.securityState,
        history: tab.history,
      });
      if (this.closedTabs.length > MAX_CLOSED_TABS) {
        this.closedTabs.shift();
      }
    }
    this.tabs.splice(index, 1);
  }

  /** Makes the given tab the active tab. */
  public setActiveTab(tabId: string): void {
    const tab = this.getTab(tabId);
    if (tab === undefined || tab === null) {
      return;
    }
    let changed = false;
    for (const t of this.tabs) {
      if (t.id === tabId && !t.active) {
        t.active = true;
        changed = true;
      } else if (t.id !== tabId && t.active) {
        t.active = false;
        changed = true;
      }
    }
    this.activeTabId = tabId;
    if (changed) {
      this.emit({ type: 'active-tab-changed', tabId });
    }
  }

  /**
   * Marks a tab as loading and records the navigation target.
   */
  public beginNavigation(tabId: string, url: string): void {
    const tab = this.getTab(tabId);
    if (tab === null) {
      return;
    }
    tab.url = url;
    tab.loading = true;
    tab.error = null;
    tab.showErrorPage = false;
    tab.history = pushNavigation(tab.history, url);
    tab.securityState = securityForUrl(url);
    this.emit({ type: 'tab-updated', tabId });
  }

  /** Marks a tab as finished loading (successfully or with an error). */
  public endNavigation(
    tabId: string,
    result: 'success' | 'error',
    errorMessage: string | null = null,
  ): void {
    const tab = this.getTab(tabId);
    if (tab === null) {
      return;
    }
    tab.loading = false;
    if (result === 'error') {
      tab.error = errorMessage;
      tab.showErrorPage = true;
    }
    this.emit({ type: 'tab-updated', tabId });
  }

  /** Marks a tab as loading (e.g. after reload). */
  public setLoading(tabId: string, loading: boolean): void {
    const tab = this.getTab(tabId);
    if (tab === null) {
      return;
    }
    tab.loading = loading;
    this.emit({ type: 'tab-updated', tabId });
  }

  /** Updates the URL of a tab (e.g. after a redirect). */
  public setUrl(tabId: string, url: string): void {
    const tab = this.getTab(tabId);
    if (tab === null) {
      return;
    }
    tab.url = url;
    tab.securityState = securityForUrl(url);
    this.emit({ type: 'tab-updated', tabId });
  }

  /** Updates the title of a tab. */
  public setTitle(tabId: string, title: string): void {
    const tab = this.getTab(tabId);
    if (tab === null) {
      return;
    }
    tab.title = title;
    this.emit({ type: 'tab-updated', tabId });
  }

  /** Updates the favicon of a tab. */
  public setFavicon(tabId: string, favicon: string | null): void {
    const tab = this.getTab(tabId);
    if (tab === null) {
      return;
    }
    tab.favicon = favicon;
    this.emit({ type: 'tab-updated', tabId });
  }

  /** Sets the security state of a tab. */
  public setSecurityState(tabId: string, state: SecurityState): void {
    const tab = this.getTab(tabId);
    if (tab === null) {
      return;
    }
    tab.securityState = state;
    this.emit({ type: 'tab-updated', tabId });
  }

  /**
   * Moves the active history position of a tab. Returns the URL to navigate
   * to, or `null` when there is no history in that direction.
   */
  public navigateHistory(tabId: string, direction: 'back' | 'forward'): string | null {
    const tab = this.getTab(tabId);
    if (tab === null) {
      return null;
    }
    const next =
      direction === 'back'
        ? goBack(tab.history)
        : goForward(tab.history);
    if (next === tab.history) {
      return null;
    }
    tab.history = next;
    const url = currentHistoryUrl(next);
    tab.url = url;
    tab.loading = true;
    tab.error = null;
    tab.showErrorPage = false;
    tab.securityState = securityForUrl(url);
    this.emit({ type: 'tab-updated', tabId });
    return url;
  }

  /** Whether the given tab can navigate back. */
  public canGoBackFor(tabId: string): boolean {
    const tab = this.getTab(tabId);
    return tab === null ? false : canGoBack(tab.history);
  }

  /** Whether the given tab can navigate forward. */
  public canGoForwardFor(tabId: string): boolean {
    const tab = this.getTab(tabId);
    return tab === null ? false : canGoForward(tab.history);
  }

  /** Removes all tabs (e.g. when the window closes). */
  public clear(): void {
    this.tabs.length = 0;
    this.activeTabId = null;
    this.emit({ type: 'tabs-changed' });
  }

  private emit(event: TabEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

/**
 * Derives a basic security state from a URL.
 */
function securityForUrl(url: string): SecurityState {
  if (url.length === 0) {
    return 'none';
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return 'none';
  }
  if (parsed.protocol === 'https:') {
    return 'secure';
  }
  if (parsed.protocol === 'http:') {
    return 'insecure';
  }
  return 'internal';
}
