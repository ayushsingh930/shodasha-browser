/**
 * SHODASHA bookmark data model and pure helpers.
 *
 * Bookmarks are stored as a flat collection: a list of bookmarks plus a list
 * of folders. Every bookmark has a stable, unique id (never the URL, because
 * the same URL can legitimately appear with different metadata). Bookmarks are
 * never executed as code: they are validated URL strings plus display text,
 * and the host opens them like any other navigation.
 *
 * This module is pure and host-agnostic: no filesystem, no Electron, no DOM.
 */

/** A bookmark folder. Folders are flat; a bookmark references one by id or
 * `null` for the root (unfiled) level. */
export interface BookmarkFolder {
  readonly id: string;
  readonly name: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

/** A single bookmark. */
export interface Bookmark {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  /** The folder this bookmark lives in, or `null` for the root level. */
  readonly folderId: string | null;
  /**
   * A favicon URL when one was safely captured. Never trusted as a privileged
   * resource: the renderer only ever uses it as an `<img>` source.
   */
  readonly favicon: string | null;
}

/** The full bookmark collection (also the persistence/export format). */
export interface BookmarkCollection {
  readonly version: 1;
  readonly bookmarks: readonly Bookmark[];
  readonly folders: readonly BookmarkFolder[];
}

/** The current collection format version. */
export const BOOKMARK_COLLECTION_VERSION = 1 as const;

/** Internal pages that may be bookmarked like any navigable address. */
const INTERNAL_BOOKMARKABLE_URLS: ReadonlySet<string> = new Set([
  'shodasha://privacy',
  'shodasha://bookmarks',
]);

/** Generates a stable, unique id for a bookmark or folder. */
export function createBookmarkId(prefix: 'bm' | 'fd'): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}_${time}${rand}`;
}

/**
 * Whether a URL may be stored as a bookmark.
 *
 * Only normal web URLs (`http:`, `https:`) and SHODASHA's own internal pages
 * are accepted. Dangerous schemes (`javascript:`, `data:`, `file:`, and any
 * other) are rejected so a bookmark can never become an execution vector.
 */
export function isValidBookmarkUrl(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return false;
  }
  if (INTERNAL_BOOKMARKABLE_URLS.has(trimmed.toLowerCase())) {
    return true;
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
 * A conservative, normalized key used only for duplicate detection.
 *
 * `https://example.com` and `https://example.com/` map to the same key, while
 * distinct resources (different path, query, or host) stay distinct. The
 * stored URL is never rewritten — this key is used only to decide whether an
 * identical bookmark already exists.
 */
export function bookmarkKeyForUrl(url: string): string {
  const trimmed = url.trim();
  const lowered = trimmed.toLowerCase();
  if (INTERNAL_BOOKMARKABLE_URLS.has(lowered)) {
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

/** A single bookmark with its folder, ready for display. */
export interface BookmarkEntry {
  readonly bookmark: Bookmark;
  /** The folder name, or `null` when the bookmark is unfiled. */
  readonly folderName: string | null;
}

/** Bookmark sorting orders. */
export type BookmarkSort = 'recent' | 'name-asc' | 'name-desc';

/**
 * Case-insensitive local search across title and URL. Never leaves the
 * device; no remote service is involved.
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