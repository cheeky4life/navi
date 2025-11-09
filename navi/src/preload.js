const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
    // Window controls
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),

    // Mouse event handling
    setIgnoreMouseEvents: (ignore) => {
        ipcRenderer.send('set-ignore-mouse-events', ignore);
    },

    // Authentication
    auth: {
        login: (provider) => ipcRenderer.invoke('auth:login', provider),
        logout: () => ipcRenderer.invoke('auth:logout'),
        getAuthStatus: () => ipcRenderer.invoke('auth:getStatus'),
    },

    // Dialog
    dialog: {
        openFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
    },

    // API keys
    api: {
        getGeminiKey: () => ipcRenderer.invoke('api:getGeminiKey'),
    },
});

// NOTE: Web Speech API (webkitSpeechRecognition) is available natively in Electron's Chromium
// No need to expose it via contextBridge - it's already available in the renderer process
// The native API works better than a wrapper, so we don't interfere with it
// Removing the wrapper allows the native API to work properly
