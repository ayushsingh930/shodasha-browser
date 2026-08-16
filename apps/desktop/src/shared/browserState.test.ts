import { describe, expect, it } from 'vitest';
import type { Bookmark } from '@shodasha/core';
import {
  BOOKMARKS_URL,
  PRIVACY_CENTER_URL,
  internalPageInfoFor,
  isBlankTabUrl,
  isInternalPageUrl,
  protectionStatusFor,
  searchBookmarks,
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

  it('is case- and whitespace-insensitive', () => {
    expect(internalPageInfoFor(' SHODASHA://BOOKMARKS ')?.kind).toBe('bookmarks');
  });

  it('returns null for non-internal URLs', () => {
    expect(internalPageInfoFor('https://example.com')).toBeNull();
    expect(internalPageInfoFor('')).toBeNull();
    expect(internalPageInfoFor('shodasha://history')).toBeNull();
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
