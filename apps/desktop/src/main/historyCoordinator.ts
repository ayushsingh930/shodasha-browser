/**
 * HistoryCoordinator: owns the single source of truth for browsing history and
 * exposes a narrow, validated IPC surface to the chrome UI.
 *
 * Responsibilities:
 * - Holds the core HistoryManager (the only history store) plus the
 *   HistoryStore that persists it locally. History never leaves the device.
 * - Records page visits reported by the BrowserController after a successful
 *   main-frame navigation (never from the renderer, never from page content).
 * - Pushes history state to the chrome UI: immediately for user mutations and
 *   throttled (with a trailing push) for navigation-driven changes.
 * - Validates every renderer input here in the main process; the renderer is
 *   never trusted. Node/fs/shell/child_process are never exposed.
 * - Never touches bookmarks, downloads, cookies, or settings when clearing.
 *
 * IPC channels handled: history:get-state, history:search, history:delete-entry,
 * history:clear, history:clear-range, history:clear-site.
 */

import { ipcMain, type WebContents } from 'electron';
import { HistoryManager, isValidHostname, type RecordVisitInput, type RecordVisitOptions } from '@shodasha/core';
import { IPC, type HistoryState } from '../shared/browserState.js';
import { HistoryStore } from './historyStore.js';

/** Navigation-driven pushes are throttled to avoid IPC spam. */
const PUSH_THROTTLE_MS = 400;

/**
 * The interface the BrowserController uses to report navigations. Keeping it
 * narrow means the controller never reaches into history internals and the
 * coordinator can be swapped or tested independently.
 */
export interface HistoryRecorder {
  /**
   * Records a page visit. Returns the entry id when a visit was stored, or
   * `null` when the URL is not recordable (non-web, internal page, or a
   * future private tab).
   */
  recordVisit(
    input: RecordVisitInput,
    options?: RecordVisitOptions,
  ): string | null;
  /** Refreshes the title of a recently recorded entry (may be a no-op). */
  updateVisitTitle(entryId: string, title: string): void;
  /** Refreshes the favicon of a recently recorded entry (may be a no-op). */
  updateVisitFavicon(entryId: string, favicon: string | null): void;
}

export interface HistoryCoordinatorOptions {
  /** The chrome webContents used to push history state to the UI. */
  readonly chrome: WebContents;
  /** Path to the JSON file holding the history. */
  readonly file: string;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export class HistoryCoordinator implements HistoryRecorder {
  private readonly manager: HistoryManager;
  private readonly store: HistoryStore;
  private readonly chrome: WebContents;
  private lastPush = 0;
  private pushTimer: NodeJS.Timeout | null = null;
  private disposed = false;

  public constructor(options: HistoryCoordinatorOptions) {
    this.chrome = options.chrome;
    this.store = new HistoryStore(options.file);
    // Load persisted history into the single source of truth (fail-safe).
    this.manager = new HistoryManager(this.store.load());
    this.installIpcHandlers();
  }

  /** Reports a page visit. See {@link HistoryRecorder.recordVisit}. */
  public recordVisit(
    input: RecordVisitInput,
    options: RecordVisitOptions = {},
  ): string | null {
    if (this.disposed) {
      return null;
    }
    const result = this.manager.recordVisit(input, options);
    if (!result.ok) {
      return null;
    }
    this.persist();
    this.maybePushThrottled();
    return result.entry.id;
  }

  /** See {@link HistoryRecorder.updateVisitTitle}. */
  public updateVisitTitle(entryId: string, title: string): void {
    if (this.disposed || this.manager.entry(entryId) === null) {
      return;
    }
    this.manager.updateEntryTitle(entryId, title);
    this.persist();
    this.maybePushThrottled();
  }

  /** See {@link HistoryRecorder.updateVisitFavicon}. */
  public updateVisitFavicon(entryId: string, favicon: string | null): void {
    if (this.disposed || this.manager.entry(entryId) === null) {
      return;
    }
    this.manager.updateEntryFavicon(entryId, favicon);
    this.persist();
    this.maybePushThrottled();
  }

  /** Releases resources and flushes any pending write. */
  public dispose(): void {
    this.disposed = true;
    if (this.pushTimer !== null) {
      clearTimeout(this.pushTimer);
      this.pushTimer = null;
    }
    this.store.flush();
  }

  // ------------------------------------------------------------ IPC

  private installIpcHandlers(): void {
    ipcMain.handle(IPC.historyGetState, () => this.serializeState());

    ipcMain.handle(IPC.historySearch, (_e, query: unknown) => {
      return this.manager.search(isString(query) ? query : '');
    });

    ipcMain.handle(IPC.historyDeleteEntry, (_e, id: unknown) => {
      if (!isString(id)) {
        return false;
      }
      const removed = this.manager.deleteEntry(id);
      if (removed) {
        this.persist();
        this.push();
      }
      return removed;
    });

    ipcMain.handle(IPC.historyClear, () => {
      const removed = this.manager.clearAll();
      if (removed > 0) {
        this.persist();
        this.push();
      }
      return removed;
    });

    ipcMain.handle(IPC.historyClearRange, (_e, raw: unknown) => {
      const range = parseClearRange(raw);
      if (range === null) {
        return 0;
      }
      const removed = this.manager.clearRange(range.start, range.end);
      if (removed > 0) {
        this.persist();
        this.push();
      }
      return removed;
    });

    ipcMain.handle(IPC.historyClearSite, (_e, site: unknown) => {
      if (!isString(site) || !isValidHostname(site)) {
        return 0;
      }
      const removed = this.manager.clearSite(site);
      if (removed > 0) {
        this.persist();
        this.push();
      }
      return removed;
    });
  }

  // -------------------------------------------------------- state push

  private serializeState(): HistoryState {
    return { entries: this.manager.list };
  }

  private maybePushThrottled(): void {
    if (this.disposed || this.chrome.isDestroyed()) {
      return;
    }
    const now = Date.now();
    if (now - this.lastPush >= PUSH_THROTTLE_MS) {
      this.lastPush = now;
      this.push();
      return;
    }
    this.pushTimer ??= setTimeout(() => {
      this.pushTimer = null;
      this.lastPush = Date.now();
      this.push();
    }, PUSH_THROTTLE_MS);
  }

  private push(): void {
    if (this.disposed || this.chrome.isDestroyed()) {
      return;
    }
    this.chrome.send(IPC.historyStateChanged, this.serializeState());
  }

  // ------------------------------------------------------- persistence

  private persist(): void {
    this.store.scheduleSave(this.manager.snapshot());
  }
}

/** Validates a `{ start, end }` clear-range input from the renderer. */
function parseClearRange(
  raw: unknown,
): { start: number; end: number } | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const source = raw as Record<string, unknown>;
  if (
    typeof source.start !== 'number' ||
    !Number.isFinite(source.start) ||
    typeof source.end !== 'number' ||
    !Number.isFinite(source.end)
  ) {
    return null;
  }
  return { start: source.start, end: source.end };
}