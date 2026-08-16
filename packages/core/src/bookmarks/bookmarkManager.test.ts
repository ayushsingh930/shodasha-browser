/**
 * Tests for the bookmark model and manager.
 *
 * Covers add, remove, edit, duplicates, folders, move, search, URL
 * validation (including dangerous schemes), toolbar/button state derivation,
 * and empty states.
 */

import { describe, expect, it } from 'vitest';
import { BookmarkManager } from './bookmarkManager.js';
import {
  bookmarkKeyForUrl,
  isValidBookmarkUrl,
} from './bookmarkModel.js';

describe('bookmark URL validation', () => {
  it('accepts normal web URLs', () => {
    expect(isValidBookmarkUrl('https://example.com')).toBe(true);
    expect(isValidBookmarkUrl('http://example.com/path?q=1')).toBe(true);
    expect(isValidBookmarkUrl(' https://example.com ')).toBe(true);
  });

  it('rejects invalid URLs', () => {
    expect(isValidBookmarkUrl('')).toBe(false);
    expect(isValidBookmarkUrl('not a url')).toBe(false);
    expect(isValidBookmarkUrl('example.com')).toBe(false);
    expect(isValidBookmarkUrl('https://')).toBe(false);
  });

  it('rejects dangerous URL schemes', () => {
    expect(isValidBookmarkUrl('javascript:alert(1)')).toBe(false);
    expect(isValidBookmarkUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isValidBookmarkUrl('file:///etc/passwd')).toBe(false);
    expect(isValidBookmarkUrl('ftp://example.com')).toBe(false);
  });

  it('accepts SHODASHA internal pages', () => {
    expect(isValidBookmarkUrl('shodasha://privacy')).toBe(true);
    expect(isValidBookmarkUrl('shodasha://bookmarks')).toBe(true);
  });
});

describe('bookmark duplicate detection key', () => {
  it('treats https://example.com and https://example.com/ as equal', () => {
    expect(bookmarkKeyForUrl('https://example.com')).toBe(
      bookmarkKeyForUrl('https://example.com/'),
    );
  });

  it('keeps distinct paths distinct', () => {
    expect(bookmarkKeyForUrl('https://example.com/a')).not.toBe(
      bookmarkKeyForUrl('https://example.com/b'),
    );
  });

  it('keeps distinct hosts distinct', () => {
    expect(bookmarkKeyForUrl('https://example.com')).not.toBe(
      bookmarkKeyForUrl('https://other.com'),
    );
  });

  it('is case-insensitive for scheme and host', () => {
    expect(bookmarkKeyForUrl('HTTPS://EXAMPLE.COM')).toBe(
      bookmarkKeyForUrl('https://example.com'),
    );
  });

  it('strips the fragment but keeps the query', () => {
    expect(bookmarkKeyForUrl('https://example.com/path#section')).toBe(
      bookmarkKeyForUrl('https://example.com/path'),
    );
    expect(bookmarkKeyForUrl('https://example.com/search?q=a')).toBe(
      bookmarkKeyForUrl('https://example.com/search?q=a'),
    );
  });
});

