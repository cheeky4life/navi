const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const { setupAuthHandlers } = require('../navi/src/auth.js')

let mainWindow
let currentRecordingProcess = null

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        transparent: true,
        frame: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:3000')
        mainWindow.webContents.openDevTools()
    } else {
        mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'))
    }
}

// Initialize auth handlers
setupAuthHandlers()

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

// ASR Integration
ipcMain.handle('asr:startRecording', async () => {
    if (currentRecordingProcess) {
        throw new Error('Recording already in progress')
    }

    const outputFile = path.join(app.getPath('temp'), 'recording.wav')
    const scriptPath = path.join(__dirname, '..', 'python-clients', 'scripts', 'asr', 'record_audio.py')

    currentRecordingProcess = spawn('python', [
        scriptPath,
        '--output', outputFile
    ])

    return new Promise((resolve, reject) => {
        currentRecordingProcess.on('error', (err) => {
            currentRecordingProcess = null
            reject(err)
        })

        currentRecordingProcess.stderr.on('data', (data) => {
            console.error(`Recording error: ${data}`)
        })

        // Resolve immediately since we'll stop recording separately
        resolve(outputFile)
    })
})

ipcMain.handle('asr:stopRecording', async () => {
    if (!currentRecordingProcess) {
        throw new Error('No recording in progress')
    }

    currentRecordingProcess.kill()
    currentRecordingProcess = null
    return true
})

ipcMain.handle('asr:transcribe', async (event, audioFile) => {
    const scriptPath = path.join(__dirname, '..', 'python-clients', 'scripts', 'asr', 'transcribe_file.py')

    return new Promise((resolve, reject) => {
        const transcribeProcess = spawn('python', [
            scriptPath,
            '--server', 'your-nvidia-asr-server:50051',
            '--input-file', audioFile
        ])

        let output = ''
        let errorOutput = ''

        transcribeProcess.stdout.on('data', (data) => {
            output += data.toString()
        })

        transcribeProcess.stderr.on('data', (data) => {
            errorOutput += data.toString()
        })

        transcribeProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    const result = JSON.parse(output)
                    resolve(result)
                } catch (err) {
                    reject(new Error('Failed to parse transcription result'))
                }
            } else {
                reject(new Error(errorOutput || 'Transcription failed'))
            }
        })

        transcribeProcess.on('error', (err) => {
            reject(err)
        })
    })
})