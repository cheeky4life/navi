<<<<<<< HEAD
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    "electron", {
    setIgnoreMouseEvents: (ignore) => {
        ipcRenderer.send('set-ignore-mouse-events', ignore);
    },
    auth: {
        login: (provider) => ipcRenderer.invoke('auth:login', provider),
        logout: () => ipcRenderer.invoke('auth:logout'),
        getAuthStatus: () => ipcRenderer.invoke('auth:getStatus'),
    },
    dialog: {
        openFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
    }
}
);
=======
// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
});
>>>>>>> 6dd3a91a501c540a441e75ad1f7c31ac8c1e8601
