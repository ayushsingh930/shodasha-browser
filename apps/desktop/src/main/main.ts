/**
 * SHODASHA desktop - main process entry point.
 *
 * Owns the application lifecycle, creates a secure BrowserWindow, and wires
 * the platform-agnostic core's TabManager onto Electron via the
 * BrowserController.
 */

import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Logger, TabManager } from '@shodasha/core';
import { BookmarkCoordinator } from './bookmarkCoordinator.js';
import { BrowserController } from './browserController.js';
import { DownloadCoordinator } from './downloadCoordinator.js';
import { HistoryCoordinator } from './historyCoordinator.js';
import { ShieldCoordinator } from './shieldCoordinator.js';
import { ShieldSettingsStore } from './settingsStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const logger = new Logger({ level: 'info' });

let controller: BrowserController | null = null;
let shield: ShieldCoordinator | null = null;
let settingsStore: ShieldSettingsStore | null = null;
let bookmarks: BookmarkCoordinator | null = null;
let history: HistoryCoordinator | null = null;
let downloads: DownloadCoordinator | null = null;

/**
 * Hardened WebPreferences for the chrome UI. Context isolation is on, node
 * integration is off, and sandbox is on. This is the secure-by-default
 * baseline for the application chrome.
 */
function secureChromePreferences(): Electron.WebPreferences {
  return {
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    webSecurity: true,
    allowRunningInsecureContent: false,
    preload: path.join(__dirname, '..', 'preload', 'preload.cjs'),
  };
}

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'SHODASHA Browser',
    backgroundColor: '#ffffff',
    webPreferences: secureChromePreferences(),
  });

  // Never open arbitrary windows; the controller opens new tabs instead.
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  // External, non-web links open in the system browser only.
  win.webContents.on('will-navigate', (event, url) => {
    if (!/^https?:/i.test(url)) {
      event.preventDefault();
    }
  });

  const rendererHtml = path.join(__dirname, '..', 'renderer', 'index.html');
  void win.loadFile(rendererHtml);

  const manager = new TabManager();
  history ??= new HistoryCoordinator({
    chrome: win.webContents,
    file: path.join(app.getPath('userData'), 'history.json'),
  });
  controller = new BrowserController({
    window: win,
    manager,
    onBookmarkPage: (url, title) => {
      bookmarks?.openAddDialogForPage(url, title);
    },
    onToggleBookmarksBar: () => {
      bookmarks?.toggleToolbar();
    },
    bookmarksBarVisible: () => bookmarks?.isToolbarVisible() ?? false,
    historyRecorder: history,
  });
  controller.init();

  settingsStore ??= new ShieldSettingsStore(
    path.join(app.getPath('userData'), 'shield-settings.json'),
  );
  shield ??= new ShieldCoordinator({
    session: win.webContents.session,
    chrome: win.webContents,
    settingsStore,
  });
  shield.attachManager(manager);

  bookmarks ??= new BookmarkCoordinator({
    chrome: win.webContents,
    collectionFile: path.join(app.getPath('userData'), 'bookmarks.json'),
    prefsFile: path.join(app.getPath('userData'), 'bookmarks-ui.json'),
    onLayoutChanged: () => {
      controller?.relayout();
    },
  });
  bookmarks.attachManager(manager);

  downloads ??= new DownloadCoordinator({
    chrome: win.webContents,
    session: win.webContents.session,
    file: path.join(app.getPath('userData'), 'downloads.json'),
    ...(process.env.SHODASHA_DOWNLOADS_DIR
      ? { downloadsDir: process.env.SHODASHA_DOWNLOADS_DIR }
      : {}),
  });

  // Tear down tab views while the window is still valid ('close' fires before
  // destruction). dispose() is idempotent, so the 'closed' fallback stays safe.
  win.on('close', () => {
    controller?.dispose();
  });
  win.on('closed', () => {
    controller = null;
  });

  return win;
}

void app.whenReady().then(() => {
  logger.info('general', 'boot', 'SHODASHA desktop starting');
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('before-quit', () => {
  // Flush any debounced Shield settings, bookmark, history, and download writes
  // so saved data survives.
  settingsStore?.flush();
  bookmarks?.dispose();
  history?.dispose();
  downloads?.dispose();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
