/**
 * DownloadManager: the single source of truth for download records.
 *
 * Hosts hold exactly one DownloadManager and drive the UI from its snapshots.
 * The host reports lifecycle transitions (progress, completion, cancellation,
 * failure) through a narrow, validated API; the manager enforces a strict
 * state machine so a terminal download can never silently revert to an active
 * one. Records are retained within a hard limit (oldest finished records are
 * trimmed first) and never leave the device.
 *
 * The manager never touches the filesystem: the host owns the actual file
 * writes, the save directory, and path construction. This keeps the core
 * host-agnostic and means a downloaded file can never become an execution
 * vector through this module.
 */

import {
  ACTIVE_DOWNLOAD_STATES,
  TERMINAL_DOWNLOAD_STATES,
  createDownloadId,
  isExecutableFilename,
  isValidDownloadUrl,
  sanitizeFilename,
  type DownloadCollection,
  type DownloadItem,
  type DownloadState,
} from './downloadModel.js';
import { emptyDownloadCollection } from './downloadPersistence.js';

/** The maximum number of records retained; oldest finished ones are trimmed. */
export const MAX_DOWNLOAD_RECORDS = 500;

/** Input for registering a new download. */
export interface AddDownloadInput {
  /** The source URL of the download. */
  readonly url: string;
  /** A suggested filename (sanitized here before storage). */
  readonly filename: string;
  /** The absolute save path chosen by the host (already uniquified). */
  readonly savePath: string;
  /** Total bytes when known, or 0 for unknown-length downloads. */
  readonly totalBytes?: number;
  /** The reported mime type, or null. */
  readonly mimeType?: string | null;
}

/** The result of trying to register a download. */
export type AddDownloadResult =
  | { readonly ok: true; readonly item: DownloadItem }
  | { readonly ok: false; readonly reason: 'invalid-url' };

export class DownloadManager {
  /** Records, newest first. */
  private items: DownloadItem[] = [];

  /** Creates a manager, optionally seeded from a persisted collection. */
  public constructor(initial?: DownloadCollection) {
    if (initial !== undefined) {
      this.items = [...initial.items].sort(
        (a, b) => b.startedAt - a.startedAt,
      );
      this.enforceLimit();
    }
  }

  /** A copy of the full collection (safe to hand to the UI). */
  public snapshot(): DownloadCollection {
    return { version: 1, items: [...this.items] };
  }

  /** All records, newest first (copies). */
  public get list(): readonly DownloadItem[] {
    return [...this.items];
  }

  /** Number of stored records. */
  public get size(): number {
    return this.items.length;
  }

  /** Whether any download record exists. */
  public get isEmpty(): boolean {
    return this.items.length === 0;
  }

  /** The number of downloads still in progress (pending/progressing/paused). */
  public get activeCount(): number {
    return this.items.reduce(
      (count, item) => count + (ACTIVE_DOWNLOAD_STATES.includes(item.state) ? 1 : 0),
      0,
    );
  }

  /** Finds a download by id, or null. */
  public entry(id: string): DownloadItem | null {
    return this.items.find((item) => item.id === id) ?? null;
  }

  /**
   * Registers a new download. The URL must be a valid `http:`/`https:` source;
   * the filename is sanitized here so a hostile suggestion can never escape the
   * save directory.
   */
  public addDownload(input: AddDownloadInput): AddDownloadResult {
    if (!isValidDownloadUrl(input.url)) {
      return { ok: false, reason: 'invalid-url' };
    }
    const now = Date.now();
    const item: DownloadItem = {
      id: createDownloadId(),
      url: input.url.trim(),
      filename: sanitizeFilename(input.filename),
      savePath: input.savePath,
      state: 'pending',
      receivedBytes: 0,
      totalBytes:
        typeof input.totalBytes === 'number' && input.totalBytes > 0
          ? Math.floor(input.totalBytes)
          : 0,
      startedAt: now,
      completedAt: null,
      error: null,
      mimeType: typeof input.mimeType === 'string' ? input.mimeType : null,
      executable: isExecutableFilename(input.filename),
    };
    this.items.unshift(item);
    this.enforceLimit();
    return { ok: true, item };
  }

  /**
   * Updates progress. Accepts any non-terminal state. Never changes an error
   * or terminal flag.
   */
  public updateProgress(
    id: string,
    receivedBytes: number,
    totalBytes?: number,
  ): boolean {
    const index = this.items.findIndex((item) => item.id === id);
    const existing = this.items[index];
    if (index < 0 || existing === undefined) {
      return false;
    }
    if (TERMINAL_DOWNLOAD_STATES.includes(existing.state)) {
      return false;
    }
    const received =
      typeof receivedBytes === 'number' && receivedBytes > 0
        ? Math.floor(receivedBytes)
        : 0;
    const total =
      typeof totalBytes === 'number' && totalBytes > 0
        ? Math.floor(totalBytes)
        : existing.totalBytes;
    this.items[index] = {
      ...existing,
      state: existing.state === 'pending' ? 'progressing' : existing.state,
      receivedBytes: Math.max(received, existing.receivedBytes),
      totalBytes: Math.max(total, existing.totalBytes),
    };
    return true;
  }

