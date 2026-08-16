/**
 * BookmarkCoordinator: owns the single source of truth for bookmarks and
 * exposes a narrow, validated IPC surface to the chrome UI.
 *
 * Responsibilities:
 * - Holds the core BookmarkManager (the only bookmark store) plus the
 *   BookmarkStore that persists it locally. Bookmarks never leave the device.
 * - Derives the star-button state from the active tab (active URL →
 *   bookmarked id) so the toolbar, the star, and the Bookmark Manager page
 *   all stay in sync without a restart.
 * - Pushes bookmark state to the chrome UI: immediately for mutations and
 *   throttled (with a trailing push) for tab-navigation changes.
 * - Validates every renderer input here in the main process; the renderer is
 *   never trusted. Node/fs/shell/child_process are never exposed.
 *
 * IPC channels handled: bookmarks:get-state, bookmarks:add, bookmarks:update,
 * bookmarks:delete, bookmarks:create-folder, bookmarks:rename-folder,
 * bookmarks:delete-folder, bookmarks:move, bookmarks:search,
 * bookmarks:set-toolbar-visible.
 */

import { ipcMain, type WebContents } from 'electron';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  BookmarkManager,
  bookmarkKeyForUrl,
  type TabManager,
} from '@shodasha/core';
import {
  IPC,
  isBlankTabUrl,
  type BookmarkState,
} from '../shared/browserState.js';
import { BookmarkStore } from './bookmarkStore.js';

export interface BookmarkCoordinatorOptions {
  /** The chrome webContents used to push bookmark state to the UI. */
  readonly chrome: WebContents;
  /** Path to the JSON file holding the bookmark collection. */
  readonly collectionFile: string;
  /** Path to the JSON file holding the bookmarks-toolbar UI preference. */
  readonly prefsFile: string;
  /**
   * Called when the bookmarks-toolbar visibility changes, so the browser can
   * adjust the webview layout to leave room for the bar.
   */
  readonly onLayoutChanged?: () => void;
}

/** Navigation-driven pushes are throttled to avoid IPC spam. */
const PUSH_THROTTLE_MS = 400;

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/** Validates an optional folder id (string or null). */
function optionalFolderId(value: unknown): string | null | undefined {
  if (value === null) {
    return null;
  }
  return isString(value) && value.length > 0 ? value : undefined;
}

export class BookmarkCoordinator {
  private readonly manager: BookmarkManager;
  private readonly store: BookmarkStore;
  private readonly chrome: WebContents;
  private readonly prefsFile: string;
  private readonly onLayoutChanged: (() => void) | undefined;
  private toolbarVisible = true;
  private tabManager: TabManager | null = null;
  private lastPush = 0;
  private pushTimer: NodeJS.Timeout | null = null;
  private disposed = false;

  public constructor(options: BookmarkCoordinatorOptions) {
    this.chrome = options.chrome;
    this.store = new BookmarkStore(options.collectionFile);
    this.prefsFile = options.prefsFile;
    this.onLayoutChanged = options.onLayoutChanged;
    // Load persisted bookmarks into the single source of truth.
    this.manager = new BookmarkManager(this.store.load());
    this.toolbarVisible = this.loadToolbarVisible();
    this.installIpcHandlers();
  }

  /**
   * Attaches the tab manager so the star state follows navigation. Called per
   * window; the most recent window wins (single-window is the desktop case).
   */
  public attachManager(manager: TabManager): void {
    this.tabManager = manager;
    manager.subscribe(() => {
      this.maybePushThrottled();
    });
  }

  /**
   * Opens the add-bookmark dialog with trusted data captured on the main
   * side (never from the renderer). Called when the page context menu's
   * "Bookmark this page" action fires.
   */
  public openAddDialogForPage(url: string, title: string): void {
    if (this.disposed || this.chrome.isDestroyed()) {
      return;
    }
    this.chrome.send(IPC.bookmarkOpenAddDialog, { url, title });
  }

  /** Toggles the bookmarks toolbar (Ctrl+Shift+B) and persists the choice. */
  public toggleToolbar(): void {
    this.toolbarVisible = !this.toolbarVisible;
    this.persistPrefs();
    this.push();
    this.onLayoutChanged?.();
  }

