import { describe, expect, it } from 'vitest';
import { classifyParty } from './party.js';

function request(hostname: string, firstPartyOrigin: string | null) {
  return { hostname, firstPartyOrigin };
}

describe('classifyParty', () => {
  it('classifies an exact same-host request as first-party', () => {
    expect(classifyParty(request('example.com', 'https://example.com'))).toBe(
      'first-party',
    );
  });

  it('classifies a subdomain request as first-party', () => {
    expect(classifyParty(request('cdn.example.com', 'https://example.com'))).toBe(
      'first-party',
    );
  });

  it('classifies a different-site request as third-party', () => {
    expect(classifyParty(request('doubleclick.net', 'https://example.com'))).toBe(
      'third-party',
    );
  });

  it('classifies a suffix-impostor hostname as third-party', () => {
    expect(classifyParty(request('example.com.evil.com', 'https://example.com'))).toBe(
      'third-party',
    );
  });

  it('classifies an unknown first-party as unknown-party (never guesses)', () => {
    expect(classifyParty(request('cdn.example.com', null))).toBe('unknown-party');
    expect(classifyParty(request('cdn.example.com', ''))).toBe('unknown-party');
    expect(classifyParty(request('cdn.example.com', 'not-a-url'))).toBe(
      'unknown-party',
    );
  });

  it('is case-insensitive', () => {
    expect(classifyParty(request('Example.COM', 'https://example.com'))).toBe(
      'first-party',
    );
  });

  it('treats a port-carrying first-party origin correctly', () => {
    expect(classifyParty(request('example.com', 'https://example.com:8443'))).toBe(
      'first-party',
    );
  });
});
