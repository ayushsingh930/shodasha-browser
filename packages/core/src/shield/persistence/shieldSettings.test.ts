import { describe, expect, it } from 'vitest';
import { ShieldEngine } from '../shieldEngine.js';
import {
  applyShieldSettings,
  collectShieldSettings,
  emptyShieldSettings,
  isShieldMode,
  parseShieldSettings,
  serializeShieldSettings,
  type ShieldSettings,
} from './shieldSettings.js';

describe('isShieldMode', () => {
  it('accepts the three modes and rejects everything else', () => {
    expect(isShieldMode('standard')).toBe(true);
    expect(isShieldMode('strict')).toBe(true);
    expect(isShieldMode('custom')).toBe(true);
    expect(isShieldMode('aggressive')).toBe(false);
    expect(isShieldMode('')).toBe(false);
    expect(isShieldMode(1)).toBe(false);
    expect(isShieldMode(null)).toBe(false);
    expect(isShieldMode(undefined)).toBe(false);
  });
});

describe('parseShieldSettings', () => {
  it('returns defaults for non-object input (never throws)', () => {
    expect(parseShieldSettings(null)).toEqual(emptyShieldSettings());
    expect(parseShieldSettings(undefined)).toEqual(emptyShieldSettings());
    expect(parseShieldSettings('hello')).toEqual(emptyShieldSettings());
    expect(parseShieldSettings(42)).toEqual(emptyShieldSettings());
    expect(parseShieldSettings([])).toEqual(emptyShieldSettings());
  });

  it('round-trips a full valid settings object', () => {
    const settings: ShieldSettings = {
      enabled: false,
      mode: 'strict',
      siteSettings: [
        { site: 'example.com', enabled: false, mode: 'standard' },
        { site: 'www.test.org', enabled: true, mode: 'custom' },
      ],
      allowlist: ['trusted-site.com', 'mail.example.com'],
    };
    expect(parseShieldSettings(JSON.parse(serializeShieldSettings(settings)))).toEqual(
      settings,
    );
  });

  it('falls back to safe defaults for invalid top-level fields', () => {
    const parsed = parseShieldSettings({
      enabled: 'yes',
      mode: 'maximal',
      siteSettings: 'nope',
      allowlist: 5,
    });
    expect(parsed).toEqual(emptyShieldSettings());
  });

  it('drops malformed site settings and keeps valid ones', () => {
    const parsed = parseShieldSettings({
      enabled: true,
      mode: 'standard',
      siteSettings: [
        { site: 'example.com', enabled: false, mode: 'strict' },
        { site: 'https://evil-example.com', enabled: true, mode: 'standard' },
        { site: 'bad host', enabled: true, mode: 'standard' },
        { site: '', enabled: true, mode: 'standard' },
        { site: 'no-mode.test', enabled: true, mode: 'extreme' },
        'not-an-object',
      ],
      allowlist: [],
    });
    expect(parsed.siteSettings).toEqual([
      { site: 'example.com', enabled: false, mode: 'strict' },
      { site: 'no-mode.test', enabled: true, mode: 'standard' },
    ]);
  });

  it('normalizes and de-duplicates allowlist domains, dropping invalid ones', () => {
    const parsed = parseShieldSettings({
      enabled: true,
      mode: 'standard',
      siteSettings: [],
      allowlist: [
        'Example.COM',
        'example.com',
        'evil-example.com',
        'https://trusted-site.com',
        'bad host!',
        '',
        '..',
        123,
      ],
    });
    expect(parsed.allowlist).toEqual(['example.com', 'evil-example.com']);
  });
});

describe('collectShieldSettings', () => {
  it('snapshots the engine state', () => {
    const engine = new ShieldEngine();
    engine.setEnabled(false);
    engine.setMode('strict');
    engine.setSiteSetting('example.com', { enabled: false, mode: 'standard' });
    engine.addAllowlist('trusted-site.com');

    expect(collectShieldSettings(engine)).toEqual({
      enabled: false,
      mode: 'strict',
      siteSettings: [
        { site: 'example.com', enabled: false, mode: 'standard' },
      ],
      allowlist: ['trusted-site.com'],
    });
  });
});

describe('applyShieldSettings', () => {
  it('applies persisted settings onto a fresh engine', () => {
    const engine = new ShieldEngine();
    applyShieldSettings(engine, {
      enabled: false,
      mode: 'strict',
      siteSettings: [
        { site: 'example.com', enabled: false, mode: 'standard' },
      ],
      allowlist: ['trusted-site.com'],
    });

    expect(engine.enabled).toBe(false);
    expect(engine.mode).toBe('strict');
    expect(engine.isSiteEnabled('example.com')).toBe(false);
    expect(engine.getSiteSetting('example.com').mode).toBe('standard');
    expect(engine.isAllowlisted('www.trusted-site.com')).toBe(true);
  });

  it('ignores invalid allowlist values instead of throwing', () => {
    const engine = new ShieldEngine();
    applyShieldSettings(engine, {
      enabled: true,
      mode: 'standard',
      siteSettings: [],
      allowlist: ['https://bad.test'],
    });
    expect(engine.allowlist).toEqual([]);
  });

  it('is a no-op for empty settings', () => {
    const engine = new ShieldEngine();
    applyShieldSettings(engine, emptyShieldSettings());
    expect(engine.enabled).toBe(true);
    expect(engine.mode).toBe('standard');
  });
});