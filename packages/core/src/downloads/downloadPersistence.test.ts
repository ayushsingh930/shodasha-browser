import { describe, expect, it } from 'vitest';
import {
  emptyDownloadCollection,
  parseDownloadCollection,
  serializeDownloadCollection,
} from './downloadPersistence.js';
import type { DownloadItem } from './downloadModel.js';

function item(overrides: Partial<DownloadItem>): DownloadItem {
  return {
    id: 'dl_1',
    url: 'https://example.com/file.pdf',
    filename: 'file.pdf',
    savePath: 'C:/downloads/file.pdf',
    state: 'completed',
    receivedBytes: 100,
    totalBytes: 100,
    startedAt: 1000,
    completedAt: 2000,
    error: null,
    mimeType: 'application/pdf',
    executable: false,
    ...overrides,
  };
}

describe('emptyDownloadCollection', () => {
  it('returns a valid empty collection', () => {
    expect(emptyDownloadCollection()).toEqual({ version: 1, items: [] });
  });
});

describe('serializeDownloadCollection', () => {
  it('round-trips a valid collection', () => {
    const collection = { version: 1 as const, items: [item({})] };
    const parsed = parseDownloadCollection(
      JSON.parse(serializeDownloadCollection(collection)),
    );
    expect(parsed.version).toBe(1);
    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0]?.id).toBe('dl_1');
    expect(parsed.items[0]?.url).toBe('https://example.com/file.pdf');
  });
});

describe('parseDownloadCollection', () => {
  it('returns an empty collection for non-object input', () => {
    for (const bad of [null, undefined, 42, 'hello', true]) {
      expect(parseDownloadCollection(bad)).toEqual({ version: 1, items: [] });
    }
  });

  it('returns an empty collection for a missing items array', () => {
    expect(parseDownloadCollection({})).toEqual({ version: 1, items: [] });
  });

  it('drops invalid records but preserves valid ones', () => {
    const raw = {
      version: 1,
      items: [
        item({}),
        { id: 'dl_bad', url: 'file:///etc/passwd', filename: 'x', savePath: 'x' },
        { id: 'dl_bad2', url: 'https://example.com/ok.pdf', savePath: '' },
        item({ id: 'dl_3', url: 'https://example.com/ok2.pdf', filename: 'ok2.pdf' }),
      ],
    };
    const parsed = parseDownloadCollection(raw);
    expect(parsed.items).toHaveLength(2);
    expect(parsed.items.map((i) => i.id).sort()).toEqual(['dl_1', 'dl_3']);
  });

  it('never throws and drops records with invalid state', () => {
    const raw = {
      version: 1,
      items: [
        item({ id: 'dl_ok', state: 'completed' as DownloadItem['state'] }),
        item({ id: 'dl_weird', state: 'exploded' as DownloadItem['state'] }),
      ],
    };
    const parsed = parseDownloadCollection(raw);
    expect(parsed.items).toHaveLength(2);
    // Invalid states fall back to a safe value instead of crashing.
    expect(parsed.items.some((i) => i.state === 'cancelled')).toBe(true);
  });

  it('deduplicates by id, keeping the first', () => {
    const raw = {
      version: 1,
      items: [item({ id: 'dl_dup' }), item({ id: 'dl_dup', url: 'https://x.example/b' })],
    };
    const parsed = parseDownloadCollection(raw);
    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0]?.url).toBe('https://example.com/file.pdf');
  });

  it('assigns a fresh id when one is missing', () => {
    const raw = { version: 1, items: [item({ id: '' })] };
    const parsed = parseDownloadCollection(raw);
    expect(parsed.items[0]?.id).toMatch(/^dl_/);
  });

  it('sanitizes hostile filenames on load', () => {
    const raw = {
      version: 1,
      items: [item({ filename: '../../../../etc/passwd', savePath: 'C:/downloads/passwd' })],
    };
    const parsed = parseDownloadCollection(raw);
    expect(parsed.items[0]?.filename).toBe('passwd');
  });

  it('sorts newest first', () => {
    const raw = {
      version: 1,
      items: [
        item({ id: 'dl_old', startedAt: 1000 }),
        item({ id: 'dl_new', startedAt: 2000 }),
        item({ id: 'dl_mid', startedAt: 1500 }),
      ],
    };
    const parsed = parseDownloadCollection(raw);
    expect(parsed.items.map((i) => i.id)).toEqual(['dl_new', 'dl_mid', 'dl_old']);
  });
});