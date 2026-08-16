/**
 * HistoryManager: the single source of truth for browsing history.
 *
 * Hosts hold exactly one HistoryManager and drive the UI from its snapshots.
 * Visits are validated, de-duplicated (a reload of the same page must not
 * spam the list), retained within a hard limit (oldest entries are evicted
 * first), and only ever stored locally. Clearing never touches bookmarks,
 * downloads, cookies, or settings.
 *
 * The manager is also ready for a future private-tab feature: recording can
 * be skipped per visit via a `private` flag, without building incognito
 * browsing itself.
 */

import {
  createHistoryId,
  historyKeyForUrl,
  hostnameFromHistoryUrl,
  isValidHistoryFavicon,
  isValidHistoryUrl,
  searchHistory,
  MAX_HISTORY_TITLE_LENGTH,
  type HistoryCollection,
  type HistoryEntry,
} from './historyModel.js';
import { emptyHistoryCollection } from './historyPersistence.js';
import { sameSite } from '../shield/engine/hostname.js';

/** The maximum number of entries retained; oldest entries are evicted first. */
export const MAX_HISTORY_ENTRIES = 10_000;

/**
 * Two visits to the same URL within this window are treated as one visit
 * (e.g. a reload). A genuine later visit — minutes or hours afterwards — is
 * recorded as its own entry.
 */
export const DUPLICATE_WINDOW_MS = 5_000;

/** Input for recording a visit. */
export interface RecordVisitInput {
  readonly url: string;
  /** The page title, if known (may be empty). */
  readonly title: string;
  /** An optional favicon URL captured safely from the page. */
  readonly favicon?: string | null;
}

/** Options for recording a visit. */
export interface RecordVisitOptions {
  /**
   * When `true`, the visit belongs to a private tab and must not be recorded.
   * SHODASHA does not implement private browsing yet; the flag is the seam a
   * future private-tab feature will use.
   */
  readonly private?: boolean;
}

/** The result of trying to record a visit. */
export type RecordVisitResult =
  | { readonly ok: true; readonly entry: HistoryEntry; readonly updated: boolean }
  | { readonly ok: false; readonly reason: 'invalid-url' | 'private' };

export class HistoryManager {
  /** Entries, newest first. */
  private entries: HistoryEntry[] = [];

  /** Creates a manager, optionally seeded from a persisted collection. */
  public constructor(initial?: HistoryCollection) {
    if (initial !== undefined) {
      this.entries = [...initial.entries].sort(
        (a, b) => b.visitedAt - a.visitedAt,
      );
      this.enforceLimit();
    }
  }

  /** A copy of the full collection (safe to hand to the UI). */
  public snapshot(): HistoryCollection {
    return { version: 1, entries: [...this.entries] };
  }

  /** All entries, newest first (copies). */
  public get list(): readonly HistoryEntry[] {
    return [...this.entries];
  }

  /** Number of stored entries. */
  public get size(): number {
    return this.entries.length;
  }

  /** Whether any history exists. */
  public get isEmpty(): boolean {
    return this.entries.length === 0;
  }

  /** Finds an entry by id, or null. */
  public entry(id: string): HistoryEntry | null {
    return this.entries.find((entry) => entry.id === id) ?? null;
  }

  /**
   * Records a visit to a web page. Reloads of the current page are folded
   * into the latest entry (refreshing its timestamp and metadata) instead of
   * spamming the list; a genuine later visit becomes a new entry.
   */
  public recordVisit(
    input: RecordVisitInput,
    options: RecordVisitOptions = {},
  ): RecordVisitResult {
    if (options.private === true) {
      return { ok: false, reason: 'private' };
    }
    if (!isValidHistoryUrl(input.url)) {
      return { ok: false, reason: 'invalid-url' };
    }
    const now = Date.now();
    const url = input.url.trim();
    const title = input.title.trim().slice(0, MAX_HISTORY_TITLE_LENGTH);
    const favicon = isValidHistoryFavicon(input.favicon) ? input.favicon : null;

    const key = historyKeyForUrl(url);
    const newest = this.entries[0];
    if (
      newest !== undefined &&
      historyKeyForUrl(newest.url) === key &&
      now - newest.visitedAt <= DUPLICATE_WINDOW_MS
    ) {
      const updated: HistoryEntry = {
        ...newest,
        url,
        title,
        favicon,
        visitedAt: now,
      };
      this.entries[0] = updated;
      return { ok: true, entry: updated, updated: true };
    }

    const entry: HistoryEntry = {
      id: createHistoryId(),
      url,
      title,
      favicon,
      visitedAt: now,
    };
    this.entries.unshift(entry);
    this.enforceLimit();
    return { ok: true, entry, updated: false };
  }

  /** Updates the title of an entry. No-op when the entry is gone. */
  public updateEntryTitle(id: string, title: string): void {
    const index = this.entries.findIndex((entry) => entry.id === id);
    const existing = this.entries[index];
    if (index < 0 || existing === undefined) {
      return;
    }
    const clean = title.trim().slice(0, MAX_HISTORY_TITLE_LENGTH);
    this.entries[index] = { ...existing, title: clean };
  }

  /** Updates the favicon of an entry. No-op when the entry is gone. */
  public updateEntryFavicon(id: string, favicon: string | null): void {
    const index = this.entries.findIndex((entry) => entry.id === id);
    const existing = this.entries[index];
    if (index < 0 || existing === undefined) {
      return;
    }
    const clean = isValidHistoryFavicon(favicon) ? favicon : null;
    this.entries[index] = { ...existing, favicon: clean };
  }

  /** Removes a single entry. Returns whether one was removed. */
  public deleteEntry(id: string): boolean {
    const before = this.entries.length;
    this.entries = this.entries.filter((entry) => entry.id !== id);
    return this.entries.length !== before;
  }

  /**
   * Removes every entry whose visit time falls within `[from, to]` (inclusive).
   * Returns the number of removed entries. Never touches bookmarks, downloads,
   * cookies, or settings.
   */
  public clearRange(from: number, to: number): number {
    const lower = Math.min(from, to);
    const upper = Math.max(from, to);
    const before = this.entries.length;
    this.entries = this.entries.filter(
      (entry) => entry.visitedAt < lower || entry.visitedAt > upper,
    );
    return before - this.entries.length;
  }

  /**
   * Removes every entry whose hostname belongs to the given site or one of its
   * subdomains. The registrable-domain match is conservative: `evil-example.com`
   * is never treated as `example.com`. Returns the number of removed entries.
   */
  public clearSite(site: string): number {
    const before = this.entries.length;
    this.entries = this.entries.filter((entry) => {
      const hostname = hostnameFromHistoryUrl(entry.url);
      return hostname === null || !sameSite(hostname, site);
    });
    return before - this.entries.length;
  }

  /** Removes all history. Returns the number of removed entries. */
  public clearAll(): number {
    const removed = this.entries.length;
    this.entries = [];
    return removed;
  }

  /** Case-insensitive local search across title and URL. */
  public search(query: string): HistoryEntry[] {
    return searchHistory(this.entries, query);
  }

  /** An empty collection to seed a fresh store. */
  public static empty(): HistoryCollection {
    return emptyHistoryCollection();
  }

  /** Keeps the collection within MAX_HISTORY_ENTRIES, evicting the oldest. */
  private enforceLimit(): void {
    if (this.entries.length > MAX_HISTORY_ENTRIES) {
      this.entries = this.entries.slice(0, MAX_HISTORY_ENTRIES);
    }
  }
}
