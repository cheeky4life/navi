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