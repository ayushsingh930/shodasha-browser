/**
 * SHODASHA history data model and pure helpers.
 *
 * History stores one record per successful page visit. It is a minimal,
 * privacy-safe view: a URL, a display title, a visit timestamp, and optional
 * favicon metadata. It never stores passwords, cookies, tokens, POST bodies,
 * form content, page source, or full page text, and it never leaves the
 * device.
 *
 * This module is pure and host-agnostic: no filesystem, no Electron, no DOM.
 */

import { bookmarkKeyForUrl } from '../bookmarks/bookmarkModel.js';

/** A single history entry (a page visit). */
export interface HistoryEntry {
  readonly id: string;
  readonly url: string;
  /** The page title when known; may be empty for pages with no title. */
  readonly title: string;
  /** When the visit happened (epoch milliseconds). */
  readonly visitedAt: number;
  /**
   * A favicon URL when one was safely captured. Never trusted as a privileged
   * resource: the renderer only ever uses it as an `<img>` source.
   */
  readonly favicon: string | null;
}

/** The full history collection (also the persistence format). */
export interface HistoryCollection {
  readonly version: 1;
  readonly entries: readonly HistoryEntry[];
}

/** The current collection format version. */
export const HISTORY_COLLECTION_VERSION = 1 as const;

/** The maximum length of a stored title, to keep rendering bounded. */
export const MAX_HISTORY_TITLE_LENGTH = 500;

/** The maximum length of a stored favicon URL. */
export const MAX_HISTORY_FAVICON_LENGTH = 2048;

/** Generates a stable, unique id for a history entry. */
export function createHistoryId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `he_${time}${rand}`;
}

/**
 * Whether a URL may be recorded in history.
 *
 * Only ordinary web pages (`http:`, `https:`) are recorded. Dangerous schemes
 * (`javascript:`, `data:`, `file:`, and any other) are rejected, and SHODASHA
 * internal pages (Privacy Center, Bookmark Manager, History) are handled
 * separately by the host and never stored as web history.
 */
export function isValidHistoryUrl(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return false;
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      parsed.hostname.length > 0
    );
  } catch {
    return false;
  }
}

/**
 * Whether a favicon may be stored with a history entry. Only `http:`/`https:`
 * image URLs are accepted (never `javascript:`, `data:`, or privileged
 * schemes) and the value is length-bounded so a hostile page cannot bloat the
 * stored history.
 */
export function isValidHistoryFavicon(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= MAX_HISTORY_FAVICON_LENGTH &&
    /^https?:\/\//i.test(value)
  );
}

/**
 * A conservative, normalized key used only for duplicate detection. Distinct
 * resources (different host, path, or query) stay distinct; `https://example.com`
 * and `https://example.com/` map to the same key. The stored URL is never
 * rewritten.
 */
export function historyKeyForUrl(url: string): string {
  return bookmarkKeyForUrl(url);
}

/**
 * Case-insensitive local search across title and URL. Never leaves the
 * device; no remote service is involved.
 */
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

/** The date buckets used to group history, newest first. */
export type HistoryDateGroup = 'today' | 'yesterday' | 'earlier-week' | 'older';

/**
 * The calendar day index of a timestamp in the user's local timezone. Using a
 * day index (instead of millisecond subtraction) is robust across DST shifts.
 */
export function localDayIndex(timestamp: number): number {
  return Math.floor(
    (timestamp - new Date(timestamp).getTimezoneOffset() * 60_000) / 86_400_000,
  );
}

/**
 * The date group a visit belongs to, relative to `now`, in local time.
 */
export function historyDateGroupFor(
  visitedAt: number,
  now: number,
): HistoryDateGroup {
  const diff = localDayIndex(now) - localDayIndex(visitedAt);
  if (diff <= 0) {
    return 'today';
  }
  if (diff === 1) {
    return 'yesterday';
  }
  // Sunday is 0; the number of days since Monday is how deep "this week" goes.
  const daysSinceMonday = (new Date(now).getDay() + 6) % 7;
  return diff <= daysSinceMonday ? 'earlier-week' : 'older';
}

/** A single date group for display. */
export interface HistoryGroup {
  readonly key: HistoryDateGroup;
  readonly label: string;
  readonly entries: readonly HistoryEntry[];
}

/** The user-facing label for a date group. */
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

/**
 * Groups entries (which should be newest-first) into the standard date buckets
 * in display order: Today, Yesterday, Earlier this week, Older.
 */
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

/**
 * Extracts the lowercased hostname from a history URL, or `null` when the URL
 * cannot be parsed or has no host. Used to identify a site for clearing.
 */
export function hostnameFromHistoryUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    return hostname.length === 0 ? null : hostname;
  } catch {
    return null;
  }
}
