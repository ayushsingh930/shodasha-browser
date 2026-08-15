import { describe, expect, it } from 'vitest';
import {
  classifyLoadError,
  invalidAddressError,
  blockedNavigationError,
} from './errorPages.js';

describe('classifyLoadError', () => {
  it('maps name-resolution failures to connection-failed', () => {
    expect(classifyLoadError(-105).kind).toBe('connection-failed');
    expect(classifyLoadError(-105).title).toBe('Connection failed.');
  });

  it('maps aborted loads to a stopped message', () => {
    expect(classifyLoadError(-3).kind).toBe('load-failed');
    expect(classifyLoadError(-3).title).toBe('Loading stopped.');
  });

  it('falls back to a generic message for unknown codes', () => {
    const err = classifyLoadError(-999);
    expect(err.kind).toBe('load-failed');
    expect(err.title).toBe('Unable to load this page.');
  });

  it('never exposes raw error codes or stack traces', () => {
    const err = classifyLoadError(-105);
    expect(err.message).not.toContain('-105');
    expect(err.message).not.toMatch(/\d{3}/);
  });
});

describe('invalidAddressError', () => {
  it('returns an invalid-address error', () => {
    const err = invalidAddressError();
    expect(err.kind).toBe('invalid-address');
    expect(err.title).toBe('Invalid address.');
  });
});

describe('blockedNavigationError', () => {
  it('returns a blocked error with the reason', () => {
    const err = blockedNavigationError('Blocked by policy.');
    expect(err.kind).toBe('blocked');
    expect(err.message).toBe('Blocked by policy.');
  });
});
