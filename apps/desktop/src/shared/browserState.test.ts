import { describe, expect, it } from 'vitest';
import { isBlankTabUrl } from './browserState.js';

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
