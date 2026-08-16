/**
 * BookmarkManager: the single source of truth for bookmarks.
 *
 * Hosts hold exactly one BookmarkManager and drive the UI from its snapshots;
 * there is never a second, independent bookmark store. All mutations validate
 * their input and keep the collection consistent (folder references always
 * resolve, ids are unique, duplicate URLs are never created silently).
 */

import {
  createBookmarkId,
  bookmarkKeyForUrl,
  isValidBookmarkUrl,
  searchBookmarks,
  sortBookmarks,
  type Bookmark,
  type BookmarkCollection,
  type BookmarkFolder,
  type BookmarkSort,
} from './bookmarkModel.js';
import { emptyBookmarkCollection } from './bookmarkPersistence.js';

/** The result of trying to add a bookmark. */
export type AddBookmarkResult =
  | { readonly ok: true; readonly duplicate: false; readonly bookmark: Bookmark }
  | { readonly ok: true; readonly duplicate: true; readonly bookmark: Bookmark }
  | { readonly ok: false; readonly reason: 'invalid-url' | 'missing-title' }
  | { readonly ok: false; readonly reason: 'invalid-folder' };

/** The result of trying to update a bookmark. */
export type UpdateBookmarkResult =
  | { readonly ok: true; readonly bookmark: Bookmark }
  | { readonly ok: false; readonly reason: 'not-found' | 'invalid-url' | 'invalid-folder' | 'missing-title' };

/** Input for adding a bookmark. */
export interface AddBookmarkInput {
  readonly title: string;
  readonly url: string;
  /** Folder id, or null for the root level. */
  readonly folderId: string | null;
  /**
   * An optional favicon URL captured safely from the page. Never executed;
   * the UI only ever uses it as an `<img>` source.
   */
  readonly favicon?: string | null;
}

/** A partial update for an existing bookmark. */
export interface UpdateBookmarkInput {
  readonly title?: string;
  readonly url?: string;
  /** Explicitly `null` moves the bookmark to the root level. */
  readonly folderId?: string | null;
}

/** The maximum length of a bookmark title, to keep UI rendering bounded. */
export const MAX_BOOKMARK_TITLE_LENGTH = 500;

/** The maximum length of a folder name. */
export const MAX_FOLDER_NAME_LENGTH = 120;

function validTitle(title: string): string | null {
  const trimmed = title.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_BOOKMARK_TITLE_LENGTH) {
    return null;
  }
  return trimmed;
}

function validFolderName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_FOLDER_NAME_LENGTH) {
    return null;
  }
  return trimmed;
}

export class BookmarkManager {
  private bookmarks: Bookmark[] = [];
  private folders: BookmarkFolder[] = [];

  /** Creates a manager, optionally seeded from a persisted collection. */
  public constructor(initial?: BookmarkCollection) {
    if (initial !== undefined) {
      this.bookmarks = [...initial.bookmarks];
      this.folders = [...initial.folders];
    }
  }

  /** A copy of the full collection (safe to hand to the UI). */
  public snapshot(): BookmarkCollection {
    return {
      version: 1,
      bookmarks: [...this.bookmarks],
      folders: [...this.folders],
    };
  }

  /** All bookmarks (copies). */
  public get bookmarksList(): readonly Bookmark[] {
    return [...this.bookmarks];
  }

  /** All folders (copies). */
  public get foldersList(): readonly BookmarkFolder[] {
    return [...this.folders];
  }

  /** Finds a folder by id, or null. */
  public folder(id: string): BookmarkFolder | null {
    return this.folders.find((folder) => folder.id === id) ?? null;
  }

  /** Finds a bookmark by id, or null. */
  public bookmark(id: string): Bookmark | null {
    return this.bookmarks.find((bookmark) => bookmark.id === id) ?? null;
  }

  /** Whether any bookmarks exist. */
  public get isEmpty(): boolean {
    return this.bookmarks.length === 0;
  }

  /**
   * Finds the bookmark for a URL using the conservative dedupe key, or null.
   * This drives the toolbar button state (starred vs unstarred).
   */
  public bookmarkForUrl(url: string): Bookmark | null {
    const key = bookmarkKeyForUrl(url);
    return (
      this.bookmarks.find(
        (bookmark) => bookmarkKeyForUrl(bookmark.url) === key,
      ) ?? null
    );
  }

