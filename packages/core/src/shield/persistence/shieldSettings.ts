/**
 * Shield settings persistence.
 *
 * Hosts persist a small, explicit set of user-controlled Shield settings
 * (global on/off, protection mode, per-site preferences, allowlist). Only
 * settings are persisted — never statistics, recent events, or any browsing
 * activity. The host supplies a filesystem location; this module stays pure
 * and host-agnostic so it can be reused (and unit-tested) anywhere.
 *
 * Parsing is defensive and fail-safe: structurally invalid files, unknown
 * values, or malformed entries are dropped and never crash the browser.
 * Nothing is trusted from disk; every value is re-validated.
 */

import { isValidHostname, normalizeHostname } from '../engine/hostname.js';
import type { ShieldMode } from '../types/mode.js';
import type { ShieldEngine } from '../shieldEngine.js';

/** An explicit per-site shield preference. */
export interface PersistedSiteSetting {
  readonly site: string;
  readonly enabled: boolean;
  readonly mode: ShieldMode;
}

/** The persisted Shield settings. */
export interface ShieldSettings {
  /** Whether the Shield is globally enabled. */
  readonly enabled: boolean;
  /** The global protection mode. */
  readonly mode: ShieldMode;
  /** Explicit per-site preferences (sites without one follow global state). */
  readonly siteSettings: readonly PersistedSiteSetting[];
  /** Allowlisted domains (validated hostnames only). */
  readonly allowlist: readonly string[];
}

/** Returns the default Shield settings (safe initial state). */
export function emptyShieldSettings(): ShieldSettings {
  return { enabled: true, mode: 'standard', siteSettings: [], allowlist: [] };
}

/** Whether a value is a valid {@link ShieldMode}. */
export function isShieldMode(value: unknown): value is ShieldMode {
  return value === 'standard' || value === 'strict' || value === 'custom';
}

/**
 * Parses and validates unknown data into {@link ShieldSettings}. Never throws.
 * Invalid roots yield defaults; invalid individual entries are dropped.
 */
export function parseShieldSettings(raw: unknown): ShieldSettings {
  if (typeof raw !== 'object' || raw === null) {
    return emptyShieldSettings();
  }
  const source = raw as Record<string, unknown>;

  const siteSettings: PersistedSiteSetting[] = [];
  if (Array.isArray(source.siteSettings)) {
    for (const item of source.siteSettings) {
      const parsed = parseSiteSetting(item);
      if (parsed !== null) {
        siteSettings.push(parsed);
      }
    }
  }

  const allowlist: string[] = [];
  if (Array.isArray(source.allowlist)) {
    for (const item of source.allowlist) {
      if (typeof item !== 'string') {
        continue;
      }
      const host = normalizeHostname(item);
      if (isValidHostname(host) && !allowlist.includes(host)) {
        allowlist.push(host);
      }
    }
  }

  return {
    enabled: typeof source.enabled === 'boolean' ? source.enabled : true,
    mode: isShieldMode(source.mode) ? source.mode : 'standard',
    siteSettings,
    allowlist,
  };
}

/**
 * Serializes settings to a JSON string. Values have already been validated,
 * so this is a plain projection.
 */
export function serializeShieldSettings(settings: ShieldSettings): string {
  return JSON.stringify(
    {
      enabled: settings.enabled,
      mode: settings.mode,
      siteSettings: settings.siteSettings,
      allowlist: settings.allowlist,
    },
    null,
    2,
  );
}

/**
 * Snapshots the current Shield settings out of an engine (the single source
 * of truth), ready for serialization.
 */
export function collectShieldSettings(engine: ShieldEngine): ShieldSettings {
  return {
    enabled: engine.enabled,
    mode: engine.mode,
    siteSettings: engine.siteSettingsSnapshot(),
    allowlist: [...engine.allowlist],
  };
}

/**
 * Applies persisted settings onto an engine. Applied before any request is
 * evaluated so filtering honors saved preferences from the very first request.
 */
export function applyShieldSettings(
  engine: ShieldEngine,
  settings: ShieldSettings,
): void {
  engine.setEnabled(settings.enabled);
  engine.setMode(settings.mode);
  for (const setting of settings.siteSettings) {
    engine.setSiteSetting(setting.site, {
      enabled: setting.enabled,
      mode: setting.mode,
    });
  }
  for (const domain of settings.allowlist) {
    engine.addAllowlist(domain);
  }
}

/** Parses and validates a single persisted per-site setting. */
function parseSiteSetting(raw: unknown): PersistedSiteSetting | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const source = raw as Record<string, unknown>;
  if (typeof source.site !== 'string') {
    return null;
  }
  const site = normalizeHostname(source.site);
  if (!isValidHostname(site)) {
    return null;
  }
  return {
    site,
    enabled: typeof source.enabled === 'boolean' ? source.enabled : true,
    mode: isShieldMode(source.mode) ? source.mode : 'standard',
  };
}