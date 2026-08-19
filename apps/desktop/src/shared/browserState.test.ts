import { describe, expect, it } from 'vitest';
import type { Bookmark, DownloadItem, HistoryEntry } from '@shodasha/core';
import {
  BOOKMARKS_URL,
  DOWNLOADS_URL,
  HISTORY_URL,
  PRIVACY_CENTER_URL,
  bookmarkForUrl,
  downloadSourceFor,
  downloadStateView,
  formatDownloadBytes,
  groupHistoryByDate,
  historyDateGroupFor,
  internalPageInfoFor,
  isBlankTabUrl,
  isInternalPageUrl,
  protectionStatusFor,
  searchBookmarks,
  searchDownloads,
  searchHistory,
  sortBookmarks,
  type ShieldPanelState,
} from './browserState.js';

describe('isBlankTabUrl', () => {
  it('treats empty and about:blank as blank', () => {
    expect(isBlankTabUrl('')).toBe(true);
    expect(isBlankTabUrl('about:blank')).toBe(true);
    expect(isBlankTabUrl('about:blank#top')).toBe(true);
  });

  it('treats real addresses as non-blank', () => {
    expect(isBlankTabUrl('https://example.com')).toBe(false);
    expect(isBlankTabUrl('http://localhost')).toBe(false);
    expect(isBlankTabUrl('data:text/html,hello')).toBe(false);
    expect(isBlankTabUrl('about:config')).toBe(false);
  });
});

describe('isInternalPageUrl', () => {
  it('recognizes the Privacy Center URL', () => {
    expect(isInternalPageUrl(PRIVACY_CENTER_URL)).toBe(true);
    expect(isInternalPageUrl('SHODASHA://PRIVACY')).toBe(true);
    expect(isInternalPageUrl(` ${PRIVACY_CENTER_URL} `)).toBe(true);
  });

  it('recognizes the Bookmark Manager URL', () => {
    expect(isInternalPageUrl(BOOKMARKS_URL)).toBe(true);
    expect(isInternalPageUrl('SHODASHA://BOOKMARKS')).toBe(true);
    expect(isInternalPageUrl(` ${BOOKMARKS_URL} `)).toBe(true);
  });

  it('recognizes the History Manager URL', () => {
    expect(isInternalPageUrl(HISTORY_URL)).toBe(true);
    expect(isInternalPageUrl('SHODASHA://HISTORY')).toBe(true);
    expect(isInternalPageUrl(` ${HISTORY_URL} `)).toBe(true);
  });

  it('rejects web URLs and other shodasha URLs', () => {
    expect(isInternalPageUrl('https://example.com')).toBe(false);
    expect(isInternalPageUrl('shodasha://other')).toBe(false);
    expect(isInternalPageUrl('shodasha://privacy/extra')).toBe(false);
    expect(isInternalPageUrl('')).toBe(false);
    expect(isInternalPageUrl('about:blank')).toBe(false);
  });
});

describe('internalPageInfoFor', () => {
  it('describes the Privacy Center', () => {
    expect(internalPageInfoFor(PRIVACY_CENTER_URL)).toEqual({
      url: 'shodasha://privacy',
      kind: 'privacy',
      title: 'Privacy Center',
    });
  });

  it('describes the Bookmark Manager', () => {
    expect(internalPageInfoFor(BOOKMARKS_URL)).toEqual({
      url: 'shodasha://bookmarks',
      kind: 'bookmarks',
      title: 'Bookmarks',
    });
  });

  it('describes the History Manager', () => {
    expect(internalPageInfoFor(HISTORY_URL)).toEqual({
      url: 'shodasha://history',
      kind: 'history',
      title: 'History',
    });
  });

  it('describes the Downloads Manager', () => {
    expect(internalPageInfoFor(DOWNLOADS_URL)).toEqual({
      url: 'shodasha://downloads',
      kind: 'downloads',
      title: 'Downloads',
    });
  });

  it('is case- and whitespace-insensitive', () => {
    expect(internalPageInfoFor(' SHODASHA://BOOKMARKS ')?.kind).toBe('bookmarks');
    expect(internalPageInfoFor(' SHODASHA://HISTORY ')?.kind).toBe('history');
    expect(internalPageInfoFor(' SHODASHA://DOWNLOADS ')?.kind).toBe('downloads');
  });

  it('returns null for non-internal URLs', () => {
    expect(internalPageInfoFor('https://example.com')).toBeNull();
    expect(internalPageInfoFor('')).toBeNull();
    expect(internalPageInfoFor('shodasha://other')).toBeNull();
  });
});

