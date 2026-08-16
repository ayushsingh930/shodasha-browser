/**
 * Tests for the bookmark store.
 *
 * The store is pure (no Electron import): it reads and writes a JSON file at
 * a caller-provided path. These tests use a temporary directory and exercise
 * defaults, round-trips, atomic writes, and corrupt-file fail-safety.
 */

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BookmarkStore } from './bookmarkStore.js';
import { BookmarkManager } from '@shodasha/core';

function tempStore(): {
  store: BookmarkStore;
  file: string;
  cleanup: () => void;
} {
  const dir = mkdtempSync(join(tmpdir(), 'shodasha-bookmarks-'));
  const file = join(dir, 'bookmarks.json');
  return {
    store: new BookmarkStore(file),
    file,
    cleanup: () => {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

function managerWithOneBookmark(): { manager: BookmarkManager; id: string } {
  const manager = new BookmarkManager();
  const result = manager.addBookmark({
    title: 'Example',
    url: 'https://example.com',
    folderId: null,
  });
  if (!result.ok) throw new Error('setup');
  return { manager, id: result.bookmark.id };
}

describe('BookmarkStore', () => {
  it('returns an empty collection when no file exists', () => {
    const { store, cleanup } = tempStore();
    expect(store.load()).toEqual({ version: 1, bookmarks: [], folders: [] });
    cleanup();
  });

  it('returns an empty collection for corrupt JSON (never throws)', () => {
    const { store, file, cleanup } = tempStore();
    writeFileSync(file, '{ not valid json', 'utf8');
    expect(store.load()).toEqual({ version: 1, bookmarks: [], folders: [] });
    cleanup();
  });

  it('returns an empty collection for a corrupt structure', () => {
    const { store, file, cleanup } = tempStore();
    writeFileSync(file, JSON.stringify({ bookmarks: 'nope' }), 'utf8');
    expect(store.load()).toEqual({ version: 1, bookmarks: [], folders: [] });
    cleanup();
  });

  it('round-trips bookmarks through flush + load', () => {
    const { store, file, cleanup } = tempStore();
    const { manager } = managerWithOneBookmark();
    store.scheduleSave(manager.snapshot());
    store.flush();

    const loaded = store.load();
    expect(loaded.bookmarks).toHaveLength(1);
    expect(loaded.bookmarks[0]?.title).toBe('Example');
    expect(loaded.bookmarks[0]?.url).toBe('https://example.com');

    const onDisk = JSON.parse(readFileSync(file, 'utf8')) as {
      version: unknown;
      bookmarks: unknown;
      folders: unknown;
    };
    expect(onDisk.version).toBe(1);
    expect(Array.isArray(onDisk.bookmarks)).toBe(true);
    expect(Array.isArray(onDisk.folders)).toBe(true);
    cleanup();
  });

  it('flushing without pending data writes nothing', () => {
    const { store, file, cleanup } = tempStore();
    store.flush();
    expect(() => readFileSync(file, 'utf8')).toThrow();
    cleanup();
  });

  it('keeps only the latest pending snapshot across debounce', () => {
    const { store, cleanup } = tempStore();
    const first = new BookmarkManager();
    first.addBookmark({ title: 'A', url: 'https://a.example', folderId: null });
    const second = new BookmarkManager();
    second.addBookmark({ title: 'B', url: 'https://b.example', folderId: null });
    store.scheduleSave(first.snapshot());
    store.scheduleSave(second.snapshot());
    store.flush();
    const loaded = store.load();
    expect(loaded.bookmarks).toHaveLength(1);
    expect(loaded.bookmarks[0]?.title).toBe('B');
    cleanup();
  });

  it('drops invalid bookmark entries written to disk on load', () => {
    const { store, file, cleanup } = tempStore();
    writeFileSync(
      file,
      JSON.stringify({
        version: 1,
        bookmarks: [
          { title: 'Good', url: 'https://good.example', folderId: null },
          { title: 'Danger', url: 'javascript:alert(1)', folderId: null },
          { title: '', url: 'https://bad.example', folderId: null },
        ],
        folders: [],
      }),
      'utf8',
    );
    const loaded = store.load();
    expect(loaded.bookmarks).toHaveLength(1);
    expect(loaded.bookmarks[0]?.title).toBe('Good');
    cleanup();
  });

  it('survives a fresh store instance reading the same file (restart)', () => {
    const { store, file, cleanup } = tempStore();
    const { manager } = managerWithOneBookmark();
    store.scheduleSave(manager.snapshot());
    store.flush();
    const restarted = new BookmarkStore(file);
    const loaded = restarted.load();
    expect(loaded.bookmarks).toHaveLength(1);
    expect(loaded.bookmarks[0]?.url).toBe('https://example.com');
    cleanup();
  });
});