  /** Whether the bookmarks toolbar is currently shown. */
  public isToolbarVisible(): boolean {
    return this.toolbarVisible;
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
    ipcMain.handle(IPC.bookmarkGetState, () => this.serializeState());

    ipcMain.handle(IPC.bookmarkAdd, (_e, raw: unknown) => {
      const input = parseAddInput(raw);
      if (input === null) {
        return { ok: false, reason: 'invalid-input' as const };
      }
      // Capture the page favicon (safe img source) when available.
      const result = this.manager.addBookmark({
        ...input,
        favicon: this.pageFaviconForUrl(input.url),
      });
      if (result.ok) {
        this.persist();
        this.push();
      }
      return result;
    });

    ipcMain.handle(IPC.bookmarkUpdate, (_e, id: unknown, raw: unknown) => {
      if (!isString(id)) {
        return { ok: false, reason: 'not-found' as const };
      }
      const patch = parseUpdateInput(raw);
      if (patch === null) {
        return { ok: false, reason: 'invalid-input' as const };
      }
      const result = this.manager.updateBookmark(id, patch);
      if (result.ok) {
        this.persist();
        this.push();
      }
      return result;
    });

    ipcMain.handle(IPC.bookmarkDelete, (_e, id: unknown) => {
      if (!isString(id)) {
        return false;
      }
      const removed = this.manager.deleteBookmark(id);
      if (removed) {
        this.persist();
        this.push();
      }
      return removed;
    });

    ipcMain.handle(IPC.bookmarkCreateFolder, (_e, name: unknown) => {
      if (!isString(name)) {
        return null;
      }
      const folder = this.manager.createFolder(name);
      if (folder !== null) {
        this.persist();
        this.push();
      }
      return folder;
    });

    ipcMain.handle(IPC.bookmarkRenameFolder, (_e, id: unknown, name: unknown) => {
      if (!isString(id) || !isString(name)) {
        return false;
      }
      const renamed = this.manager.renameFolder(id, name);
      if (renamed) {
        this.persist();
        this.push();
      }
      return renamed;
    });

    ipcMain.handle(IPC.bookmarkDeleteFolder, (_e, id: unknown) => {
      if (!isString(id)) {
        return false;
      }
      // Bookmarks inside the folder move to the root; they are never lost.
      const deleted = this.manager.deleteFolder(id);
      if (deleted) {
        this.persist();
        this.push();
      }
      return deleted;
    });

    ipcMain.handle(IPC.bookmarkMove, (_e, id: unknown, folderId: unknown) => {
      if (!isString(id)) {
        return false;
      }
      const target = optionalFolderId(folderId);
      if (target === undefined) {
        return false;
      }
      const moved = this.manager.moveBookmark(id, target);
      if (moved) {
        this.persist();
        this.push();
      }
      return moved;
    });

    ipcMain.handle(IPC.bookmarkSearch, (_e, query: unknown) => {
      return this.manager.search(isString(query) ? query : '');
    });

    ipcMain.handle(IPC.bookmarkSetToolbarVisible, (_e, visible: unknown) => {
      this.toolbarVisible = visible === true;
      this.persistPrefs();
      this.push();
      this.onLayoutChanged?.();
    });
  }

  // -------------------------------------------------------- state push

  private serializeState(): BookmarkState {
    const activeUrl = this.activeUrl();
    return {
      collection: this.manager.snapshot(),
      toolbarVisible: this.toolbarVisible,
      activeUrl,
      activeBookmarkId:
        activeUrl === null
          ? null
          : (this.manager.bookmarkForUrl(activeUrl)?.id ?? null),
    };
  }

  /** The active tab's URL, or null when nothing navigable is shown. */
  private activeUrl(): string | null {
    const active = this.tabManager?.activeTab ?? null;
    if (active === null || isBlankTabUrl(active.url)) {
      return null;
    }
    return active.url;
  }

  /** The active tab's favicon when its page matches the given URL. */
  private pageFaviconForUrl(url: string): string | null {
    const active = this.tabManager?.activeTab ?? null;
    if (active === null || isBlankTabUrl(active.url)) {
      return null;
    }
    if (bookmarkKeyForUrl(active.url) === bookmarkKeyForUrl(url)) {
      return active.favicon ?? null;
    }
    return null;
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
    this.chrome.send(IPC.bookmarkStateChanged, this.serializeState());
  }

  // ------------------------------------------------------- persistence

  private persist(): void {
    this.store.scheduleSave(this.manager.snapshot());
  }

  /** Loads the toolbar visibility preference (fail-safe). */
  private loadToolbarVisible(): boolean {
    try {
      const raw = readFileSync(this.prefsFile, 'utf8');
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return parsed.toolbarVisible === false ? false : true;
    } catch {
      return true;
    }
  }

  /** Persists the toolbar preference atomically. */
  private persistPrefs(): void {
    try {
      const json = JSON.stringify({ toolbarVisible: this.toolbarVisible });
      mkdirSync(dirname(this.prefsFile), { recursive: true });
      const tempPath = `${this.prefsFile}.tmp`;
      writeFileSync(tempPath, json, 'utf8');
      renameSync(tempPath, this.prefsFile);
    } catch {
      // A failed preference write must never crash the browser.
    }
  }
}

/** Validates an add-bookmark input coming from the renderer. */
function parseAddInput(
  raw: unknown,
): { title: string; url: string; folderId: string | null } | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const source = raw as Record<string, unknown>;
  if (!isString(source.title) || !isString(source.url)) {
    return null;
  }
  const folderId = optionalFolderId(source.folderId);
  if (folderId === undefined) {
    return null;
  }
  return { title: source.title, url: source.url, folderId };
}

/** Validates a partial update coming from the renderer. */
function parseUpdateInput(
  raw: unknown,
): { title?: string; url?: string; folderId?: string | null } | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const source = raw as Record<string, unknown>;
  if (
    (source.title !== undefined && !isString(source.title)) ||
    (source.url !== undefined && !isString(source.url))
  ) {
    return null;
  }
  const hasFolderId = source.folderId !== undefined;
  const folderId = optionalFolderId(source.folderId);
  if (hasFolderId && folderId === undefined) {
    return null;
  }
  const result: { title?: string; url?: string; folderId?: string | null } = {};
  if (source.title !== undefined) {
    result.title = source.title;
  }
  if (source.url !== undefined) {
    result.url = source.url;
  }
  if (hasFolderId && folderId !== undefined) {
    result.folderId = folderId;
  }
  return result;
}