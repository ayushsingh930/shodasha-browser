/**
 * SHODASHA bookmarks - public API.
 */

export {
  createBookmarkId,
  isValidBookmarkUrl,
  bookmarkKeyForUrl,
  searchBookmarks,
  sortBookmarks,
  BOOKMARK_COLLECTION_VERSION,
} from './bookmarkModel.js';
export type {
  Bookmark,
  BookmarkCollection,
  BookmarkEntry,
  BookmarkFolder,
  BookmarkSort,
} from './bookmarkModel.js';
export {
  parseBookmarkCollection,
  serializeBookmarkCollection,
  emptyBookmarkCollection,
} from './bookmarkPersistence.js';
export { BookmarkManager, MAX_BOOKMARK_TITLE_LENGTH, MAX_FOLDER_NAME_LENGTH } from './bookmarkManager.js';
export type {
  AddBookmarkInput,
  AddBookmarkResult,
  UpdateBookmarkInput,
  UpdateBookmarkResult,
} from './bookmarkManager.js';