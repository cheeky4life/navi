// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    transcribeAudio: (audioBlob) => ipcRenderer.invoke('transcribe-audio', audioBlob),
    chatGPT: (messages) => ipcRenderer.invoke('chat-gpt', messages),
    textToSpeech: (text) => ipcRenderer.invoke('text-to-speech', text),
    captureScreen: () => ipcRenderer.invoke('capture-screen'),
    typeText: (text) => ipcRenderer.invoke('type-text', text),
    openApplication: (appName) => ipcRenderer.invoke('open-application', appName),
    searchWeb: (query) => ipcRenderer.invoke('search-web', query),
    pressKeys: (keys) => ipcRenderer.invoke('press-keys', keys),
});