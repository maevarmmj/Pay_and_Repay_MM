const { contextBridge, ipcRenderer } = require('electron');

// Create a secure bridge between the renderer process and the main process
// Expose a limited API to the renderer process
contextBridge.exposeInMainWorld('api', {
    getDepenses: () => ipcRenderer.invoke('depenses:get-all'),
    addDepense: (depense) => ipcRenderer.invoke('depenses:add', depense),
    deleteDepense: (id) => ipcRenderer.invoke('depenses:delete', id),
    deleteAllDepenses: () => ipcRenderer.invoke('depenses:delete-all'),
    getSetting: (key) => ipcRenderer.invoke('settings:get', key),
    setSetting: (key, value) => ipcRenderer.invoke('settings:set', key, value),
    close: () => ipcRenderer.send('window:close'), // Expose a method to close the window
    minimize: () => ipcRenderer.send('window:minimize')
});
