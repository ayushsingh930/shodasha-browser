/**
 * Shared types for the renderer ↔ main IPC contract.
 *
 * These types describe the browser state sent from the main process to the
 * renderer UI, and are imported by both sides. They are UI-agnostic views of
 * the core tab model.
 */

import type {
  Bookmark,
  BookmarkCollection,
  BookmarkSort,
  DownloadItem,
  FilterListStatus,
  HistoryDateGroup,
  HistoryEntry,
  HistoryGroup,
  SecurityState,
  ShieldFilterEvent,
  ShieldMode,
  ShieldStats,
  SiteStats,
} from '@shodasha/core';

/** A tab as presented to the UI. */
export interface TabViewState {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly loading: boolean;
  readonly active: boolean;
  readonly favicon: string | null;
  readonly securityState: SecurityState;
  readonly error: string | null;
  readonly showErrorPage: boolean;
  readonly canGoBack: boolean;
  readonly canGoForward: boolean;
}

/** The complete browser state pushed to the UI. */
export interface BrowserState {
  readonly tabs: readonly TabViewState[];
  readonly activeTabId: string | null;
  /** Whether a recently-closed tab can be reopened (Ctrl+Shift+T). */
  readonly canReopenClosedTab: boolean;
}

/** The state shown in the Shield panel and site-settings panel. */
export interface ShieldPanelState {
  /** Whether the Shield is globally enabled. */
  readonly enabled: boolean;
  /** The global protection mode. */
  readonly mode: ShieldMode;
  /** Current session statistics. */
  readonly stats: ShieldStats;
  /** The hostname of the site currently being viewed, if any. */
  readonly currentSite: string | null;
  /** Whether the Shield is on for the current site. */
  readonly siteEnabled: boolean;
  /** The protection mode for the current site (falls back to the global mode). */
  readonly siteMode: ShieldMode;
  /** Whether the current site is allowlisted. */
  readonly siteAllowlisted: boolean;
  /**
   * Counters for the current site (session-scoped, in-memory only).
   * `null` when there is no current site.
   */
  readonly siteStats: SiteStats | null;
  /**
   * The most recent rule-driven filter events for the current session,
   * privacy-safe metadata only (no URLs, no query strings, no persistence).
   */
  readonly recentEvents: readonly ShieldFilterEvent[];
}

/** Whether a URL represents a blank new-tab page (nothing to show). */
export function isBlankTabUrl(url: string): boolean {
  return url.length === 0 || url === 'about:blank' || url.startsWith('about:blank#');
}

/** The internal URL of the SHODASHA Privacy Center. */
export const PRIVACY_CENTER_URL = 'shodasha://privacy';

/** The internal URL of the SHODASHA Bookmark Manager. */
export const BOOKMARKS_URL = 'shodasha://bookmarks';

/** The internal URL of the SHODASHA History Manager. */
export const HISTORY_URL = 'shodasha://history';

/** The internal URL of the SHODASHA Downloads Manager. */
export const DOWNLOADS_URL = 'shodasha://downloads';

/** The kinds of internal pages the chrome UI can render. */
export type InternalPageKind = 'privacy' | 'bookmarks' | 'history' | 'downloads';

/** Metadata for a SHODASHA internal page. */
export interface InternalPageInfo {
  /** The canonical internal URL. */
  readonly url: string;
  readonly kind: InternalPageKind;
  /** The title shown in the tab. */
  readonly title: string;
}

/**
 * Resolves a URL to its internal-page metadata, or null when it is not an
 * internal page. Used by the chrome UI to decide which section to render.
 */
export function internalPageInfoFor(url: string): InternalPageInfo | null {
  const normalized = url.trim().toLowerCase();
  if (normalized === PRIVACY_CENTER_URL) {
    return { url: PRIVACY_CENTER_URL, kind: 'privacy', title: 'Privacy Center' };
  }
  if (normalized === BOOKMARKS_URL) {
    return { url: BOOKMARKS_URL, kind: 'bookmarks', title: 'Bookmarks' };
  }
  if (normalized === HISTORY_URL) {
    return { url: HISTORY_URL, kind: 'history', title: 'History' };
  }
  if (normalized === DOWNLOADS_URL) {
    return { url: DOWNLOADS_URL, kind: 'downloads', title: 'Downloads' };
  }
  return null;
}

/**
 * Whether a URL is a SHODASHA internal page rendered by the browser chrome
 * (never by web content). Internal pages are safe, trusted pages such as the
 * Privacy Center and the Bookmark Manager; they cannot be loaded from an
 * external website.
 */
export function isInternalPageUrl(url: string): boolean {
  return internalPageInfoFor(url) !== null;
}

/**
 * An honest, deterministic protection status derived from the current Shield
 * state. SHODASHA never claims absolute privacy: these statuses describe what
 * is active right now, not a guarantee.
 */
