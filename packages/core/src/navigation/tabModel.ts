/**
 * The tab model: the per-tab state SHODASHA tracks.
 *
 * This is pure, platform-agnostic state. Hosts (Electron) map it onto real
 * web contents; the model itself has no dependency on any rendering engine.
 */

/** Current loading state of a tab. */
export type TabLoadingState = 'idle' | 'loading';

/** Basic security state shown in the UI. */
export type SecurityState = 'secure' | 'insecure' | 'internal' | 'none';

/**
 * A single browser tab.
 */
export interface Tab {
  /** Globally unique, stable identifier for this tab. */
  readonly id: string;
  /** The URL currently shown, or an empty string for a blank tab. */
  url: string;
  /** The page title. */
  title: string;
  /** Whether a navigation is currently in progress. */
  loading: boolean;
  /** Whether this tab is the active tab. */
  active: boolean;
  /** The favicon URL, when safely available; otherwise `null`. */
  favicon: string | null;
  /** Basic security state derived from the current page. */
  securityState: SecurityState;
  /**
   * A short user-facing error message when the last navigation failed, or
   * `null` when the tab is healthy.
   */
  error: string | null;
  /**
   * Whether the last attempted navigation resulted in an error that should be
   * shown as an error page.
   */
  showErrorPage: boolean;
  /** The internal history used to enable back/forward. */
  history: NavigationHistory;
}

/** Back/forward history for a single tab. */
export interface NavigationHistory {
  /** The list of URLs, most recent first. */
  readonly entries: readonly string[];
  /** Index into `entries` of the currently-shown URL. */
  readonly index: number;
}

/**
 * Creates a fresh, empty history containing a single start entry.
 */
export function emptyHistory(): NavigationHistory {
  return { entries: [''], index: 0 };
}

/**
 * Returns the URL at the current history position (may be empty).
 */
export function currentHistoryUrl(history: NavigationHistory): string {
  const entry = history.entries[history.index];
  return entry ?? '';
}

/**
 * Returns `true` if there is a previous entry to navigate back to.
 */
export function canGoBack(history: NavigationHistory): boolean {
  return history.index > 0;
}

/**
 * Returns `true` if there is a next entry to navigate forward to.
 */
export function canGoForward(history: NavigationHistory): boolean {
  return history.index < history.entries.length - 1;
}

/**
 * Returns the previous URL when available, otherwise the current URL.
 */
export function goBack(history: NavigationHistory): NavigationHistory {
  if (!canGoBack(history)) {
    return history;
  }
  return { entries: history.entries, index: history.index - 1 };
}

/**
 * Returns the next URL when available, otherwise the current URL.
 */
export function goForward(history: NavigationHistory): NavigationHistory {
  if (!canGoForward(history)) {
    return history;
  }
  return { entries: history.entries, index: history.index + 1 };
}

/**
 * Records a navigation to `url`, truncating any forward history and appending
 * the new URL as the current position.
 */
export function pushNavigation(
  history: NavigationHistory,
  url: string,
): NavigationHistory {
  const upToCurrent = history.entries.slice(0, history.index + 1);
  const next: readonly string[] = [...upToCurrent, url];
  return { entries: next, index: next.length - 1 };
}
