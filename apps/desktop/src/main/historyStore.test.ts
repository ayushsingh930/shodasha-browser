/**
 * Tests for the history store.
 *
 * The store is pure (no Electron import): it reads and writes a JSON file at
 * a caller-provided path. These tests use a temporary directory and exercise
 * defaults, round-trips, atomic writes, corrupt-file fail-safety, and restart
 * persistence.
 */

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HistoryStore } from './historyStore.js';
import { HistoryManager } from '@shodasha/core';

function tempStore(): {
  store: HistoryStore;
  file: string;
  cleanup: () => void;
} {
  const dir = mkdtempSync(join(tmpdir(), 'shodasha-history-'));
  const file = join(dir, 'history.json');
  return {
    store: new HistoryStore(file),
    file,
    cleanup: () => {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

function managerWithOneVisit(): { manager: HistoryManager; id: string } {
  const manager = new HistoryManager();
  const result = manager.recordVisit({ url: 'https://example.com', title: 'Example' });
  if (!result.ok) throw new Error('setup');
  return { manager, id: result.entry.id };
}

describe('HistoryStore', () => {
  it('returns an empty collection when no file exists', () => {
    const { store, cleanup } = tempStore();
    expect(store.load()).toEqual({ version: 1, entries: [] });
    cleanup();
  });

  it('returns an empty collection for corrupt JSON (never throws)', () => {
    const { store, file, cleanup } = tempStore();
    writeFileSync(file, '{ not valid json', 'utf8');
    expect(store.load()).toEqual({ version: 1, entries: [] });
    cleanup();
  });

  it('returns an empty collection for a corrupt structure', () => {
    const { store, file, cleanup } = tempStore();
    writeFileSync(file, JSON.stringify({ entries: 'nope' }), 'utf8');
    expect(store.load()).toEqual({ version: 1, entries: [] });
    cleanup();
  });

  it('round-trips history through flush + load', () => {
    const { store, file, cleanup } = tempStore();
    const { manager } = managerWithOneVisit();
    store.scheduleSave(manager.snapshot());
    store.flush();

    const loaded = store.load();
    expect(loaded.entries).toHaveLength(1);
    expect(loaded.entries[0]?.title).toBe('Example');
    expect(loaded.entries[0]?.url).toBe('https://example.com');

    const onDisk = JSON.parse(readFileSync(file, 'utf8')) as {
      version: unknown;
      entries: unknown;
    };
    expect(onDisk.version).toBe(1);
    expect(Array.isArray(onDisk.entries)).toBe(true);
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
    const first = new HistoryManager();
    first.recordVisit({ url: 'https://a.example', title: 'A' });
    const second = new HistoryManager();
    second.recordVisit({ url: 'https://b.example', title: 'B' });
    store.scheduleSave(first.snapshot());
    store.scheduleSave(second.snapshot());
    store.flush();
    const loaded = store.load();
    expect(loaded.entries).toHaveLength(1);
    expect(loaded.entries[0]?.title).toBe('B');
    cleanup();
  });

  it('drops invalid history entries written to disk on load', () => {
    const { store, file, cleanup } = tempStore();
    writeFileSync(
      file,
      JSON.stringify({
        version: 1,
        entries: [
          { url: 'https://good.example', title: 'Good', visitedAt: 100 },
          { url: 'javascript:alert(1)', title: 'Danger', visitedAt: 200 },
          { url: 'shodasha://bookmarks', title: 'Internal', visitedAt: 300 },
          { url: 'https://empty.example', title: '', visitedAt: 400 },
        ],
      }),
      'utf8',
    );
    const loaded = store.load();
    expect(loaded.entries).toHaveLength(2);
    expect(loaded.entries.map((e) => e.url).sort()).toEqual([
      'https://empty.example',
      'https://good.example',
    ]);
    cleanup();
  });

  it('survives a fresh store instance reading the same file (restart)', () => {
    const { store, file, cleanup } = tempStore();
    const { manager } = managerWithOneVisit();
    store.scheduleSave(manager.snapshot());
    store.flush();
    const restarted = new HistoryStore(file);
    const loaded = restarted.load();
    expect(loaded.entries).toHaveLength(1);
    expect(loaded.entries[0]?.url).toBe('https://example.com');
    cleanup();
  });
});