describe('protectionStatusFor', () => {
  function panel(overrides: Partial<ShieldPanelState>): ShieldPanelState {
    return {
      enabled: true,
      mode: 'standard',
      stats: {
        requestsEvaluated: 0,
        requestsBlocked: 0,
        requestsAllowed: 0,
        trackersBlocked: 0,
        adsFiltered: 0,
      },
      currentSite: 'example.com',
      siteEnabled: true,
      siteMode: 'standard',
      siteAllowlisted: false,
      siteStats: null,
      recentEvents: [],
      ...overrides,
    };
  }

  it('reports off when the Shield is disabled', () => {
    const view = protectionStatusFor(panel({ enabled: false }));
    expect(view.status).toBe('off');
    expect(view.label).toContain('off');
  });

  it('reports protected with no active site', () => {
    const view = protectionStatusFor(panel({ currentSite: null }));
    expect(view.status).toBe('protected');
  });

  it('reports limited when the Shield is off for the current site', () => {
    const view = protectionStatusFor(panel({ siteEnabled: false }));
    expect(view.status).toBe('limited');
  });

  it('reports protected when everything is on', () => {
    const view = protectionStatusFor(panel({}));
    expect(view.status).toBe('protected');
  });

  it('never claims absolute privacy', () => {
    const view = protectionStatusFor(panel({}));
    expect(view.note.toLowerCase()).not.toContain('100%');
    expect(view.note.toLowerCase()).not.toContain('guarantee');
  });
});

describe('searchBookmarks', () => {
  function bookmark(title: string, url: string): Bookmark {
    return {
      id: `bm-${title}`,
      title,
      url,
      createdAt: 1,
      updatedAt: 1,
      folderId: null,
      favicon: null,
    };
  }

  const list = [
    bookmark('GitHub', 'https://github.com'),
    bookmark('Docs', 'https://docs.example.com'),
    bookmark('API Reference', 'https://api.example.com'),
  ];

  it('returns every bookmark for an empty query', () => {
    expect(searchBookmarks(list, '').length).toBe(3);
    expect(searchBookmarks(list, '   ').length).toBe(3);
  });

  it('filters by title case-insensitively', () => {
    const results = searchBookmarks(list, 'docs');
    expect(results.map((b) => b.title)).toEqual(['Docs']);
  });

  it('filters by URL case-insensitively', () => {
    const results = searchBookmarks(list, 'GITHUB.COM');
    expect(results.map((b) => b.title)).toEqual(['GitHub']);
  });

  it('matches partial words', () => {
    const results = searchBookmarks(list, 'api');
    expect(results.map((b) => b.title)).toEqual(['API Reference']);
  });

  it('returns an empty array when nothing matches', () => {
    expect(searchBookmarks(list, 'zzz').length).toBe(0);
  });

  it('does not mutate the input list', () => {
    const snapshot = list.map((b) => b.title);
    searchBookmarks(list, 'github');
    expect(list.map((b) => b.title)).toEqual(snapshot);
  });
});

describe('sortBookmarks', () => {
  function bookmark(title: string, createdAt: number): Bookmark {
    return {
      id: `bm-${title}`,
      title,
      url: 'https://example.com',
      createdAt,
      updatedAt: createdAt,
      folderId: null,
      favicon: null,
    };
  }

  const list = [
    bookmark('Zebra', 30),
    bookmark('apple', 10),
    bookmark('Mango', 20),
  ];

  it('sorts by name ascending, case-insensitive', () => {
    expect(sortBookmarks(list, 'name-asc').map((b) => b.title)).toEqual([
      'apple',
      'Mango',
      'Zebra',
    ]);
  });

  it('sorts by name descending, case-insensitive', () => {
    expect(sortBookmarks(list, 'name-desc').map((b) => b.title)).toEqual([
      'Zebra',
      'Mango',
      'apple',
    ]);
  });

  it('sorts by recency (newest first)', () => {
    expect(sortBookmarks(list, 'recent').map((b) => b.title)).toEqual([
      'Zebra',
      'Mango',
      'apple',
    ]);
  });

  it('does not mutate the input list', () => {
    const snapshot = list.map((b) => b.title);
    sortBookmarks(list, 'name-asc');
    expect(list.map((b) => b.title)).toEqual(snapshot);
  });
});

