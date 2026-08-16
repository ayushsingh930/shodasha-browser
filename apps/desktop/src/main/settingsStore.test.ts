/**
 * Tests for the Shield settings store.
 *
 * The store is pure (no Electron import): it reads and writes a JSON file at
 * a caller-provided path. These tests use a temporary directory and exercise
 * defaults, round-trips, atomic writes, and corrupt-file fail-safety.
 */

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ShieldSettingsStore } from './settingsStore.js';

function tempStore(): { store: ShieldSettingsStore; file: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), 'shodasha-settings-'));
  const file = join(dir, 'shield-settings.json');
  return {
    store: new ShieldSettingsStore(file),
    file,
    cleanup: () => {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

describe('ShieldSettingsStore', () => {
  it('returns safe defaults when no file exists', () => {
    const { store, cleanup } = tempStore();
    const settings = store.load();
    expect(settings).toEqual({
      enabled: true,
      mode: 'standard',
      siteSettings: [],
      allowlist: [],
    });
    cleanup();
  });

  it('returns safe defaults for corrupt JSON (never throws)', () => {
    const { store, file, cleanup } = tempStore();
    writeFileSync(file, '{ not valid json', 'utf8');
    expect(store.load()).toEqual({
      enabled: true,
      mode: 'standard',
      siteSettings: [],
      allowlist: [],
    });
    cleanup();
  });

  it('round-trips settings through flush + load', () => {
    const { store, file, cleanup } = tempStore();
    store.scheduleSave({
      enabled: false,
      mode: 'strict',
      siteSettings: [{ site: 'example.com', enabled: false, mode: 'standard' }],
      allowlist: ['trusted-site.com'],
    });
    store.flush();

    const loaded = store.load();
    expect(loaded).toEqual({
      enabled: false,
      mode: 'strict',
      siteSettings: [{ site: 'example.com', enabled: false, mode: 'standard' }],
      allowlist: ['trusted-site.com'],
    });

    const onDisk = JSON.parse(readFileSync(file, 'utf8')) as {
      enabled: unknown;
      mode: unknown;
    };
    expect(onDisk.enabled).toBe(false);
    expect(onDisk.mode).toBe('strict');
    cleanup();
  });

  it('flushing without pending settings writes nothing', () => {
    const { store, file, cleanup } = tempStore();
    store.flush();
    expect(() => readFileSync(file, 'utf8')).toThrow();
    cleanup();
  });

  it('keeps only the latest pending snapshot across debounce', () => {
    const { store, cleanup } = tempStore();
    store.scheduleSave({ enabled: true, mode: 'standard', siteSettings: [], allowlist: [] });
    store.scheduleSave({ enabled: false, mode: 'custom', siteSettings: [], allowlist: [] });
    store.flush();
    const loaded = store.load();
    expect(loaded.enabled).toBe(false);
    expect(loaded.mode).toBe('custom');
    cleanup();
  });

  it('drops invalid values written to disk on load', () => {
    const { store, file, cleanup } = tempStore();
    writeFileSync(
      file,
      JSON.stringify({
        enabled: 'yes',
        mode: 'maximal',
        siteSettings: [{ site: 'https://bad.test', enabled: true }],
        allowlist: ['valid-site.com', 'bad host!'],
      }),
      'utf8',
    );
    const loaded = store.load();
    expect(loaded.enabled).toBe(true);
    expect(loaded.mode).toBe('standard');
    expect(loaded.siteSettings).toEqual([]);
    expect(loaded.allowlist).toEqual(['valid-site.com']);
    cleanup();
  });
});