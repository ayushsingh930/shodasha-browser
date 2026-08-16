import { describe, expect, it } from 'vitest';
import {
  PRIVACY_CENTER_URL,
  isBlankTabUrl,
  isInternalPageUrl,
  protectionStatusFor,
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

  it('rejects web URLs and other shodasha URLs', () => {
    expect(isInternalPageUrl('https://example.com')).toBe(false);
    expect(isInternalPageUrl('shodasha://other')).toBe(false);
    expect(isInternalPageUrl('shodasha://privacy/extra')).toBe(false);
    expect(isInternalPageUrl('')).toBe(false);
    expect(isInternalPageUrl('about:blank')).toBe(false);
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