export type ProtectionStatus = 'protected' | 'limited' | 'off';

/** The user-facing rendering of a {@link ProtectionStatus}. */
export interface ProtectionStatusView {
  readonly status: ProtectionStatus;
  readonly label: string;
  readonly note: string;
}

/**
 * Computes the protection status shown in the Privacy Center. `limited` means
 * the Shield is on globally but off for the current site. `off` means the
 * Shield is paused entirely.
 */
export function protectionStatusFor(
  panel: ShieldPanelState,
): ProtectionStatusView {
  if (!panel.enabled) {
    return {
      status: 'off',
      label: 'Shield is off',
      note: 'Filtering is paused. Turn the Shield on to resume protection.',
    };
  }
  if (panel.currentSite === null) {
    return {
      status: 'protected',
      label: 'Protected',
      note: 'Protection is on. No site is being viewed right now.',
    };
  }
  if (!panel.siteEnabled) {
    return {
      status: 'limited',
      label: 'Limited',
      note: 'The Shield is turned off for this site.',
    };
  }
  return {
    status: 'protected',
    label: 'Protected',
    note: 'Protection is active for this site. SHODASHA filters requests it has rules for; it does not block every tracker or ad.',
  };
}

/** The full state shown by the SHODASHA Privacy Center. */
export interface PrivacyCenterState {
  /** The same Shield panel data the popup uses. */
  readonly panel: ShieldPanelState;
  /** The currently allowlisted domains. */
  readonly allowlist: readonly string[];
  /** The status of every filter list loaded into the Shield. */
  readonly filterLists: readonly FilterListStatus[];
  /** The total number of rules active across all lists. */
  readonly totalRulesLoaded: number;
  /** Honest protection status (never an absolute privacy claim). */
  readonly protectionStatus: ProtectionStatus;
  readonly protectionLabel: string;
  readonly protectionNote: string;
  /** Whether filtering happens entirely on this device (always true). */
  readonly localProcessing: boolean;
  /** Whether telemetry is enabled (always false). */
  readonly telemetryEnabled: boolean;
  /** Whether browsing analytics are collected (always false). */
  readonly browsingAnalyticsEnabled: boolean;
}

/**
 * The full bookmark state pushed to the UI. It mirrors the single source of
 * truth in the main process (the core BookmarkManager) plus the derived values
 * the UI needs for the star button and the bookmarks toolbar.
 */
export interface BookmarkState {
  /** The full bookmark collection (bookmarks + folders). */
  readonly collection: BookmarkCollection;
  /** Whether the bookmarks toolbar is currently shown. */
  readonly toolbarVisible: boolean;
  /**
   * The URL of the active tab, or null when there is no navigable page
   * (e.g. a blank new-tab page).
   */
  readonly activeUrl: string | null;
  /**
   * The id of the bookmark for the active page, or null when the active page
   * is not bookmarked. Drives the star button state.
   */
  readonly activeBookmarkId: string | null;
}

/**
 * Case-insensitive local search across bookmark titles and URLs. Runs entirely
 * on this device against the pushed collection; no remote service is involved.
 */
export function searchBookmarks(
  bookmarks: readonly Bookmark[],
  query: string,
): Bookmark[] {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) {
    return [...bookmarks];
  }
  return bookmarks.filter((bookmark) => {
    return (
      bookmark.title.toLowerCase().includes(needle) ||
      bookmark.url.toLowerCase().includes(needle)
    );
  });
}

/** Sorts bookmarks by the requested order (stable, no mutation). */
export function sortBookmarks(
  bookmarks: readonly Bookmark[],
  order: BookmarkSort,
): Bookmark[] {
  const copy = [...bookmarks];
  if (order === 'name-asc') {
    copy.sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
    );
  } else if (order === 'name-desc') {
    copy.sort((a, b) =>
      b.title.localeCompare(a.title, undefined, { sensitivity: 'base' }),
    );
  } else {
    copy.sort((a, b) => b.createdAt - a.createdAt);
  }
  return copy;
}

// ---------------------------------------------------------------------
// History (renderer-reachable pure helpers)
//
// The chrome renderer runs as a plain browser ES module and cannot import
// `@shodasha/core` at runtime. These helpers mirror the authoritative core
// logic so the History Manager can search and date-group entries locally,
// on this device, with no remote service.
// ---------------------------------------------------------------------

/**
 * The full history state pushed to the UI. It mirrors the single source of
 * truth in the main process (the core HistoryManager), newest entry first.
 */
export interface HistoryState {
  readonly entries: readonly HistoryEntry[];
}

/** Case-insensitive local search across history titles and URLs. */
export function searchHistory(
  entries: readonly HistoryEntry[],
  query: string,
): HistoryEntry[] {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) {
    return [...entries];
  }
  return entries.filter((entry) => {
    return (
      entry.title.toLowerCase().includes(needle) ||
      entry.url.toLowerCase().includes(needle)
    );
  });
}

