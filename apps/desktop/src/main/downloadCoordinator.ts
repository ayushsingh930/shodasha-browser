/**
 * DownloadCoordinator: owns the single source of truth for downloads and
 * exposes a narrow, validated IPC surface to the chrome UI.
 *
 * Responsibilities:
 * - Holds the core DownloadManager (the only download store) plus the
 *   DownloadStore that persists metadata locally. Download metadata never
 *   leaves the device; the actual files live in the OS Downloads directory.
 * - Listens to Electron's official download lifecycle on the shared session
 *   (`will-download`) and controls every download from the main process: it
 *   chooses the save directory and a sanitized, non-destructive filename, so
 *   a webpage can never pick an arbitrary privileged path.
 * - Tracks the live Electron DownloadItem per record and drives pause/resume/
 *   cancel through Electron's own download API — never by fetching URLs from
 *   renderer JavaScript.
 * - "Open" and "Show in Folder" use the OS-level `shell.openPath` /
 *   `shell.showItemInFolder`; no arbitrary command is ever executed.
 * - Downloads are never auto-executed, and executable/script filenames are
 *   surfaced as a safety hint in the UI (no antivirus claims).
 * - Validates every renderer input here in the main process; the renderer is
 *   never trusted. Node/fs/shell/child_process are never exposed.
 *
 * IPC channels handled: downloads:get-state, downloads:pause,
 * downloads:resume, downloads:cancel, downloads:remove, downloads:clear,
 * downloads:open, downloads:show.
 */

import {
  app,
  ipcMain,
  shell,
  type DownloadItem as ElectronDownloadItem,
  type Session,
  type WebContents,
} from 'electron';
import { mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  DownloadManager,
  sanitizeFilename,
  uniqueFilename,
  type DownloadItem,
} from '@shodasha/core';
import { IPC, type DownloadsState } from '../shared/browserState.js';
import { DownloadStore } from './downloadStore.js';

/** Progress-driven pushes are throttled to avoid IPC spam. */
const PUSH_THROTTLE_MS = 300;

