import { describe, expect, it } from 'vitest';
import {
  hostnameFromUrl,
  isValidHostname,
  normalizeHostname,
  originFromUrl,
  parentDomains,
  sameSite,
} from './hostname.js';

describe('normalizeHostname', () => {
  it('lowercases and trims', () => {
    expect(normalizeHostname('  Example.COM  ')).toBe('example.com');
  });

  it('strips a single trailing dot (DNS treats it as the same name)', () => {
    expect(normalizeHostname('example.com.')).toBe('example.com');
    expect(normalizeHostname('WWW.EXAMPLE.COM.')).toBe('www.example.com');
  });

  it('keeps a lone dot intact', () => {
    expect(normalizeHostname('.')).toBe('.');
  });
});

describe('isValidHostname', () => {
  it('accepts a plain domain', () => {
    expect(isValidHostname('example.com')).toBe(true);
  });

  it('accepts subdomains', () => {
    expect(isValidHostname('ads.example.com')).toBe(true);
  });

  it('accepts a single-label hostname', () => {
    expect(isValidHostname('localhost')).toBe(true);
  });

  it('accepts dotted IP addresses', () => {
    expect(isValidHostname('192.168.0.1')).toBe(true);
  });

  it('accepts uppercase hostnames', () => {
    expect(isValidHostname('EXAMPLE.COM')).toBe(true);
  });

  it('rejects a scheme', () => {
    expect(isValidHostname('https://example.com')).toBe(false);
  });

  it('rejects a port', () => {
    expect(isValidHostname('example.com:8080')).toBe(false);
  });

  it('rejects a path', () => {
    expect(isValidHostname('example.com/path')).toBe(false);
  });

  it('rejects a query string', () => {
    expect(isValidHostname('example.com?x=1')).toBe(false);
  });

  it('rejects a fragment', () => {
    expect(isValidHostname('example.com#frag')).toBe(false);
  });

  it('rejects wildcards', () => {
    expect(isValidHostname('*.example.com')).toBe(false);
    expect(isValidHostname('*')).toBe(false);
  });

  it('rejects whitespace', () => {
    expect(isValidHostname('example .com')).toBe(false);
  });

  it('rejects leading/trailing dots', () => {
    expect(isValidHostname('.example.com')).toBe(false);
    expect(isValidHostname('example.com.')).toBe(false);
  });

  it('rejects double dots and empty labels', () => {
    expect(isValidHostname('example..com')).toBe(false);
    expect(isValidHostname('example.com..')).toBe(false);
  });

  it('rejects hyphens at label boundaries', () => {
    expect(isValidHostname('-example.com')).toBe(false);
    expect(isValidHostname('example-.com')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidHostname('')).toBe(false);
  });

  it('rejects IPv6 literals in rule values (fail-open, never mis-matched)', () => {
    expect(isValidHostname('::1')).toBe(false);
    expect(isValidHostname('[::1]')).toBe(false);
    expect(isValidHostname('2001:db8::1')).toBe(false);
  });

  it('rejects IPv4 with a port', () => {
    expect(isValidHostname('127.0.0.1:8080')).toBe(false);
  });
});

describe('parentDomains', () => {
  it('yields the hostname and every parent domain, longest first', () => {
    expect(parentDomains('a.b.example.com')).toEqual([
      'a.b.example.com',
      'b.example.com',
      'example.com',
      'com',
    ]);
  });

  it('handles a single-label hostname', () => {
    expect(parentDomains('localhost')).toEqual(['localhost']);
  });
});

describe('hostnameFromUrl', () => {
  it('extracts a lowercase hostname', () => {
    expect(hostnameFromUrl('https://Example.COM/path?q=1#frag')).toBe('example.com');
  });

  it('strips the port', () => {
    expect(hostnameFromUrl('https://example.com:8443/a')).toBe('example.com');
  });

  it('strips userinfo', () => {
    expect(hostnameFromUrl('https://user:pass@example.com/')).toBe('example.com');
  });

  it('handles an IPv4 literal with a port', () => {
    expect(hostnameFromUrl('http://127.0.0.1:8080/x')).toBe('127.0.0.1');
  });

  it('handles an IPv6 literal hostname (never mis-parsed)', () => {
    expect(hostnameFromUrl('http://[::1]:8080/x')).toBe('[::1]');
  });

  it('handles localhost', () => {
    expect(hostnameFromUrl('http://localhost:3000/x')).toBe('localhost');
  });

  it('normalizes a trailing-dot hostname', () => {
    expect(hostnameFromUrl('https://example.com./x')).toBe('example.com');
  });

  it('returns null for an unparseable URL', () => {
    expect(hostnameFromUrl('not a url')).toBeNull();
    expect(hostnameFromUrl('example.com')).toBeNull();
  });

  it('returns null for a scheme without a host', () => {
    expect(hostnameFromUrl('about:blank')).toBeNull();
    expect(hostnameFromUrl('http://')).toBeNull();
    expect(hostnameFromUrl('https://')).toBeNull();
  });
});

describe('originFromUrl', () => {
  it('returns scheme://host without a port', () => {
    expect(originFromUrl('https://example.com:8443/a')).toBe('https://example.com');
  });

  it('returns null when unparseable', () => {
    expect(originFromUrl('junk')).toBeNull();
  });
});

describe('sameSite', () => {
  it('treats an exact hostname as same site', () => {
    expect(sameSite('example.com', 'example.com')).toBe(true);
  });

  it('treats subdomains as same site', () => {
    expect(sameSite('www.example.com', 'example.com')).toBe(true);
    expect(sameSite('a.b.example.com', 'example.com')).toBe(true);
  });

  it('does not treat unrelated hosts as same site', () => {
    expect(sameSite('example.net', 'example.com')).toBe(false);
    expect(sameSite('evil-example.com', 'example.com')).toBe(false);
    expect(sameSite('example.com.evil.com', 'example.com')).toBe(false);
  });
});