/** The calendar day index of a timestamp in local time (DST-safe). */
export function localHistoryDayIndex(timestamp: number): number {
  return Math.floor(
    (timestamp - new Date(timestamp).getTimezoneOffset() * 60_000) / 86_400_000,
  );
}

/** The date group a visit belongs to, relative to `now`, in local time. */
export function historyDateGroupFor(
  visitedAt: number,
  now: number,
): HistoryDateGroup {
  const diff = localHistoryDayIndex(now) - localHistoryDayIndex(visitedAt);
  if (diff <= 0) {
    return 'today';
  }
  if (diff === 1) {
    return 'yesterday';
  }
  const daysSinceMonday = (new Date(now).getDay() + 6) % 7;
  return diff <= daysSinceMonday ? 'earlier-week' : 'older';
}

/** The user-facing label for a history date group. */
export function historyGroupLabel(group: HistoryDateGroup): string {
  switch (group) {
    case 'today':
      return 'Today';
    case 'yesterday':
      return 'Yesterday';
    case 'earlier-week':
      return 'Earlier this week';
    case 'older':
      return 'Older';
  }
}

/** Groups entries into date buckets in display order. */
export function groupHistoryByDate(
  entries: readonly HistoryEntry[],
  now: number,
): HistoryGroup[] {
  const buckets = new Map<HistoryDateGroup, HistoryEntry[]>();
  for (const entry of entries) {
    const key = historyDateGroupFor(entry.visitedAt, now);
    const list = buckets.get(key) ?? [];
    list.push(entry);
    buckets.set(key, list);
  }
  const order: HistoryDateGroup[] = [
    'today',
    'yesterday',
    'earlier-week',
    'older',
  ];
  const groups: HistoryGroup[] = [];
  for (const key of order) {
    const list = buckets.get(key);
    if (list !== undefined && list.length > 0) {
      groups.push({ key, label: historyGroupLabel(key), entries: list });
    }
  }
  return groups;
}

/** Extracts the lowercased hostname from a history URL, or null. */
export function hostnameFromHistoryUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    return hostname.length === 0 ? null : hostname;
  } catch {
    return null;
  }
}

/** A conservative normalized key used to match a URL to its bookmark. */
function bookmarkKeyForUrl(url: string): string {
  const trimmed = url.trim();
  const lowered = trimmed.toLowerCase();
  if (lowered === 'shodasha://privacy' || lowered === 'shodasha://bookmarks' || lowered === 'shodasha://history') {
    return lowered;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return lowered;
    }
    const host = parsed.hostname.toLowerCase();
    const defaultPort = parsed.protocol === 'https:' ? '443' : '80';
    const port =
      parsed.port !== '' && parsed.port !== defaultPort
        ? `:${parsed.port}`
        : '';
    let path = parsed.pathname;
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    if (path.length === 0) {
      path = '/';
    }
    return `${parsed.protocol}//${host}${port}${path}${parsed.search}`;
  } catch {
    return lowered;
  }
}

/**
 * Finds the bookmark for a URL using the conservative dedupe key, or null.
 * Lets the History Manager show the bookmarked state for an entry and open
 * the editor instead of duplicating a bookmark.
 */
export function bookmarkForUrl(
  bookmarks: readonly Bookmark[],
  url: string,
): Bookmark | null {
  const key = bookmarkKeyForUrl(url);
  return bookmarks.find((bookmark) => bookmarkKeyForUrl(bookmark.url) === key) ?? null;
}

// ---------------------------------------------------------------------
// Downloads (renderer-reachable pure helpers)
//
// The chrome renderer runs as a plain browser ES module and cannot import
// `@shodasha/core` at runtime. These helpers mirror the authoritative core
// logic so the Downloads Manager can search and format locally, on this
// device, with no remote service.
// ---------------------------------------------------------------------

/**
 * The full download state pushed to the UI. It mirrors the single source of
 * truth in the main process (the core DownloadManager), newest first.
 */
export interface DownloadsState {
  readonly items: readonly DownloadItem[];
}

/** Case-insensitive local search across download filename and source URL. */
export function searchDownloads(
  items: readonly DownloadItem[],
  query: string,
): DownloadItem[] {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) {
    return [...items];
  }
  return items.filter((item) => {
    return (
      item.filename.toLowerCase().includes(needle) ||
      item.url.toLowerCase().includes(needle)
    );
  });
}

/** The hostname a download was fetched from, for display. */
export function downloadSourceFor(item: DownloadItem): string | null {
  try {
    const hostname = new URL(item.url).hostname.toLowerCase();
    return hostname.length === 0 ? null : hostname;
  } catch {
    return null;
  }
}

