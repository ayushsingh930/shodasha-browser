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
import { BrowserController } from './browserController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const logger = new Logger({ level: 'info' });

let controller: BrowserController | null = null;

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
  controller = new BrowserController({ window: win, manager });
  controller.init();

  win.on('closed', () => {
    controller?.dispose();
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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