  /**
   * Adds a bookmark. When a bookmark already exists for the same normalized
   * URL, no duplicate is created — the existing bookmark is returned with
   * `duplicate: true` so the host can open the editor instead.
   */
  public addBookmark(input: AddBookmarkInput): AddBookmarkResult {
    const title = validTitle(input.title);
    if (title === null) {
      return { ok: false, reason: 'missing-title' };
    }
    if (!isValidBookmarkUrl(input.url)) {
      return { ok: false, reason: 'invalid-url' };
    }
    if (input.folderId !== null && this.folder(input.folderId) === null) {
      return { ok: false, reason: 'invalid-folder' };
    }
    const existing = this.bookmarkForUrl(input.url);
    if (existing !== null) {
      return { ok: true, duplicate: true, bookmark: existing };
    }
    const now = Date.now();
    const bookmark: Bookmark = {
      id: createBookmarkId('bm'),
      title,
      url: input.url.trim(),
      createdAt: now,
      updatedAt: now,
      folderId: input.folderId,
      favicon:
        typeof input.favicon === 'string' && input.favicon.length > 0
          ? input.favicon
          : null,
    };
    this.bookmarks.push(bookmark);
    return { ok: true, duplicate: false, bookmark };
  }

  /** Updates a bookmark's editable fields (title, url, folder). */
  public updateBookmark(id: string, patch: UpdateBookmarkInput): UpdateBookmarkResult {
    const existing = this.bookmark(id);
    if (existing === null) {
      return { ok: false, reason: 'not-found' };
    }
    const title = patch.title !== undefined ? validTitle(patch.title) : existing.title;
    if (title === null) {
      return { ok: false, reason: 'missing-title' };
    }
    const url = patch.url !== undefined ? patch.url.trim() : existing.url;
    if (!isValidBookmarkUrl(url)) {
      return { ok: false, reason: 'invalid-url' };
    }
    const folderId =
      patch.folderId !== undefined ? patch.folderId : existing.folderId;
    if (folderId !== null && this.folder(folderId) === null) {
      return { ok: false, reason: 'invalid-folder' };
    }
    const updated: Bookmark = {
      ...existing,
      title,
      url,
      folderId,
      updatedAt: Date.now(),
    };
    const index = this.bookmarks.findIndex((bookmark) => bookmark.id === id);
    if (index >= 0) {
      this.bookmarks[index] = updated;
    }
    return { ok: true, bookmark: updated };
  }

  /** Removes a bookmark. Returns whether one was removed. */
  public deleteBookmark(id: string): boolean {
    const before = this.bookmarks.length;
    this.bookmarks = this.bookmarks.filter((bookmark) => bookmark.id !== id);
    return this.bookmarks.length !== before;
  }

  /** Moves a bookmark to a folder (or to the root level when folderId is null). */
  public moveBookmark(id: string, folderId: string | null): boolean {
    const bookmark = this.bookmark(id);
    if (bookmark === null) {
      return false;
    }
    if (folderId !== null && this.folder(folderId) === null) {
      return false;
    }
    return this.updateBookmark(id, { folderId }).ok;
  }

  /** Creates a folder. Returns the new folder, or null when the name is empty. */
  public createFolder(name: string): BookmarkFolder | null {
    const clean = validFolderName(name);
    if (clean === null) {
      return null;
    }
    const now = Date.now();
    const folder: BookmarkFolder = {
      id: createBookmarkId('fd'),
      name: clean,
      createdAt: now,
      updatedAt: now,
    };
    this.folders.push(folder);
    return folder;
  }

  /** Renames a folder. Returns whether it succeeded. */
  public renameFolder(id: string, name: string): boolean {
    const folder = this.folder(id);
    if (folder === null) {
      return false;
    }
    const clean = validFolderName(name);
    if (clean === null) {
      return false;
    }
    const index = this.folders.findIndex((f) => f.id === id);
    if (index >= 0) {
      this.folders[index] = { ...folder, name: clean, updatedAt: Date.now() };
    }
    return true;
  }

  /**
   * Deletes a folder while preserving user data: bookmarks inside it are
   * moved to the root level, never silently destroyed.
   */
  public deleteFolder(id: string): boolean {
    if (this.folder(id) === null) {
      return false;
    }
    this.bookmarks = this.bookmarks.map((bookmark) =>
      bookmark.folderId === id
        ? { ...bookmark, folderId: null, updatedAt: Date.now() }
        : bookmark,
    );
    this.folders = this.folders.filter((folder) => folder.id !== id);
    return true;
  }

  /** Case-insensitive local search across title and URL. */
  public search(query: string): Bookmark[] {
    return searchBookmarks(this.bookmarks, query);
  }

  /** Bookmarks sorted by the requested order. */
  public sorted(order: BookmarkSort): Bookmark[] {
    return sortBookmarks(this.bookmarks, order);
  }

  /** Bookmarks inside a folder (or at the root when folderId is null). */
  public bookmarksInFolder(folderId: string | null): Bookmark[] {
    return this.bookmarks.filter((bookmark) => bookmark.folderId === folderId);
  }

  /** An empty collection to seed a fresh store. */
  public static empty(): BookmarkCollection {
    return emptyBookmarkCollection();
  }
}