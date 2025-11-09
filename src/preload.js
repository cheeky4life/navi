const { contextBridge, ipcRenderer } = require('electron')
const { spawn } = require('child_process')
const path = require('path')

contextBridge.exposeInMainWorld('asr', {
    startRecording: async () => {
        return ipcRenderer.invoke('asr:startRecording')
    },
    stopRecording: async () => {
        return ipcRenderer.invoke('asr:stopRecording')
    },
    transcribe: async (filePath) => {
        return ipcRenderer.invoke('asr:transcribe', filePath)
    }
})

contextBridge.exposeInMainWorld('auth', {
    login: async () => {
        return ipcRenderer.invoke('auth:login')
    },
    logout: async () => {
        return ipcRenderer.invoke('auth:logout')
    },
    getStatus: async () => {
        return ipcRenderer.invoke('auth:getStatus')
    },
    getConfig: async () => {
        return ipcRenderer.invoke('auth:getConfig')
    }
})

contextBridge.exposeInMainWorld('electron', {
    // Add any other electron functionality you need
})