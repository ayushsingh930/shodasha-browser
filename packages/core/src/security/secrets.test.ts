import { describe, expect, it } from 'vitest';
import {
  redact,
  redactSecrets,
  isConfiguredSecret,
  MAX_SECRET_LENGTH,
  loadBoundedSecret,
} from './secrets.js';

describe('redact', () => {
  it('returns a fixed placeholder', () => {
    expect(redact('anything')).toBe('[REDACTED]');
  });
});

describe('redactSecrets', () => {
  it('replaces secret values in a message', () => {
    const message = redactSecrets('token=abc123 and cookie=xyz', {
      token: 'abc123',
      cookie: 'xyz',
    });
    expect(message).toBe('token=[REDACTED] and cookie=[REDACTED]');
  });

  it('handles empty secret values safely', () => {
    expect(redactSecrets('plain text', { empty: '' })).toBe('plain text');
  });
});

describe('isConfiguredSecret', () => {
  it('rejects null, undefined, empty, and already-redacted values', () => {
    expect(isConfiguredSecret(null)).toBe(false);
    expect(isConfiguredSecret(undefined)).toBe(false);
    expect(isConfiguredSecret('')).toBe(false);
    expect(isConfiguredSecret('[REDACTED]')).toBe(false);
  });

  it('accepts a real secret', () => {
    expect(isConfiguredSecret('s3cr3t')).toBe(true);
  });
});

describe('loadBoundedSecret', () => {
  it('returns null when the variable is absent', () => {
    delete process.env.SHODASHA_TEST_NOPE;
    expect(loadBoundedSecret('SHODASHA_TEST_NOPE')).toBeNull();
  });

  it('reads a real value from the environment', () => {
    process.env.SHODASHA_TEST_OK = 'hello';
    expect(loadBoundedSecret('SHODASHA_TEST_OK')).toBe('hello');
  });

  it('rejects over-long values', () => {
    process.env.SHODASHA_TEST_LONG = 'x'.repeat(MAX_SECRET_LENGTH + 1);
    expect(loadBoundedSecret('SHODASHA_TEST_LONG')).toBeNull();
  });
});
