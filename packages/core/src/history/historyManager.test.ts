import { afterEach, describe, expect, it, vi } from 'vitest';
import { HistoryManager, MAX_HISTORY_ENTRIES } from './historyManager.js';
import {
  historyDateGroupFor,
  type HistoryCollection,
  type HistoryEntry,
} from './historyModel.js';

afterEach(() => {
  vi.useRealTimers();
});

function entry(
  id: string,
  url: string,
  visitedAt: number,
  title = '',
): HistoryEntry {
  return { id, url, title, visitedAt, favicon: null };
}

function collection(entries: HistoryEntry[]): HistoryCollection {
  return { version: 1, entries };
}

describe('HistoryManager.recordVisit', () => {
  it('records a valid http(s) visit with a fresh id and timestamp', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
    const manager = new HistoryManager();
    const result = manager.recordVisit({
      url: 'https://example.com/a',
      title: 'Example',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.entry.id).toMatch(/^he_/);
    expect(result.entry.url).toBe('https://example.com/a');
    expect(result.entry.title).toBe('Example');
    expect(result.entry.visitedAt).toBe(Date.now());
    expect(result.updated).toBe(false);
    expect(manager.size).toBe(1);
  });

  it('records http and https pages', () => {
    const manager = new HistoryManager();
    expect(
      manager.recordVisit({ url: 'https://example.com', title: '' }).ok,
    ).toBe(true);
    expect(
      manager.recordVisit({ url: 'http://example.net', title: '' }).ok,
    ).toBe(true);
    expect(manager.size).toBe(2);
  });

  it('rejects non-web and dangerous URLs', () => {
    const manager = new HistoryManager();
    for (const bad of [
      '',
      'javascript:alert(1)',
      'data:text/html,hi',
      'file:///etc/passwd',
      'shodasha://bookmarks',
      'shodasha://history',
      'about:blank',
      'not a url',
      'https://',
    ]) {
      const result = manager.recordVisit({ url: bad, title: '' });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe('invalid-url');
      }
    }
    expect(manager.isEmpty).toBe(true);
  });

  it('folds a reload of the same page into the latest entry', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
    const manager = new HistoryManager();
    const first = manager.recordVisit({
      url: 'https://example.com/',
      title: 'A',
    });
    expect(first.ok).toBe(true);
    vi.setSystemTime(new Date('2026-01-15T12:00:03Z'));
    const second = manager.recordVisit({
      url: 'https://example.com',
      title: 'A',
    });
    expect(second.ok).toBe(true);
    if (!second.ok) {
      return;
    }
    expect(second.updated).toBe(true);
    expect(manager.size).toBe(1);
    // Timestamp refreshed, url normalized to the new value.
    expect(second.entry.visitedAt).toBe(Date.now());
    expect(second.entry.url).toBe('https://example.com');
  });

  it('records a genuine later visit as a new entry', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
    const manager = new HistoryManager();
    manager.recordVisit({ url: 'https://example.com', title: '' });
    vi.setSystemTime(new Date('2026-01-15T15:00:00Z'));
    const result = manager.recordVisit({
      url: 'https://example.com',
      title: '',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.updated).toBe(false);
    expect(manager.size).toBe(2);
    expect(manager.list[0]?.visitedAt).toBe(Date.now());
  });

  it('does not fold different pages into one entry', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
    const manager = new HistoryManager();
    manager.recordVisit({ url: 'https://example.com/a', title: '' });
    vi.setSystemTime(new Date('2026-01-15T12:00:02Z'));
    manager.recordVisit({ url: 'https://example.com/b', title: '' });
    expect(manager.size).toBe(2);
  });

  it('never records private (future incognito) visits', () => {
    const manager = new HistoryManager();
    const result = manager.recordVisit(
      { url: 'https://example.com', title: '' },
      { private: true },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('private');
    }
    expect(manager.isEmpty).toBe(true);
  });

  it('rejects unsafe favicons but keeps safe ones', () => {
    const manager = new HistoryManager();
    const ok = manager.recordVisit({
      url: 'https://example.com',
      title: '',
      favicon: 'https://example.com/favicon.ico',
    });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.entry.favicon).toBe('https://example.com/favicon.ico');
    }
    const unsafe = manager.recordVisit({
      url: 'https://other.example',
      title: '',
      favicon: 'javascript:alert(1)',
    });
    expect(unsafe.ok).toBe(true);
    if (unsafe.ok) {
      expect(unsafe.entry.favicon).toBeNull();
    }
  });

  it('evicts the oldest entries beyond the retention limit', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
    const manager = new HistoryManager();
    for (let i = 0; i < MAX_HISTORY_ENTRIES + 5; i += 1) {
      manager.recordVisit({
        url: `https://example.com/page/${String(i)}`,
        title: '',
      });
      vi.setSystemTime(new Date(vi.getMockedSystemTime()!.getTime() + 1));
    }
    expect(manager.size).toBe(MAX_HISTORY_ENTRIES);
    const urls = manager.list.map((e) => e.url);
    expect(urls[0]).toBe(`https://example.com/page/${String(MAX_HISTORY_ENTRIES + 4)}`);
    expect(urls).not.toContain('https://example.com/page/0');
  });
});

