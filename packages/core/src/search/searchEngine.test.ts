import { describe, expect, it } from 'vitest';
import {
  buildSearchUrl,
  DEFAULT_SEARCH_ENGINE,
  isValidSearchTemplate,
} from './searchEngine.js';

describe('buildSearchUrl', () => {
  it('substitutes the query into the template', () => {
    const url = buildSearchUrl(DEFAULT_SEARCH_ENGINE, 'shodasha browser');
    expect(url).toBe('https://duckduckgo.com/?q=shodasha%20browser');
  });

  it('URL-encodes the query', () => {
    const url = buildSearchUrl(DEFAULT_SEARCH_ENGINE, 'a&b=c');
    expect(url).toContain(encodeURIComponent('a&b=c'));
  });
});

describe('isValidSearchTemplate', () => {
  it('accepts a valid https template', () => {
    expect(
      isValidSearchTemplate('https://duckduckgo.com/?q={query}'),
    ).toBe(true);
  });

  it('rejects templates without a placeholder', () => {
    expect(isValidSearchTemplate('https://example.com/?q=static')).toBe(false);
  });

  it('rejects templates that are not http(s)', () => {
    expect(isValidSearchTemplate('ftp://x/{query}')).toBe(false);
    expect(isValidSearchTemplate('garbage')).toBe(false);
  });
});
