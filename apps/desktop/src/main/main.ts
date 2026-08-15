/**
 * SHODASHA desktop - main process entry point.
 *
 * The main process owns the application lifecycle, creates secure
 * BrowserWindows with context isolation, and (in later milestones) wires the
 * core's content-filter engine into the session request pipeline.
 */

import { app, BrowserWindow, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Logger } from '@shodasha/core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const logger = new Logger({ level: 'info' });

/**
 * Hardened WebPreferences. Context isolation is on, node integration is off,
 * and sandbox is on for the renderer. This is the secure-by-default baseline.
 */
function secureWebPreferences(): Electron.WebPreferences {
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
    webPreferences: secureWebPreferences(),
  });

  // Open external links in the system browser, never inside the app chrome.
  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  const rendererHtml = path.join(__dirname, '..', 'renderer', 'index.html');
  void win.loadFile(rendererHtml);

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