/** Formats a byte count into a compact human-readable string. */
export function formatDownloadBytes(bytes: number): string {
  const value = typeof bytes === 'number' && Number.isFinite(bytes) ? bytes : 0;
  if (value < 1024) {
    const whole = Math.max(0, Math.floor(value));
    return String(whole).concat(' B');
  }
  const units = ['KB', 'MB', 'GB', 'TB'];
  let amount = value;
  let unit = 'B';
  for (const next of units) {
    if (amount < 1024) {
      break;
    }
    amount /= 1024;
    unit = next;
  }
  const digits = amount >= 100 ? 0 : amount >= 10 ? 1 : 2;
  const text = amount.toFixed(digits).replace(/\.?0+$/, '');
  return `${text} ${unit}`;
}

/**
 * The user-facing label and CSS class for a download state. Terminal states
 * are static; active states update live as progress arrives.
 */
export function downloadStateView(state: DownloadItem['state']): {
  label: string;
  className: string;
} {
  switch (state) {
    case 'pending':
      return { label: 'Pending', className: 'download-state-pending' };
    case 'progressing':
      return { label: 'Downloading', className: 'download-state-progressing' };
    case 'paused':
      return { label: 'Paused', className: 'download-state-paused' };
    case 'completed':
      return { label: 'Completed', className: 'download-state-completed' };
    case 'cancelled':
      return { label: 'Cancelled', className: 'download-state-cancelled' };
    case 'failed':
      return { label: 'Failed', className: 'download-state-failed' };
  }
}

/** The IPC channel names used between renderer and main. */
export const IPC = {
  getState: 'browser:get-state',
  submitAddress: 'browser:submit-address',
  goBack: 'browser:go-back',
  goForward: 'browser:go-forward',
  reload: 'browser:reload',
  hardReload: 'browser:hard-reload',
  stop: 'browser:stop',
  newTab: 'browser:new-tab',
  closeTab: 'browser:close-tab',
  activateTab: 'browser:activate-tab',
  reloadTab: 'browser:reload-tab',
  duplicateTab: 'browser:duplicate-tab',
  closeOtherTabs: 'browser:close-other-tabs',
  closeTabsToRight: 'browser:close-tabs-to-right',
  reopenClosedTab: 'browser:reopen-closed-tab',
  nextTab: 'browser:next-tab',
  prevTab: 'browser:prev-tab',
  stateChanged: 'browser:state-changed',
  focusAddressBar: 'browser:focus-address-bar',
  shieldGetState: 'shield:get-state',
  shieldSetEnabled: 'shield:set-enabled',
  shieldSetMode: 'shield:set-mode',
  shieldSetSiteSetting: 'shield:set-site-setting',
  shieldToggleAllowlist: 'shield:toggle-allowlist',
  shieldSubscribe: 'shield:subscribe',
  shieldUnsubscribe: 'shield:unsubscribe',
  shieldPanelChanged: 'shield:panel-changed',
  privacyGetState: 'privacy:get-state',
  shieldResetStats: 'shield:reset-stats',
  shieldGetAllowlist: 'shield:get-allowlist',
  shieldAddAllowlist: 'shield:add-allowlist',
  shieldRemoveAllowlist: 'shield:remove-allowlist',
  bookmarkGetState: 'bookmarks:get-state',
  bookmarkStateChanged: 'bookmarks:state-changed',
  bookmarkAdd: 'bookmarks:add',
  bookmarkUpdate: 'bookmarks:update',
  bookmarkDelete: 'bookmarks:delete',
  bookmarkCreateFolder: 'bookmarks:create-folder',
  bookmarkRenameFolder: 'bookmarks:rename-folder',
  bookmarkDeleteFolder: 'bookmarks:delete-folder',
  bookmarkMove: 'bookmarks:move',
  bookmarkSearch: 'bookmarks:search',
  bookmarkSetToolbarVisible: 'bookmarks:set-toolbar-visible',
  bookmarkOpenAddDialog: 'bookmarks:open-add-dialog',
  historyGetState: 'history:get-state',
  historyStateChanged: 'history:state-changed',
  historySearch: 'history:search',
  historyDeleteEntry: 'history:delete-entry',
  historyClear: 'history:clear',
  historyClearRange: 'history:clear-range',
  historyClearSite: 'history:clear-site',
  downloadsGetState: 'downloads:get-state',
  downloadsStateChanged: 'downloads:state-changed',
  downloadsPause: 'downloads:pause',
  downloadsResume: 'downloads:resume',
  downloadsCancel: 'downloads:cancel',
  downloadsRemove: 'downloads:remove',
  downloadsClear: 'downloads:clear',
  downloadsOpen: 'downloads:open',
  downloadsShow: 'downloads:show',
  downloadsCompleted: 'downloads:completed',
} as const;
