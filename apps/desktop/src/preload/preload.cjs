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
  hardReload: 'browser:hard-reload',
  stop: 'browser:stop',
  newTab: 'browser:new-tab',
  closeTab: 'browser:close-tab',
  activateTab: 'browser:activate-tab',
  reloadTab: 'browser:reload-tab',
  duplicateTab: 'browser:duplicate-tab',
  closeOtherTabs: 'browser:close-other-tabs',
  closeTabsToRight: 'browser:close-tabs-to-right',
  reopenClosedTab: 'browser:reopen-closed-tab',
  nextTab: 'browser:next-tab',
  prevTab: 'browser:prev-tab',
  stateChanged: 'browser:state-changed',
  focusAddressBar: 'browser:focus-address-bar',
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
    hardReload: () => ipcRenderer.invoke(IPC.hardReload),
    stop: () => ipcRenderer.invoke(IPC.stop),
    newTab: () => ipcRenderer.invoke(IPC.newTab),
    closeTab: (id) => ipcRenderer.invoke(IPC.closeTab, id),
    activateTab: (id) => ipcRenderer.invoke(IPC.activateTab, id),
    reloadTab: (id) => ipcRenderer.invoke(IPC.reloadTab, id),
    duplicateTab: (id) => ipcRenderer.invoke(IPC.duplicateTab, id),
    closeOtherTabs: (id) => ipcRenderer.invoke(IPC.closeOtherTabs, id),
    closeTabsToRight: (id) => ipcRenderer.invoke(IPC.closeTabsToRight, id),
    reopenClosedTab: () => ipcRenderer.invoke(IPC.reopenClosedTab),
    nextTab: () => ipcRenderer.invoke(IPC.nextTab),
    prevTab: () => ipcRenderer.invoke(IPC.prevTab),
    onStateChanged: (callback) => subscribe(IPC.stateChanged, callback),
    onFocusAddressBar: (callback) => subscribe(IPC.focusAddressBar, callback),
  },
});
