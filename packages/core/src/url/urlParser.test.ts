import { describe, expect, it } from 'vitest';
import {
  parseWebUrl,
  classifyAddressInput,
  hasScheme,
  webSchemeOf,
} from './urlParser.js';

describe('hasScheme', () => {
  it('detects explicit schemes', () => {
    expect(hasScheme('https://example.com')).toBe(true);
    expect(hasScheme('about:blank')).toBe(true);
    expect(hasScheme('http://x')).toBe(true);
  });

  it('rejects strings without a scheme', () => {
    expect(hasScheme('example.com')).toBe(false);
    expect(hasScheme('hello world')).toBe(false);
    expect(hasScheme('example')).toBe(false);
  });
});

describe('parseWebUrl', () => {
  it('accepts an https URL', () => {
    expect(parseWebUrl('https://example.com')).toBe('https://example.com/');
  });

  it('accepts an http URL', () => {
    expect(parseWebUrl('http://example.com/path')).toMatch(/^http:\/\//);
  });

  it('treats a bare domain as https', () => {
    expect(parseWebUrl('example.com')).toBe('https://example.com/');
  });

  it('rejects disallowed schemes', () => {
    expect(parseWebUrl('ftp://example.com')).toBeNull();
    expect(parseWebUrl('javascript:alert(1)')).toBeNull();
    expect(parseWebUrl('file:///etc/passwd')).toBeNull();
  });

  it('rejects malformed and non-domain input', () => {
    expect(parseWebUrl('')).toBeNull();
    expect(parseWebUrl('hello world')).toBeNull();
    expect(parseWebUrl('not a url')).toBeNull();
    expect(parseWebUrl('example')).toBeNull();
  });

  it('rejects a URL with no host', () => {
    expect(parseWebUrl('https://')).toBeNull();
    expect(parseWebUrl('http://')).toBeNull();
  });
});

describe('classifyAddressInput', () => {
  it('classifies a valid URL as url', () => {
    const r = classifyAddressInput('https://example.com');
    expect(r.kind).toBe('url');
    expect(r.url).toBe('https://example.com/');
    expect(r.query).toBeNull();
  });

  it('classifies a bare domain as url', () => {
    const r = classifyAddressInput('example.com');
    expect(r.kind).toBe('url');
    expect(r.url).toBe('https://example.com/');
  });

  it('classifies plain text as a search query', () => {
    const r = classifyAddressInput('how to bake bread');
    expect(r.kind).toBe('search');
    expect(r.url).toBeNull();
    expect(r.query).toBe('how to bake bread');
  });

  it('classifies empty input as empty search', () => {
    const r = classifyAddressInput('   ');
    expect(r.kind).toBe('search');
    expect(r.query).toBeNull();
  });
});

describe('webSchemeOf', () => {
  it('returns https for secure URLs', () => {
    expect(webSchemeOf('https://example.com')).toBe('https');
  });

  it('returns http for insecure URLs', () => {
    expect(webSchemeOf('http://example.com')).toBe('http');
  });

  it('returns null for non-web URLs', () => {
    expect(webSchemeOf('about:blank')).toBeNull();
    expect(webSchemeOf('garbage')).toBeNull();
  });
});
