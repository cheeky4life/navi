import { app, BrowserWindow, ipcMain, session } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { setupAuthHandlers } from './auth.js';

// Gemini API Key - Store securely (consider using electron-store or environment variables)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCkUUlrUoCqdg9uB8b1VHdqWdXq-gREW9g';

// Track permission states
const mediaPermissions = new Map();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Get primary display dimensions
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // Set up session for permissions
  const ses = session.defaultSession;
  
  // Handle permission requests - allow microphone access
  ses.setPermissionRequestHandler((webContents, permission, callback, details) => {
    console.log('Permission requested:', permission, details);
    
    // Allow microphone and media permissions
    // Note: This auto-grants permission, but the system may still prompt the user
    if (permission === 'media' || permission === 'microphone' || permission === 'audioCapture') {
      console.log('Auto-granting microphone permission');
      callback(true);
    } else {
      console.log('Denying permission for:', permission);
      callback(false);
    }
  });
  
  // Set permission check handler - this allows the app to check if permission is granted
  ses.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    // For microphone permissions, always return true to allow the check
    // The actual permission will be handled by the system
    if (permission === 'media' || permission === 'microphone' || permission === 'audioCapture') {
      return true;
    }
    return false;
  });

  // Set Content Security Policy
  ses.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*; " +
          "media-src 'self' mediastream:; " +
          "img-src 'self' data: https:; " +
          "connect-src 'self' http://localhost:* ws://localhost:* https:;"
        ]
      }
    });
  });

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: false, // FIXED: Allow interaction with other apps
    hasShadow: false,
    skipTaskbar: false, // Show in taskbar
    focusable: true, // Allow window to receive focus
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      // Enable WebRTC APIs and Web Speech API
      webSecurity: true, // Keep true for Web Speech API to work
      enableWebRTC: true,
      // Enable all required permissions and features
      permissions: ['microphone', 'media'],
      defaultEncoding: 'UTF-8',
      // Ensure Web Speech API is available
      spellcheck: false, // Disable spellcheck to avoid conflicts
    },
  });

  // Start with window fully interactive (for login page)
  mainWindow.setIgnoreMouseEvents(false);

  // IPC handler to get Gemini API key securely
  ipcMain.handle('api:getGeminiKey', () => {
    return { apiKey: GEMINI_API_KEY };
  });

  // Handle window interactivity based on page state
  mainWindow.webContents.on('dom-ready', () => {
    mainWindow.webContents.executeJavaScript(`
      (function() {
        function updateWindowInteractivity() {
          const isMainApp = document.querySelector('[data-main-app]');
          
          if (isMainApp) {
            // Main app: use click-through with interactive areas
            function handleMouseMove(e) {
              const shouldCatch = e.target.closest('.interactive-area');
              window.electron.setIgnoreMouseEvents(!shouldCatch);
            }
            document.addEventListener('mousemove', handleMouseMove);
          } else {
            // Login page: always interactive
            window.electron.setIgnoreMouseEvents(false);
          }
        }
        
        // Initial check
        updateWindowInteractivity();
        
        // Watch for changes (e.g., when switching from login to main app)
        const observer = new MutationObserver(updateWindowInteractivity);
        observer.observe(document.body, { childList: true, subtree: true });
      })();
    `);
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Suppress autofill console warnings
  mainWindow.webContents.on('console-message', (event, level, message) => {
    if (message.includes('Autofill')) {
      // Note: preventDefault doesn't actually suppress console messages
      // We can't suppress Chromium internal errors from JavaScript
    }
  });

};

// IPC handler for mouse events
ipcMain.on('set-ignore-mouse-events', (event, ignore) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
    window.setIgnoreMouseEvents(ignore, { forward: true });
  }
});

// IPC handlers for window controls
ipcMain.on('window-minimize', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
    window.minimize();
  }
});

ipcMain.on('window-maximize', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  }
});

ipcMain.on('window-close', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
    window.close();
  }
});

// IPC handler for file dialog
ipcMain.handle('dialog:openFile', async (event, options = {}) => {
  const { dialog } = require('electron');
  const window = BrowserWindow.fromWebContents(event.sender);

  const result = await dialog.showOpenDialog(window, {
    title: options.title || 'Select a file',
    filters: options.filters || [
      { name: 'All Files', extensions: ['*'] },
      { name: 'PDFs', extensions: ['pdf'] },
      { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt', 'md'] },
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] },
    ],
    properties: options.properties || ['openFile'],
    ...options,
  });

  if (result.canceled) {
    return { canceled: true, filePaths: [] };
  }

  return { canceled: false, filePaths: result.filePaths };
});

// Note: We don't set a permission handler here
// This allows Electron's default behavior to work, which will show
// the system's native permission dialog when getUserMedia() is called
// The getUserMedia() call in the renderer process will trigger the permission prompt

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Setup authentication handlers
  setupAuthHandlers();

  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
