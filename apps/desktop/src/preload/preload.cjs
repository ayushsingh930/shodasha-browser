/**
 * SHODASHA desktop - preload script.
 *
 * Runs in an isolated context with `contextIsolation: true`. The renderer
 * never gets direct Node.js access. Expose only a minimal, typed bridge
 * surface via `contextBridge`, and forward browser commands to the main
 * process over IPC.
 */

const { contextBridge, ipcRenderer } = require('electron');

const IPC = {
  getState: 'browser:get-state',
  submitAddress: 'browser:submit-address',
  goBack: 'browser:go-back',
  goForward: 'browser:go-forward',
  reload: 'browser:reload',
  stop: 'browser:stop',
  newTab: 'browser:new-tab',
  closeTab: 'browser:close-tab',
  activateTab: 'browser:activate-tab',
  stateChanged: 'browser:state-changed',
};

function subscribe(channel, callback) {
  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

contextBridge.exposeInMainWorld('shodasha', {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
  browser: {
    getState: () => ipcRenderer.invoke(IPC.getState),
    submitAddress: (input) => ipcRenderer.invoke(IPC.submitAddress, input),
    goBack: () => ipcRenderer.invoke(IPC.goBack),
    goForward: () => ipcRenderer.invoke(IPC.goForward),
    reload: () => ipcRenderer.invoke(IPC.reload),
    stop: () => ipcRenderer.invoke(IPC.stop),
    newTab: () => ipcRenderer.invoke(IPC.newTab),
    closeTab: (id) => ipcRenderer.invoke(IPC.closeTab, id),
    activateTab: (id) => ipcRenderer.invoke(IPC.activateTab, id),
    onStateChanged: (callback) => subscribe(IPC.stateChanged, callback),
  },
});