export interface DownloadCoordinatorOptions {
  /** The chrome webContents used to push download state to the UI. */
  readonly chrome: WebContents;
  /** The shared session whose downloads this coordinator controls. */
  readonly session: Session;
  /** Path to the JSON file holding download metadata. */
  readonly file: string;
  /** Optional download directory override (defaults to the OS Downloads dir). */
  readonly downloadsDir?: string;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export class DownloadCoordinator {
  private readonly manager: DownloadManager;
  private readonly store: DownloadStore;
  private readonly chrome: WebContents;
  private readonly downloadsDir: string;
  /** Live Electron download handles by our record id. */
  private readonly liveItems = new Map<string, ElectronDownloadItem>();
  /** Filenames currently being written, to avoid collisions. */
  private readonly activeNames = new Set<string>();
  private lastPush = 0;
  private pushTimer: NodeJS.Timeout | null = null;
  private disposed = false;

  public constructor(options: DownloadCoordinatorOptions) {
    this.chrome = options.chrome;
    this.downloadsDir =
      options.downloadsDir ?? app.getPath('downloads');
    mkdirSync(this.downloadsDir, { recursive: true });
    this.store = new DownloadStore(options.file);
    this.manager = new DownloadManager(this.store.load());
    // Downloads that were active when the browser closed cannot be resumed;
    // mark them honestly instead of pretending they are still active.
    this.manager.failInterrupted(
      'The download was interrupted because the browser closed.',
    );
    this.installDownloadEvents(options.session);
    this.installIpcHandlers();
  }

  /**
   * Whether a save path is still on disk. Used to guard Open/Show actions so
   * a stale metadata record never navigates the user to a missing file.
   */
  private fileExists(savePath: string): boolean {
    try {
      return readdirSync(this.downloadsDir).some(
        (name) => join(this.downloadsDir, name) === savePath,
      );
    } catch {
      return false;
    }
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

  // -------------------------------------------------- download lifecycle

  private installDownloadEvents(session: Session): void {
    session.on('will-download', (_event, item) => {
      this.beginDownload(item);
    });
  }

  /**
   * Handles a download initiated by any webContents on the shared session.
   * The main process decides everything about where and under what name the
   * file is written; the page has no say in the destination path.
   */
  private beginDownload(item: ElectronDownloadItem): void {
    if (this.disposed) {
      item.cancel();
      return;
    }
    const url = item.getURL();
    const suggested = item.getFilename();
    // Safety: a filename can never be a path. Strip all components, then pick
    // a non-destructive name that does not collide with an on-disk file or an
    // in-flight download.
    const sanitized = sanitizeFilename(suggested || 'download');
    const taken = this.existingFileNames();
    for (const name of this.activeNames) {
      taken.add(name);
    }
    const filename = uniqueFilename(taken, sanitized);
    const savePath = join(this.downloadsDir, filename);

    const result = this.manager.addDownload({
      url,
      filename,
      savePath,
      totalBytes: item.getTotalBytes(),
      mimeType: item.getMimeType(),
    });
    if (!result.ok) {
      item.cancel();
      return;
    }
    const record = result.item;
    this.activeNames.add(filename);
    this.liveItems.set(record.id, item);
    item.setSavePath(savePath);

    item.on('updated', () => {
      this.onUpdated(record.id, item);
    });
    item.on('done', (_event, state) => {
      this.onDone(record.id, item, state);
    });

    this.persist();
    this.push();
  }

  /** Progress and pause/resume state from Electron's official `updated` event. */
  private onUpdated(id: string, item: ElectronDownloadItem): void {
    const record = this.manager.entry(id);
    if (record === null) {
      return;
    }
    if (item.isPaused()) {
      this.manager.markPaused(id);
    } else if (record.state === 'paused') {
      this.manager.markResumed(id);
    } else {
      this.manager.updateProgress(id, item.getReceivedBytes(), item.getTotalBytes());
    }
    this.persist();
    this.maybePushThrottled();
  }

  /** Terminal state from Electron's official `done` event. */
  private onDone(
    id: string,
    item: ElectronDownloadItem,
    state: 'completed' | 'cancelled' | 'interrupted',
  ): void {
    this.liveItems.delete(id);
    const filename = this.manager.entry(id)?.filename;
    if (filename !== undefined) {
      this.activeNames.delete(filename);
    }
    // Very fast downloads may finish before any `updated` event; sync the
    // final byte counters so a completed record always reports real progress.
    this.manager.updateProgress(id, item.getReceivedBytes(), item.getTotalBytes());
    if (state === 'completed') {
      this.manager.markCompleted(id);
    } else if (state === 'cancelled') {
      this.manager.markCancelled(id);
    } else {
      this.manager.markFailed(id, 'The download was interrupted.');
    }
    this.persist();
    this.push();
    if (state === 'completed') {
      this.notifyCompleted(id, item.getFilename());
    }
  }

  /** Subtle in-browser completion notice pushed to the chrome UI. */
  private notifyCompleted(id: string, filename: string): void {
    if (this.disposed || this.chrome.isDestroyed()) {
      return;
    }
    this.chrome.send(IPC.downloadsCompleted, { id, filename });
  }

  // ------------------------------------------------------------ IPC

  private installIpcHandlers(): void {
    ipcMain.handle(IPC.downloadsGetState, () => this.serializeState());

    ipcMain.handle(IPC.downloadsPause, (_e, id: unknown) => {
      if (!isString(id)) {
        return false;
      }
      const item = this.liveItems.get(id);
      if (item === undefined || item.isPaused()) {
        return false;
      }
      item.pause();
      return true;
    });

    ipcMain.handle(IPC.downloadsResume, (_e, id: unknown) => {
      if (!isString(id)) {
        return false;
      }
      const item = this.liveItems.get(id);
      if (item === undefined || !item.isPaused() || !item.canResume()) {
        return false;
      }
      item.resume();
      return true;
    });

    ipcMain.handle(IPC.downloadsCancel, (_e, id: unknown) => {
      if (!isString(id)) {
        return false;
      }
      const item = this.liveItems.get(id);
      if (item === undefined) {
        return false;
      }
      item.cancel();
      return true;
    });

    ipcMain.handle(IPC.downloadsRemove, (_e, id: unknown) => {
      if (!isString(id)) {
        return false;
      }
      const removed = this.manager.remove(id);
      if (removed) {
        this.persist();
        this.push();
      }
      return removed;
    });

    ipcMain.handle(IPC.downloadsClear, (_e, raw: unknown) => {
      const states = parseClearTarget(raw);
      if (states === null) {
        return 0;
      }
      const removed = this.manager.clearByState(states);
      if (removed > 0) {
        this.persist();
        this.push();
      }
      return removed;
    });

    ipcMain.handle(IPC.downloadsOpen, async (_e, id: unknown) => {
      if (!isString(id)) {
        return { ok: false };
      }
      return this.openDownloadedFile(id);
    });

    ipcMain.handle(IPC.downloadsShow, (_e, id: unknown) => {
      if (!isString(id)) {
        return false;
      }
      const record = this.manager.entry(id);
      if (
        record?.state !== 'completed' ||
        !this.fileExists(record.savePath)
      ) {
        return false;
      }
      shell.showItemInFolder(record.savePath);
      return true;
    });
  }

  /** Opens a completed file through the OS (never auto-executed). */
  private async openDownloadedFile(id: string): Promise<{ ok: boolean }> {
    const record = this.manager.entry(id);
    if (
      record?.state !== 'completed' ||
      !this.fileExists(record.savePath)
    ) {
      return { ok: false };
    }
    const error = await shell.openPath(record.savePath);
    return { ok: error.length === 0 };
  }

  // -------------------------------------------------------- state push

  private serializeState(): DownloadsState {
    return { items: this.manager.list };
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
    this.chrome.send(IPC.downloadsStateChanged, this.serializeState());
  }

  // ------------------------------------------------------- persistence

  private persist(): void {
    this.store.scheduleSave(this.manager.snapshot());
  }

  private existingFileNames(): Set<string> {
    try {
      return new Set(readdirSync(this.downloadsDir));
    } catch {
      return new Set();
    }
  }
}

/** Validates a clear target from the renderer. */
function parseClearTarget(raw: unknown): DownloadItem['state'][] | null {
  if (!isString(raw)) {
    return null;
  }
  switch (raw) {
    case 'completed':
      return ['completed'];
    case 'failed':
      return ['failed'];
    case 'cancelled':
      return ['cancelled'];
    case 'all':
      return ['completed', 'cancelled', 'failed'];
    default:
      return null;
  }
}