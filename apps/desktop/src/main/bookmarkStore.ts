/**
 * BookmarkStore: persists the bookmark collection to a JSON file.
 *
 * Bookmarks never leave the device. Writes are debounced and atomic (temp
 * file + rename) so a crash mid-write cannot corrupt the file, and reads are
 * fail-safe: missing or corrupt files fall back to an empty collection, never
 * throwing and never destroying valid data.
 *
 * The module deliberately avoids importing Electron so it is unit-testable;
 * the caller passes the file path (e.g. under `app.getPath('userData')`).
 */

import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  parseBookmarkCollection,
  serializeBookmarkCollection,
  type BookmarkCollection,
} from '@shodasha/core';

/** Debounce for disk writes so rapid edits collapse into one write. */
const SAVE_DEBOUNCE_MS = 300;

export class BookmarkStore {
  private readonly filePath: string;
  private pending: BookmarkCollection | null = null;
  private timer: NodeJS.Timeout | null = null;

  public constructor(filePath: string) {
    this.filePath = filePath;
  }

  /**
   * Loads and validates the persisted collection. Missing or corrupt files
   * yield an empty collection. Never throws.
   */
  public load(): BookmarkCollection {
    try {
      const raw = readFileSync(this.filePath, 'utf8');
      return parseBookmarkCollection(JSON.parse(raw));
    } catch {
      return parseBookmarkCollection(null);
    }
  }

  /** Queues a debounced save. Only the latest snapshot is written. */
  public scheduleSave(collection: BookmarkCollection): void {
    this.pending = collection;
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.timer = null;
      this.flush();
    }, SAVE_DEBOUNCE_MS);
  }

  /** Immediately writes any pending collection (atomic temp-file + rename). */
  public flush(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const collection = this.pending;
    if (collection === null) {
      return;
    }
    this.pending = null;
    const json = serializeBookmarkCollection(collection);
    mkdirSync(dirname(this.filePath), { recursive: true });
    const tempPath = `${this.filePath}.tmp`;
    writeFileSync(tempPath, json, 'utf8');
    renameSync(tempPath, this.filePath);
  }
}