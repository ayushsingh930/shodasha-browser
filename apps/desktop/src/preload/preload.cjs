/**
 * SHODASHA desktop - preload script.
 *
 * Runs in an isolated context with `contextIsolation: true`. The renderer
 * never gets direct Node.js access. Expose only a minimal, typed bridge
 * surface via `contextBridge`.
 */

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('shodasha', {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
});
