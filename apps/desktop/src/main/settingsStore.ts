/**
 * ShieldSettingsStore: persists Shield settings to a JSON file.
 *
 * Only user-controlled Shield settings are stored (global on/off, protection
 * mode, per-site preferences, allowlist). Statistics, recent events, and any
 * browsing activity are never persisted. Writes are debounced and atomic
 * (temp file + rename) so a crash mid-write cannot corrupt the file, and
 * reads are fail-safe: corrupt or missing files fall back to defaults.
 *
 * The module deliberately avoids importing Electron so it is unit-testable;
 * the caller passes the file path (e.g. under `app.getPath('userData')`).
 */

import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  parseShieldSettings,
  serializeShieldSettings,
  type ShieldSettings,
} from '@shodasha/core';

/** Debounce for disk writes so rapid toggles collapse into one write. */
const SAVE_DEBOUNCE_MS = 300;

export class ShieldSettingsStore {
  private readonly filePath: string;
  private pending: ShieldSettings | null = null;
  private timer: NodeJS.Timeout | null = null;

  public constructor(filePath: string) {
    this.filePath = filePath;
  }

  /**
   * Loads and validates persisted settings. Missing or corrupt files yield
   * safe defaults. Never throws.
   */
  public load(): ShieldSettings {
    try {
      const raw = readFileSync(this.filePath, 'utf8');
      return parseShieldSettings(JSON.parse(raw));
    } catch {
      return parseShieldSettings(null);
    }
  }

  /**
   * Queues a settings save (debounced). Only the latest snapshot is written.
   */
  public scheduleSave(settings: ShieldSettings): void {
    this.pending = settings;
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.timer = null;
      this.flush();
    }, SAVE_DEBOUNCE_MS);
  }

  /** Immediately writes any pending settings (atomic temp-file + rename). */
  public flush(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const settings = this.pending;
    if (settings === null) {
      return;
    }
    this.pending = null;
    const json = serializeShieldSettings(settings);
    mkdirSync(dirname(this.filePath), { recursive: true });
    const tempPath = `${this.filePath}.tmp`;
    writeFileSync(tempPath, json, 'utf8');
    renameSync(tempPath, this.filePath);
  }
}