import { describe, expect, it } from 'vitest';
import {
  parseHistoryCollection,
  serializeHistoryCollection,
} from './historyPersistence.js';
import type { HistoryCollection } from './historyModel.js';

describe('parseHistoryCollection', () => {
  it('returns an empty collection for non-object input', () => {
    expect(parseHistoryCollection(null).entries).toEqual([]);
    expect(parseHistoryCollection(undefined).entries).toEqual([]);
    expect(parseHistoryCollection('nope').entries).toEqual([]);
    expect(parseHistoryCollection(42).entries).toEqual([]);
  });

  it('drops malformed entries and preserves valid ones', () => {
    const raw = {
      version: 1,
      entries: [
        null,
        42,
        'https://example.com',
        { url: 'https://example.com/a', title: 'A', visitedAt: 100 },
        { url: 'javascript:alert(1)', title: 'Bad', visitedAt: 200 },
        { url: 'shodasha://bookmarks', title: 'Internal', visitedAt: 300 },
        { id: 'x', url: 'https://example.com/b', title: 'B' },
      ],
    };
    const parsed = parseHistoryCollection(raw);
    expect(parsed.entries.map((e) => e.url).sort()).toEqual([
      'https://example.com/a',
      'https://example.com/b',
    ]);
  });

  it('sorts entries newest-first', () => {
    const raw = {
      version: 1,
      entries: [
        { url: 'https://example.com/old', visitedAt: 100 },
        { url: 'https://example.com/new', visitedAt: 900 },
        { url: 'https://example.com/mid', visitedAt: 500 },
      ],
    };
    const parsed = parseHistoryCollection(raw);
    expect(parsed.entries.map((e) => e.visitedAt)).toEqual([900, 500, 100]);
  });

  it('deduplicates ids, keeping the first occurrence', () => {
    const raw = {
      version: 1,
      entries: [
        { id: 'a', url: 'https://example.com/a', visitedAt: 100 },
        { id: 'a', url: 'https://example.com/b', visitedAt: 200 },
      ],
    };
    const parsed = parseHistoryCollection(raw);
    expect(parsed.entries).toHaveLength(1);
    expect(parsed.entries[0]?.url).toBe('https://example.com/a');
  });

  it('falls back to safe values for missing fields', () => {
    const raw = {
      version: 1,
      entries: [
        { url: 'https://example.com/a', title: 42, visitedAt: -1 },
        { url: 'https://example.com/b', favicon: 'javascript:alert(1)' },
      ],
    };
    const parsed = parseHistoryCollection(raw);
    expect(parsed.entries).toHaveLength(2);
    expect(parsed.entries[0]?.title).toBe('');
    expect(parsed.entries[0]?.visitedAt).toBeGreaterThanOrEqual(0);
    expect(parsed.entries[0]?.favicon).toBeNull();
  });

  it('round-trips through serializeHistoryCollection', () => {
    const collection: HistoryCollection = {
      version: 1,
      entries: [
        {
          id: 'he_1',
          url: 'https://example.com/a',
          title: 'Example',
          visitedAt: 100,
          favicon: 'https://example.com/favicon.ico',
        },
      ],
    };
    const json = serializeHistoryCollection(collection);
    const parsed = parseHistoryCollection(JSON.parse(json));
    expect(parsed).toEqual(collection);
  });
});