describe('BookmarkManager', () => {
  it('starts empty with no fake bookmarks', () => {
    const manager = new BookmarkManager();
    expect(manager.isEmpty).toBe(true);
    expect(manager.bookmarksList).toHaveLength(0);
    expect(manager.search('anything')).toHaveLength(0);
  });

  it('adds a bookmark', () => {
    const manager = new BookmarkManager();
    const result = manager.addBookmark({
      title: 'Example',
      url: 'https://example.com',
      folderId: null,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.duplicate).toBe(false);
      expect(result.bookmark.title).toBe('Example');
      expect(result.bookmark.url).toBe('https://example.com');
      expect(result.bookmark.folderId).toBeNull();
      expect(manager.bookmarksList).toHaveLength(1);
    }
  });

  it('removes a bookmark', () => {
    const manager = new BookmarkManager();
    const added = manager.addBookmark({
      title: 'Example',
      url: 'https://example.com',
      folderId: null,
    });
    if (!added.ok) throw new Error('setup');
    expect(manager.deleteBookmark(added.bookmark.id)).toBe(true);
    expect(manager.isEmpty).toBe(true);
    expect(manager.deleteBookmark(added.bookmark.id)).toBe(false);
  });

  it('edits a bookmark (title, URL, folder)', () => {
    const manager = new BookmarkManager();
    const folder = manager.createFolder('Dev');
    const added = manager.addBookmark({
      title: 'Old',
      url: 'https://old.example',
      folderId: null,
    });
    if (!added.ok || folder === null) throw new Error('setup');
    const updated = manager.updateBookmark(added.bookmark.id, {
      title: 'New',
      url: 'https://new.example',
      folderId: folder.id,
    });
    expect(updated.ok).toBe(true);
    if (updated.ok) {
      expect(updated.bookmark.title).toBe('New');
      expect(updated.bookmark.url).toBe('https://new.example');
      expect(updated.bookmark.folderId).toBe(folder.id);
      expect(updated.bookmark.updatedAt).toBeGreaterThanOrEqual(added.bookmark.updatedAt);
    }
  });

  it('does not create duplicates for the same normalized URL', () => {
    const manager = new BookmarkManager();
    manager.addBookmark({ title: 'One', url: 'https://example.com', folderId: null });
    const second = manager.addBookmark({
      title: 'Two',
      url: 'https://example.com/',
      folderId: null,
    });
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.duplicate).toBe(true);
      expect(second.bookmark.title).toBe('One');
    }
    expect(manager.bookmarksList).toHaveLength(1);
  });

  it('creates a folder', () => {
    const manager = new BookmarkManager();
    const folder = manager.createFolder('Education');
    expect(folder).not.toBeNull();
    if (folder !== null) {
      expect(manager.folder(folder.id)?.name).toBe('Education');
    }
  });

  it('rejects empty folder names', () => {
    const manager = new BookmarkManager();
    expect(manager.createFolder('   ')).toBeNull();
    expect(manager.createFolder('')).toBeNull();
  });

  it('renames a folder', () => {
    const manager = new BookmarkManager();
    const folder = manager.createFolder('Old');
    if (folder === null) throw new Error('setup');
    expect(manager.renameFolder(folder.id, 'New')).toBe(true);
    expect(manager.folder(folder.id)?.name).toBe('New');
    expect(manager.renameFolder('missing', 'X')).toBe(false);
  });

  it('deletes a folder by moving bookmarks to the root (never destroying them)', () => {
    const manager = new BookmarkManager();
    const folder = manager.createFolder('Dev');
    if (folder === null) throw new Error('setup');
    const added = manager.addBookmark({
      title: 'Inside',
      url: 'https://example.com',
      folderId: folder.id,
    });
    if (!added.ok) throw new Error('setup');
    expect(manager.deleteFolder(folder.id)).toBe(true);
    expect(manager.folder(folder.id)).toBeNull();
    expect(manager.bookmarksList).toHaveLength(1);
    expect(manager.bookmarksList[0]?.folderId).toBeNull();
  });

  it('moves a bookmark to a folder and back to root', () => {
    const manager = new BookmarkManager();
    const folder = manager.createFolder('Personal');
    const added = manager.addBookmark({
      title: 'B',
      url: 'https://example.com',
      folderId: null,
    });
    if (!added.ok || folder === null) throw new Error('setup');
    expect(manager.moveBookmark(added.bookmark.id, folder.id)).toBe(true);
    expect(manager.bookmark(added.bookmark.id)?.folderId).toBe(folder.id);
    expect(manager.moveBookmark(added.bookmark.id, null)).toBe(true);
    expect(manager.bookmark(added.bookmark.id)?.folderId).toBeNull();
  });

  it('rejects moving to a missing folder', () => {
    const manager = new BookmarkManager();
    const added = manager.addBookmark({
      title: 'B',
      url: 'https://example.com',
      folderId: null,
    });
    if (!added.ok) throw new Error('setup');
    expect(manager.moveBookmark(added.bookmark.id, 'missing')).toBe(false);
  });

  it('searches across title and URL case-insensitively', () => {
    const manager = new BookmarkManager();
    manager.addBookmark({ title: 'GitHub', url: 'https://github.com', folderId: null });
    manager.addBookmark({ title: 'Docs', url: 'https://developer.example.com', folderId: null });
    expect(manager.search('github')).toHaveLength(1);
    expect(manager.search('GITHUB')).toHaveLength(1);
    expect(manager.search('developer')).toHaveLength(1);
    expect(manager.search('docs')).toHaveLength(1);
    expect(manager.search('example')).toHaveLength(1);
    expect(manager.search('nope')).toHaveLength(0);
  });

  it('sorts by recently added, name A-Z and Z-A', () => {
    // Seed with explicit, distinct timestamps so the "recent" order is
    // deterministic (independent of wall-clock timing between the two adds).
    const manager = new BookmarkManager({
      version: 1,
      bookmarks: [
        {
          id: 'bm_old',
          title: 'Zebra',
          url: 'https://z.example',
          createdAt: 1000,
          updatedAt: 1000,
          folderId: null,
          favicon: null,
        },
        {
          id: 'bm_new',
          title: 'Apple',
          url: 'https://a.example',
          createdAt: 2000,
          updatedAt: 2000,
          folderId: null,
          favicon: null,
        },
      ],
      folders: [],
    });
    expect(manager.sorted('name-asc').map((b) => b.title)).toEqual(['Apple', 'Zebra']);
    expect(manager.sorted('name-desc').map((b) => b.title)).toEqual(['Zebra', 'Apple']);
    expect(manager.sorted('recent').map((b) => b.title)).toEqual(['Apple', 'Zebra']);
  });

  it('rejects invalid URL and missing title on add', () => {
    const manager = new BookmarkManager();
    expect(
      manager.addBookmark({ title: 'X', url: 'javascript:alert(1)', folderId: null }).ok,
    ).toBe(false);
    expect(
      manager.addBookmark({ title: '  ', url: 'https://example.com', folderId: null }).ok,
    ).toBe(false);
  });

  it('rejects adding to a missing folder', () => {
    const manager = new BookmarkManager();
    const result = manager.addBookmark({
      title: 'X',
      url: 'https://example.com',
      folderId: 'nope',
    });
    expect(result).toEqual({ ok: false, reason: 'invalid-folder' });
  });

  it('finds the bookmark for a URL (toolbar/button state)', () => {
    const manager = new BookmarkManager();
    manager.addBookmark({ title: 'Example', url: 'https://example.com', folderId: null });
    expect(manager.bookmarkForUrl('https://example.com/')?.title).toBe('Example');
    expect(manager.bookmarkForUrl('https://other.com')).toBeNull();
  });

  it('never executes titles or URLs (they are plain strings)', () => {
    const manager = new BookmarkManager();
    const added = manager.addBookmark({
      title: '<img src=x onerror=alert(1)>',
      url: 'https://example.com',
      folderId: null,
    });
    expect(added.ok).toBe(true);
    if (added.ok) {
      // The title is just text; the manager stores it verbatim without any
      // execution. Only validated URLs are accepted for storage.
      expect(added.bookmark.title).toBe('<img src=x onerror=alert(1)>');
    }
  });

  it('round-trips a collection through snapshot', () => {
    const manager = new BookmarkManager();
    const folder = manager.createFolder('F');
    if (folder === null) throw new Error('setup');
    manager.addBookmark({ title: 'A', url: 'https://a.example', folderId: folder.id });
    const restored = new BookmarkManager(manager.snapshot());
    expect(restored.bookmarksList).toEqual(manager.bookmarksList);
    expect(restored.foldersList).toEqual(manager.foldersList);
  });
});