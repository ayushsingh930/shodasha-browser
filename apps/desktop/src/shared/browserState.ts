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
  FilterListStatus,
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

/** The kinds of internal pages the chrome UI can render. */
export type InternalPageKind = 'privacy' | 'bookmarks';

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

/** IPC channel names used between renderer and main. */
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
} as const;
