/**
 * Tests for the download store.
 *
 * The store is pure (no Electron import): it reads and writes a JSON file at
 * a caller-provided path. These tests use a temporary directory and exercise
 * defaults, round-trips, atomic writes, corrupt-file fail-safety, hostile-data
 * rejection, and restart persistence.
 */

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DownloadManager } from '@shodasha/core';
import { DownloadStore } from './downloadStore.js';

function tempStore(): {
  store: DownloadStore;
  file: string;
  cleanup: () => void;
} {
  const dir = mkdtempSync(join(tmpdir(), 'shodasha-downloads-'));
  const file = join(dir, 'downloads.json');
  return {
    store: new DownloadStore(file),
    file,
    cleanup: () => {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

function managerWithOneDownload(): { manager: DownloadManager; id: string } {
  const manager = new DownloadManager();
  const result = manager.addDownload({
    url: 'https://example.com/file.pdf',
    filename: 'file.pdf',
    savePath: 'C:/downloads/file.pdf',
  });
  if (!result.ok) throw new Error('setup');
  return { manager, id: result.item.id };
}

describe('DownloadStore', () => {
  it('returns an empty collection when no file exists', () => {
    const { store, cleanup } = tempStore();
    expect(store.load()).toEqual({ version: 1, items: [] });
    cleanup();
  });

  it('returns an empty collection for corrupt JSON (never throws)', () => {
    const { store, file, cleanup } = tempStore();
    writeFileSync(file, '{ not valid json', 'utf8');
    expect(store.load()).toEqual({ version: 1, items: [] });
    cleanup();
  });

  it('returns an empty collection for a corrupt structure', () => {
    const { store, file, cleanup } = tempStore();
    writeFileSync(file, JSON.stringify({ items: 'nope' }), 'utf8');
    expect(store.load()).toEqual({ version: 1, items: [] });
    cleanup();
  });

  it('round-trips downloads through flush + load', () => {
    const { store, file, cleanup } = tempStore();
    const { manager, id } = managerWithOneDownload();
    store.scheduleSave(manager.snapshot());
    store.flush();

    const loaded = store.load();
    expect(loaded.items).toHaveLength(1);
    expect(loaded.items[0]?.filename).toBe('file.pdf');
    expect(loaded.items[0]?.id).toBe(id);

    const onDisk = JSON.parse(readFileSync(file, 'utf8')) as {
      version: unknown;
      items: unknown;
    };
    expect(onDisk.version).toBe(1);
    expect(Array.isArray(onDisk.items)).toBe(true);
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
    const first = new DownloadManager();
    first.addDownload({
      url: 'https://a.example/a.bin',
      filename: 'a.bin',
      savePath: 'C:/downloads/a.bin',
    });
    const second = new DownloadManager();
    second.addDownload({
      url: 'https://b.example/b.bin',
      filename: 'b.bin',
      savePath: 'C:/downloads/b.bin',
    });
    store.scheduleSave(first.snapshot());
    store.scheduleSave(second.snapshot());
    store.flush();
    const loaded = store.load();
    expect(loaded.items).toHaveLength(1);
    expect(loaded.items[0]?.filename).toBe('b.bin');
    cleanup();
  });

  it('drops invalid and dangerous download records on load', () => {
    const { store, file, cleanup } = tempStore();
    writeFileSync(
      file,
      JSON.stringify({
        version: 1,
        items: [
          {
            id: 'dl_1',
            url: 'https://good.example/a.bin',
            filename: 'a.bin',
            savePath: 'C:/downloads/a.bin',
            state: 'completed',
          },
          {
            id: 'dl_2',
            url: 'file:///etc/passwd',
            filename: 'passwd',
            savePath: 'C:/downloads/passwd',
            state: 'completed',
          },
          {
            id: 'dl_3',
            url: 'https://good.example/b.bin',
            filename: 'b.bin',
            savePath: '',
            state: 'completed',
          },
        ],
      }),
      'utf8',
    );
    const loaded = store.load();
    expect(loaded.items).toHaveLength(1);
    expect(loaded.items[0]?.id).toBe('dl_1');
    cleanup();
  });

  it('survives a fresh store instance reading the same file (restart)', () => {
    const { store, file, cleanup } = tempStore();
    const { manager, id } = managerWithOneDownload();
    store.scheduleSave(manager.snapshot());
    store.flush();
    const restarted = new DownloadStore(file);
    const loaded = restarted.load();
    expect(loaded.items).toHaveLength(1);
    expect(loaded.items[0]?.id).toBe(id);
    cleanup();
  });
});