describe('searchHistory', () => {
  function entry(id: string, url: string, title: string): HistoryEntry {
    return { id, url, title, visitedAt: id.length, favicon: null };
  }

  const list = [
    entry('a', 'https://github.com', 'GitHub'),
    entry('b', 'https://docs.example.com', 'Docs'),
    entry('c', 'https://example.com/search?q=shodasha', ''),
  ];

  it('returns every entry for an empty query', () => {
    expect(searchHistory(list, '').length).toBe(3);
    expect(searchHistory(list, '   ').length).toBe(3);
  });

  it('filters by title case-insensitively', () => {
    expect(searchHistory(list, 'docs').map((e) => e.id)).toEqual(['b']);
  });

  it('filters by URL case-insensitively', () => {
    expect(searchHistory(list, 'GITHUB.COM').map((e) => e.id)).toEqual(['a']);
  });

  it('matches a query parameter in a URL', () => {
    expect(searchHistory(list, 'shodasha').map((e) => e.id)).toEqual(['c']);
  });

  it('does not mutate the input list', () => {
    const snapshot = list.map((e) => e.id);
    searchHistory(list, 'github');
    expect(list.map((e) => e.id)).toEqual(snapshot);
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
});

describe('groupHistoryByDate', () => {
  function entry(id: string, url: string, visitedAt: number): HistoryEntry {
    return { id, url, title: '', visitedAt, favicon: null };
  }

  it('produces date groups in display order', () => {
    const now = new Date('2026-01-15T10:00:00').getTime();
    const groups = groupHistoryByDate(
      [
        entry('old', 'https://example.com/old', new Date('2026-01-05').getTime()),
        entry('today', 'https://example.com/today', new Date('2026-01-15T08:00:00').getTime()),
        entry('yesterday', 'https://example.com/y', new Date('2026-01-14').getTime()),
      ],
      now,
    );
    expect(groups.map((g) => g.key)).toEqual(['today', 'yesterday', 'older']);
    expect(groups[0]?.entries.map((e) => e.id)).toEqual(['today']);
    expect(groups[2]?.entries.map((e) => e.id)).toEqual(['old']);
  });

  it('returns an empty array for no entries', () => {
    expect(groupHistoryByDate([], Date.now())).toEqual([]);
  });
});

describe('bookmarkForUrl', () => {
  function bookmark(id: string, url: string): Bookmark {
    return {
      id,
      title: 'T',
      url,
      createdAt: 1,
      updatedAt: 1,
      folderId: null,
      favicon: null,
    };
  }

  const bookmarks = [
    bookmark('a', 'https://example.com'),
    bookmark('b', 'https://example.com/path'),
    bookmark('c', 'https://evil-example.com'),
  ];

  it('matches the same resource regardless of trailing slash', () => {
    expect(bookmarkForUrl(bookmarks, 'https://example.com')?.id).toBe('a');
    expect(bookmarkForUrl(bookmarks, 'https://example.com/')?.id).toBe('a');
    expect(bookmarkForUrl(bookmarks, 'https://example.com/path/')?.id).toBe('b');
  });

  it('does not confuse distinct hosts', () => {
    expect(bookmarkForUrl(bookmarks, 'https://evil-example.com')?.id).toBe('c');
    expect(bookmarkForUrl(bookmarks, 'https://example.com.evil.com')).toBeNull();
  });

  it('returns null when there is no match', () => {
    expect(bookmarkForUrl(bookmarks, 'https://example.net')).toBeNull();
    expect(bookmarkForUrl(bookmarks, '')).toBeNull();
  });
});

function downloadItem(overrides: Partial<DownloadItem>): DownloadItem {
  return {
    id: 'dl_1',
    url: 'https://example.com/file.pdf',
    filename: 'file.pdf',
    savePath: 'C:/downloads/file.pdf',
    state: 'completed',
    receivedBytes: 100,
    totalBytes: 100,
    startedAt: 1,
    completedAt: 2,
    error: null,
    mimeType: 'application/pdf',
    executable: false,
    ...overrides,
  };
}

describe('searchDownloads', () => {
  const items = [
    downloadItem({ filename: 'manual.pdf', url: 'https://example.com/manual.pdf' }),
    downloadItem({ filename: 'photo.jpg', url: 'https://photos.example.net/x.jpg' }),
  ];

  it('returns everything for an empty query', () => {
    expect(searchDownloads(items, '')).toHaveLength(2);
    expect(searchDownloads(items, '  ')).toHaveLength(2);
  });

  it('matches filenames case-insensitively', () => {
    expect(searchDownloads(items, 'MANUAL')).toHaveLength(1);
  });

  it('matches source URLs', () => {
    expect(searchDownloads(items, 'photos.example')).toHaveLength(1);
  });
});

describe('downloadSourceFor', () => {
  it('extracts the hostname from a download URL', () => {
    expect(downloadSourceFor(downloadItem({}))).toBe('example.com');
  });

  it('returns null for unparsable URLs', () => {
    expect(downloadSourceFor(downloadItem({ url: 'not a url' }))).toBeNull();
  });
});

describe('formatDownloadBytes', () => {
  it('formats compactly with trailing zeros stripped', () => {
    expect(formatDownloadBytes(0)).toBe('0 B');
    expect(formatDownloadBytes(512)).toBe('512 B');
    expect(formatDownloadBytes(2048)).toBe('2 KB');
    expect(formatDownloadBytes(1_048_576)).toBe('1 MB');
    expect(formatDownloadBytes(1073741824)).toBe('1 GB');
  });

  it('handles invalid input defensively', () => {
    expect(formatDownloadBytes(Number.NaN)).toBe('0 B');
    expect(formatDownloadBytes(-5)).toBe('0 B');
  });
});

describe('downloadStateView', () => {
  it('maps every state to a label and class', () => {
    expect(downloadStateView('pending').label).toBe('Pending');
    expect(downloadStateView('progressing').label).toBe('Downloading');
    expect(downloadStateView('paused').label).toBe('Paused');
    expect(downloadStateView('completed').label).toBe('Completed');
    expect(downloadStateView('cancelled').label).toBe('Cancelled');
    expect(downloadStateView('failed').label).toBe('Failed');
  });
});
