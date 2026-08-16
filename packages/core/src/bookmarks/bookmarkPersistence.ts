/**
 * Bookmark persistence and import/export.
 *
 * Persisted bookmark data is never trusted: every value is re-validated on
 * load. Structurally invalid files, malformed entries, invalid URLs, missing
 * fields, and unknown folder ids are all handled without crashing the browser.
 * Bookmarks whose folder no longer exists are preserved at the root level
 * rather than destroyed.
 *
 * The serialized format is the same as the export format:
 *
 * ```json
 * { "version": 1, "bookmarks": [], "folders": [] }
 * ```
 */

import {
  isValidBookmarkUrl,
  type Bookmark,
  type BookmarkCollection,
  type BookmarkFolder,
} from './bookmarkModel.js';

/** Parses a timestamp field, falling back to the provided default. */
function parseTimestamp(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : fallback;
}

/** Parses and validates a single bookmark. Returns null when unusable. */
function parseBookmark(
  raw: unknown,
  validFolderIds: ReadonlySet<string>,
): Bookmark | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const source = raw as Record<string, unknown>;
  if (typeof source.title !== 'string') {
    return null;
  }
  const title = source.title.trim();
  if (title.length === 0) {
    return null;
  }
  if (typeof source.url !== 'string' || !isValidBookmarkUrl(source.url)) {
    return null;
  }
  const now = Date.now();
  return {
    id:
      typeof source.id === 'string' && source.id.length > 0
        ? source.id
        : `bm_${Math.random().toString(36).slice(2, 12)}`,
    title,
    url: source.url.trim(),
    createdAt: parseTimestamp(source.createdAt, now),
    updatedAt: parseTimestamp(source.updatedAt, now),
    // Unknown/missing folder ids are treated as the root level; the bookmark
    // is preserved, never destroyed.
    folderId:
      typeof source.folderId === 'string' && validFolderIds.has(source.folderId)
        ? source.folderId
        : null,
    favicon:
      typeof source.favicon === 'string' && source.favicon.length > 0
        ? source.favicon
        : null,
  };
}

/** Parses and validates a single folder. Returns null when unusable. */
function parseFolder(raw: unknown): BookmarkFolder | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const source = raw as Record<string, unknown>;
  if (typeof source.id !== 'string' || source.id.length === 0) {
    return null;
  }
  if (typeof source.name !== 'string') {
    return null;
  }
  const name = source.name.trim();
  if (name.length === 0) {
    return null;
  }
  const now = Date.now();
  return {
    id: source.id,
    name,
    createdAt: parseTimestamp(source.createdAt, now),
    updatedAt: parseTimestamp(source.updatedAt, now),
  };
}

/**
 * Parses and validates unknown data into a {@link BookmarkCollection}. Never
 * throws. Missing or malformed roots yield an empty collection; individual
 * invalid entries are dropped; valid data is always preserved.
 */
export function parseBookmarkCollection(raw: unknown): BookmarkCollection {
  if (typeof raw !== 'object' || raw === null) {
    return { version: 1, bookmarks: [], folders: [] };
  }
  const source = raw as Record<string, unknown>;

  const folders: BookmarkFolder[] = [];
  if (Array.isArray(source.folders)) {
    const seen = new Set<string>();
    for (const item of source.folders) {
      const folder = parseFolder(item);
      if (folder !== null && !seen.has(folder.id)) {
        seen.add(folder.id);
        folders.push(folder);
      }
    }
  }
  const validFolderIds = new Set(folders.map((folder) => folder.id));

  const bookmarks: Bookmark[] = [];
  if (Array.isArray(source.bookmarks)) {
    const seenIds = new Set<string>();
    for (const item of source.bookmarks) {
      const bookmark = parseBookmark(item, validFolderIds);
      if (bookmark !== null && !seenIds.has(bookmark.id)) {
        seenIds.add(bookmark.id);
        bookmarks.push(bookmark);
      }
    }
  }

  return { version: 1, bookmarks, folders };
}

/** Serializes a collection to the stable JSON format. */
export function serializeBookmarkCollection(
  collection: BookmarkCollection,
): string {
  return JSON.stringify(
    {
      version: 1,
      bookmarks: collection.bookmarks,
      folders: collection.folders,
    },
    null,
    2,
  );
}

/** An empty, valid collection. */
export function emptyBookmarkCollection(): BookmarkCollection {
  return { version: 1, bookmarks: [], folders: [] };
}