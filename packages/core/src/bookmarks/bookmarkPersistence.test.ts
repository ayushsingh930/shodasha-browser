/**
 * Tests for bookmark persistence/import-export parsing.
 *
 * The browser must never crash because bookmark storage is corrupted. Parsing
 * is fail-safe: malformed JSON, invalid URLs, missing fields, and unknown
 * folder ids are handled without destroying valid user data.
 */

import { describe, expect, it } from 'vitest';
import {
  parseBookmarkCollection,
  serializeBookmarkCollection,
} from './bookmarkPersistence.js';
import { BookmarkManager } from './bookmarkManager.js';

describe('parseBookmarkCollection', () => {
  it('returns an empty collection for missing/corrupt roots (never throws)', () => {
    expect(parseBookmarkCollection(null)).toEqual({
      version: 1,
      bookmarks: [],
      folders: [],
    });
    expect(parseBookmarkCollection('not an object')).toEqual({
      version: 1,
      bookmarks: [],
      folders: [],
    });
    expect(parseBookmarkCollection({ bookmarks: 'nope' })).toEqual({
      version: 1,
      bookmarks: [],
      folders: [],
    });
  });

  it('drops malformed bookmark entries but keeps valid ones', () => {
    const parsed = parseBookmarkCollection({
      bookmarks: [
        { title: 'Good', url: 'https://good.example', folderId: null },
        { title: '', url: 'https://bad.example', folderId: null },
        { title: 'Danger', url: 'javascript:alert(1)', folderId: null },
        { title: 'No URL', url: 42, folderId: null },
        { title: 'Good 2', url: 'https://good2.example', folderId: null },
      ],
    });
    expect(parsed.bookmarks).toHaveLength(2);
    expect(parsed.bookmarks.map((b) => b.title)).toEqual(['Good', 'Good 2']);
  });

  it('preserves bookmarks whose folder is missing by moving them to root', () => {
    const parsed = parseBookmarkCollection({
      folders: [{ id: 'fd1', name: 'Exists' }],
      bookmarks: [
        { title: 'In missing', url: 'https://a.example', folderId: 'fd-missing' },
        { title: 'In existing', url: 'https://b.example', folderId: 'fd1' },
      ],
    });
    expect(parsed.folders).toHaveLength(1);
    expect(parsed.bookmarks).toHaveLength(2);
    const missing = parsed.bookmarks.find((b) => b.title === 'In missing');
    expect(missing?.folderId).toBeNull();
    const existing = parsed.bookmarks.find((b) => b.title === 'In existing');
    expect(existing?.folderId).toBe('fd1');
  });

  it('handles missing fields with safe defaults', () => {
    const parsed = parseBookmarkCollection({
      bookmarks: [{ title: 'Minimal', url: 'https://min.example' }],
    });
    expect(parsed.bookmarks).toHaveLength(1);
    const bookmark = parsed.bookmarks[0];
    expect(bookmark?.folderId).toBeNull();
    expect(bookmark?.favicon).toBeNull();
    expect(typeof bookmark?.createdAt).toBe('number');
  });

  it('deduplicates repeated ids on load', () => {
    const parsed = parseBookmarkCollection({
      bookmarks: [
        { id: 'bm1', title: 'A', url: 'https://a.example', folderId: null },
        { id: 'bm1', title: 'B', url: 'https://b.example', folderId: null },
      ],
    });
    expect(parsed.bookmarks).toHaveLength(1);
  });

  it('rejects empty folder names and duplicate folder ids', () => {
    const parsed = parseBookmarkCollection({
      folders: [
        { id: 'fd1', name: 'Dev' },
        { id: 'fd1', name: 'Other' },
        { id: 'fd2', name: '  ' },
      ],
    });
    expect(parsed.folders).toHaveLength(1);
    expect(parsed.folders[0]?.name).toBe('Dev');
  });
});

describe('serializeBookmarkCollection', () => {
  it('round-trips a collection through parse', () => {
    const manager = new BookmarkManager();
    const folder = manager.createFolder('Dev');
    if (folder === null) throw new Error('setup');
    manager.addBookmark({
      title: 'GitHub',
      url: 'https://github.com',
      folderId: folder.id,
    });
    manager.addBookmark({
      title: 'Docs',
      url: 'https://docs.example.com',
      folderId: null,
    });
    const serialized = serializeBookmarkCollection(manager.snapshot());
    const parsed = parseBookmarkCollection(JSON.parse(serialized));
    expect(parsed).toEqual(manager.snapshot());
  });

  it('produces the stable export shape (version, bookmarks, folders)', () => {
    const manager = new BookmarkManager();
    manager.addBookmark({ title: 'A', url: 'https://a.example', folderId: null });
    const parsed = JSON.parse(serializeBookmarkCollection(manager.snapshot())) as {
      version: unknown;
      bookmarks: unknown;
      folders: unknown;
    };
    expect(parsed.version).toBe(1);
    expect(Array.isArray(parsed.bookmarks)).toBe(true);
    expect(Array.isArray(parsed.folders)).toBe(true);
  });
});