  /** Marks a download as paused. No-op unless it was progressing. */
  public markPaused(id: string): boolean {
    return this.transition(id, 'paused');
  }

  /** Marks a paused download as resuming (progressing). */
  public markResumed(id: string): boolean {
    return this.transition(id, 'progressing');
  }

  /** Marks a download as completed. Sets completedAt and preserves bytes. */
  public markCompleted(id: string): boolean {
    const index = this.items.findIndex((item) => item.id === id);
    const existing = this.items[index];
    if (index < 0 || existing === undefined) {
      return false;
    }
    if (existing.state === 'completed') {
      return false;
    }
    this.items[index] = {
      ...existing,
      state: 'completed',
      completedAt: Date.now(),
      error: null,
    };
    return true;
  }

  /** Marks a download as cancelled by the user. */
  public markCancelled(id: string): boolean {
    const index = this.items.findIndex((item) => item.id === id);
    const existing = this.items[index];
    if (index < 0 || existing === undefined) {
      return false;
    }
    if (existing.state === 'cancelled') {
      return false;
    }
    this.items[index] = {
      ...existing,
      state: 'cancelled',
      completedAt: Date.now(),
      error: null,
    };
    return true;
  }

  /** Marks a download as failed with a friendly error message. */
  public markFailed(id: string, error: string): boolean {
    const index = this.items.findIndex((item) => item.id === id);
    const existing = this.items[index];
    if (index < 0 || existing === undefined) {
      return false;
    }
    if (existing.state === 'failed') {
      return false;
    }
    this.items[index] = {
      ...existing,
      state: 'failed',
      completedAt: Date.now(),
      error: String(error).slice(0, 300) || 'The download failed.',
    };
    return true;
  }

  /** Removes a single record (metadata only; never touches the file). */
  public remove(id: string): boolean {
    const before = this.items.length;
    this.items = this.items.filter((item) => item.id !== id);
    return this.items.length !== before;
  }

  /**
   * Removes every record in the given states. Only terminal states
   * (completed/cancelled/failed) are accepted — active downloads are never
   * cleared, since that would only delete metadata while the file is still
   * being written. Returns removed count.
   */
  public clearByState(states: readonly DownloadState[]): number {
    const target = new Set(states);
    for (const state of target) {
      if (!TERMINAL_DOWNLOAD_STATES.includes(state)) {
        return 0;
      }
    }
    const before = this.items.length;
    this.items = this.items.filter((item) => !target.has(item.state));
    return before - this.items.length;
  }

  /** Removes all records. Returns the number removed. */
  public clearAll(): number {
    const removed = this.items.length;
    this.items = [];
    return removed;
  }

  /**
   * Marks every active (non-terminal) download as failed. Used when the host
   * starts up and finds persisted records whose Electron download handle is
   * gone — the download cannot resume, so pretending it is still active would
   * be misleading. Returns the number of records marked.
   */
  public failInterrupted(error: string): number {
    let marked = 0;
    for (let i = 0; i < this.items.length; i += 1) {
      const item = this.items[i];
      if (item !== undefined && !TERMINAL_DOWNLOAD_STATES.includes(item.state)) {
        this.items[i] = {
          ...item,
          state: 'failed',
          completedAt: Date.now(),
          error: String(error).slice(0, 300) || 'The download was interrupted.',
        };
        marked += 1;
      }
    }
    return marked;
  }

  /** Case-insensitive local search across filename and source URL. */
  public search(query: string): DownloadItem[] {
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) {
      return [...this.items];
    }
    return this.items.filter((item) => {
      return (
        item.filename.toLowerCase().includes(needle) ||
        item.url.toLowerCase().includes(needle)
      );
    });
  }

  /** An empty collection to seed a fresh store. */
  public static empty(): DownloadCollection {
    return emptyDownloadCollection();
  }

  /**
   * Applies a state transition, enforcing the state machine. Terminal states
   * are never left; completed is only reachable from an active state.
   */
  private transition(id: string, state: DownloadState): boolean {
    const index = this.items.findIndex((item) => item.id === id);
    const existing = this.items[index];
    if (index < 0 || existing === undefined) {
      return false;
    }
    if (TERMINAL_DOWNLOAD_STATES.includes(existing.state)) {
      return false;
    }
    if (!ACTIVE_DOWNLOAD_STATES.includes(state)) {
      return false;
    }
    this.items[index] = { ...existing, state };
    return true;
  }

  /** Keeps the collection within MAX_DOWNLOAD_RECORDS, trimming oldest finished. */
  private enforceLimit(): void {
    if (this.items.length <= MAX_DOWNLOAD_RECORDS) {
      return;
    }
    const overflow = this.items.length - MAX_DOWNLOAD_RECORDS;
    const removable: number[] = [];
    for (let i = this.items.length - 1; i >= 0 && removable.length < overflow; i -= 1) {
      const item = this.items[i];
      if (item !== undefined && TERMINAL_DOWNLOAD_STATES.includes(item.state)) {
        removable.push(i);
      }
    }
    for (const index of removable) {
      this.items.splice(index, 1);
    }
  }
}