import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { setupAuthHandlers } from './auth.js';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Get primary display dimensions
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  // Start with window fully interactive (for login page)
  mainWindow.setIgnoreMouseEvents(false);

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