describe('HistoryManager deletion and clearing', () => {
  it('deletes a single entry', () => {
    const manager = new HistoryManager(
      collection([
        entry('a', 'https://example.com/a', 100),
        entry('b', 'https://example.com/b', 200),
      ]),
    );
    expect(manager.deleteEntry('a')).toBe(true);
    expect(manager.deleteEntry('a')).toBe(false);
    expect(manager.size).toBe(1);
    expect(manager.entry('b')).not.toBeNull();
  });

  it('clears a time range (inclusive)', () => {
    const manager = new HistoryManager(
      collection([
        entry('a', 'https://example.com/a', 100),
        entry('b', 'https://example.com/b', 500),
        entry('c', 'https://example.com/c', 900),
      ]),
    );
    const removed = manager.clearRange(200, 800);
    expect(removed).toBe(1);
    expect(manager.entry('a')).not.toBeNull();
    expect(manager.entry('b')).toBeNull();
    expect(manager.entry('c')).not.toBeNull();
  });

  it('clears the last hour boundary correctly', () => {
    const now = 1_700_000_000_000;
    const manager = new HistoryManager(
      collection([
        entry('recent', 'https://example.com/recent', now - 30 * 60_000),
        entry('old', 'https://example.com/old', now - 2 * 3_600_000),
      ]),
    );
    const removed = manager.clearRange(now - 3_600_000, now);
    expect(removed).toBe(1);
    expect(manager.entry('old')).not.toBeNull();
    expect(manager.entry('recent')).toBeNull();
  });

  it('clears all history without touching anything else', () => {
    const manager = new HistoryManager(
      collection([entry('a', 'https://example.com/a', 100)]),
    );
    const removed = manager.clearAll();
    expect(removed).toBe(1);
    expect(manager.isEmpty).toBe(true);
  });

  it('clears a site with conservative registrable-domain matching', () => {
    const manager = new HistoryManager(
      collection([
        entry('a', 'https://example.com/a', 100),
        entry('b', 'https://www.example.com/b', 200),
        entry('c', 'https://evil-example.com/c', 300),
        entry('d', 'https://example.com.evil.com/d', 400),
        entry('e', 'https://other.net/e', 500),
      ]),
    );
    const removed = manager.clearSite('example.com');
    expect(removed).toBe(2);
    expect(manager.entry('a')).toBeNull();
    expect(manager.entry('b')).toBeNull();
    expect(manager.entry('c')).not.toBeNull();
    expect(manager.entry('d')).not.toBeNull();
    expect(manager.entry('e')).not.toBeNull();
  });

  it('clears subdomains of a site but not the reverse', () => {
    const manager = new HistoryManager(
      collection([
        entry('a', 'https://blog.example.com/a', 100),
        entry('b', 'https://example.com/b', 200),
        entry('c', 'https://example.com.evil.com/c', 300),
      ]),
    );
    expect(manager.clearSite('example.com')).toBe(2);
    expect(manager.entry('c')).not.toBeNull();
  });
});

describe('HistoryManager search', () => {
  it('searches titles and URLs case-insensitively', () => {
    const manager = new HistoryManager(
      collection([
        entry('a', 'https://example.com/alpha', 100, 'Alpha Page'),
        entry('b', 'https://example.com/beta', 200, 'Beta'),
      ]),
    );
    expect(manager.search('alpha')).toHaveLength(1);
    expect(manager.search('ALPHA')).toHaveLength(1);
    expect(manager.search('example.com/b')).toHaveLength(1);
    expect(manager.search('')).toHaveLength(2);
    expect(manager.search('missing')).toHaveLength(0);
  });
});

describe('historyDateGroupFor', () => {
  it('groups by local calendar day', () => {
    const now = new Date('2026-01-15T10:00:00').getTime();
    expect(historyDateGroupFor(new Date('2026-01-15T08:00:00').getTime(), now)).toBe('today');
    expect(historyDateGroupFor(new Date('2026-01-14T23:00:00').getTime(), now)).toBe('yesterday');
    expect(historyDateGroupFor(new Date('2026-01-13T00:00:00').getTime(), now)).toBe('earlier-week');
    expect(historyDateGroupFor(new Date('2026-01-05T00:00:00').getTime(), now)).toBe('older');
  });

  it('treats future timestamps as today', () => {
    const now = new Date('2026-01-15T10:00:00').getTime();
    expect(historyDateGroupFor(new Date('2026-01-16T00:00:00').getTime(), now)).toBe('today');
  });
});

describe('HistoryManager snapshot', () => {
  it('returns a stable, sorted snapshot', () => {
    const manager = new HistoryManager(
      collection([
        entry('a', 'https://example.com/a', 100),
        entry('b', 'https://example.com/b', 900),
      ]),
    );
    const snap = manager.snapshot();
    expect(snap.entries.map((e) => e.id)).toEqual(['b', 'a']);
    // Mutating the snapshot must not affect the manager.
    (snap.entries as HistoryEntry[]).pop();
    expect(manager.size).toBe(2);
  });

  it('is empty when seeded with an empty collection', () => {
    expect(new HistoryManager(HistoryManager.empty()).isEmpty).toBe(true);
  });
});
