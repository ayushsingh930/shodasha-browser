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
  shieldGetState: 'shield:get-state',
  shieldSetEnabled: 'shield:set-enabled',
  shieldSetMode: 'shield:set-mode',
  shieldSetSiteSetting: 'shield:set-site-setting',
  shieldToggleAllowlist: 'shield:toggle-allowlist',
  shieldSubscribe: 'shield:subscribe',
  shieldUnsubscribe: 'shield:unsubscribe',
  shieldPanelChanged: 'shield:panel-changed',
  privacyGetState: 'privacy:get-state',
  shieldResetStats: 'shield:reset-stats',
  shieldGetAllowlist: 'shield:get-allowlist',
  shieldAddAllowlist: 'shield:add-allowlist',
  shieldRemoveAllowlist: 'shield:remove-allowlist',
  bookmarkGetState: 'bookmarks:get-state',
  bookmarkStateChanged: 'bookmarks:state-changed',
  bookmarkAdd: 'bookmarks:add',
  bookmarkUpdate: 'bookmarks:update',
  bookmarkDelete: 'bookmarks:delete',
  bookmarkCreateFolder: 'bookmarks:create-folder',
  bookmarkRenameFolder: 'bookmarks:rename-folder',
  bookmarkDeleteFolder: 'bookmarks:delete-folder',
  bookmarkMove: 'bookmarks:move',
  bookmarkSearch: 'bookmarks:search',
  bookmarkSetToolbarVisible: 'bookmarks:set-toolbar-visible',
  bookmarkOpenAddDialog: 'bookmarks:open-add-dialog',
  historyGetState: 'history:get-state',
  historyStateChanged: 'history:state-changed',
  historySearch: 'history:search',
  historyDeleteEntry: 'history:delete-entry',
  historyClear: 'history:clear',
  historyClearRange: 'history:clear-range',
  historyClearSite: 'history:clear-site',
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
  shield: {
    getState: () => ipcRenderer.invoke(IPC.shieldGetState),
    setEnabled: (enabled) => ipcRenderer.invoke(IPC.shieldSetEnabled, enabled),
    setMode: (mode) => ipcRenderer.invoke(IPC.shieldSetMode, mode),
    setSiteSetting: (site, setting) =>
      ipcRenderer.invoke(IPC.shieldSetSiteSetting, site, setting),
    toggleAllowlist: (site) =>
      ipcRenderer.invoke(IPC.shieldToggleAllowlist, site),
    subscribe: () => ipcRenderer.send(IPC.shieldSubscribe),
    unsubscribe: () => ipcRenderer.send(IPC.shieldUnsubscribe),
    onPanelChanged: (callback) => subscribe(IPC.shieldPanelChanged, callback),
  },
  privacy: {
    getState: () => ipcRenderer.invoke(IPC.privacyGetState),
    resetStatistics: () => ipcRenderer.invoke(IPC.shieldResetStats),
    getAllowlist: () => ipcRenderer.invoke(IPC.shieldGetAllowlist),
    addToAllowlist: (site) => ipcRenderer.invoke(IPC.shieldAddAllowlist, site),
    removeFromAllowlist: (site) =>
      ipcRenderer.invoke(IPC.shieldRemoveAllowlist, site),
  },
  bookmarks: {
    getState: () => ipcRenderer.invoke(IPC.bookmarkGetState),
    add: (input) => ipcRenderer.invoke(IPC.bookmarkAdd, input),
    update: (id, patch) => ipcRenderer.invoke(IPC.bookmarkUpdate, id, patch),
    delete: (id) => ipcRenderer.invoke(IPC.bookmarkDelete, id),
    createFolder: (name) => ipcRenderer.invoke(IPC.bookmarkCreateFolder, name),
    renameFolder: (id, name) =>
      ipcRenderer.invoke(IPC.bookmarkRenameFolder, id, name),
    deleteFolder: (id) => ipcRenderer.invoke(IPC.bookmarkDeleteFolder, id),
    move: (id, folderId) => ipcRenderer.invoke(IPC.bookmarkMove, id, folderId),
    search: (query) => ipcRenderer.invoke(IPC.bookmarkSearch, query),
    setToolbarVisible: (visible) =>
      ipcRenderer.invoke(IPC.bookmarkSetToolbarVisible, visible),
    onStateChanged: (callback) => subscribe(IPC.bookmarkStateChanged, callback),
    onOpenAddDialog: (callback) =>
      subscribe(IPC.bookmarkOpenAddDialog, callback),
  },
  history: {
    getState: () => ipcRenderer.invoke(IPC.historyGetState),
    search: (query) => ipcRenderer.invoke(IPC.historySearch, query),
    deleteEntry: (id) => ipcRenderer.invoke(IPC.historyDeleteEntry, id),
    clear: () => ipcRenderer.invoke(IPC.historyClear),
    clearRange: (start, end) =>
      ipcRenderer.invoke(IPC.historyClearRange, { start, end }),
    clearSite: (site) => ipcRenderer.invoke(IPC.historyClearSite, site),
    onStateChanged: (callback) => subscribe(IPC.historyStateChanged, callback),
  },
});
