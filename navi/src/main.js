import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import started from 'electron-squirrel-startup';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Get screen dimensions
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  
  // Calculate window dimensions and position
  const windowWidth = Math.floor(screenWidth * 0.6); // 60% of screen width
  const windowHeight = 80; // Thin bar height
  const xPosition = Math.floor((screenWidth - windowWidth) / 2); // Center horizontally
  const yPosition = Math.floor(screenHeight * 0.05); // 5% from top

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: xPosition,
    y: yPosition,
    transparent: true,
    frame: false,
    backgroundColor: '#00000000',
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Window control handlers
  ipcMain.on('window-minimize', () => {
    mainWindow.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on('window-close', () => {
    mainWindow.close();
  });

  // OpenAI Whisper speech-to-text handler
  ipcMain.handle('transcribe-audio', async (event, audioBlob) => {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OpenAI API key not found in .env file');
      }

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey });

      // Convert base64 to buffer
      const buffer = Buffer.from(audioBlob, 'base64');
      
      // Create a temporary file
      const tempPath = path.join(app.getPath('temp'), `audio_${Date.now()}.webm`);
      fs.writeFileSync(tempPath, buffer);

      // Transcribe with Whisper (force English language)
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempPath),
        model: 'whisper-1',
        language: 'en', // Force English only
        prompt: 'This is a voice command in English.', // Guide the model
      });

      // Clean up
      fs.unlinkSync(tempPath);

      return transcription.text;
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  });

  // GPT-4 chat handler (with Vision support)
  ipcMain.handle('chat-gpt', async (event, messages) => {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OpenAI API key not found in .env file');
      }

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey });

      // Check if any message contains images (Vision API needed)
      const hasImages = messages.some(msg => 
        Array.isArray(msg.content) && 
        msg.content.some(part => part.type === 'image_url')
      );

      const model = hasImages ? 'gpt-4o' : 'gpt-4'; // Use gpt-4o for vision
      console.log(`Using model: ${model}${hasImages ? ' (with vision)' : ''}`);

      const response = await openai.chat.completions.create({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: hasImages ? 1000 : 500, // More tokens for image analysis
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('GPT-4 error:', error);
      throw error;
    }
  });

  // Keyboard typing handler
  ipcMain.handle('type-text', async (event, text) => {
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      
      // Type character by character with delays to prevent chopping
      console.log('Typing text:', text);
      
      // Ensure focus on foreground window before typing
      // Use a single PowerShell session to type all characters quickly
      const escapedText = text.split('').map(char => {
        const specialChars = {
          '+': '{+}',
          '^': '{^}',
          '%': '{%}',
          '~': '{~}',
          '(': '{(}',
          ')': '{)}',
          '{': '{{}',
          '}': '{}}',
          '[': '{[}',
          ']': '{]}',
        };
        return specialChars[char] || char;
      }).join('');
      
      // Escape single quotes for PowerShell
      const psEscaped = escapedText.replace(/'/g, "''");
      
      // Single PowerShell command that types everything at once with proper focus
      const script = `
        Add-Type -AssemblyName System.Windows.Forms
        Start-Sleep -Milliseconds 100
        [System.Windows.Forms.SendKeys]::SendWait('${psEscaped}')
      `.trim().replace(/\n\s+/g, '; ');
      
      await execPromise(`powershell -WindowStyle Hidden -Command "${script}"`, { windowsHide: true });
      
      return { success: true };
    } catch (error) {
      console.error('Type text error:', error);
      throw error;
    }
  });

  // Open application handler
  ipcMain.handle('open-application', async (event, appName) => {
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      
      // Common application mappings
      const appMap = {
        'chrome': 'start chrome',
        'google chrome': 'start chrome',
        'edge': 'start msedge',
        'microsoft edge': 'start msedge',
        'firefox': 'start firefox',
        'notepad': 'start notepad',
        'calculator': 'start calc',
        'calc': 'start calc',
        'explorer': 'start explorer',
        'file explorer': 'start explorer',
        'vscode': 'start code',
        'vs code': 'start code',
        'visual studio code': 'start code',
        'cmd': 'start cmd',
        'command prompt': 'start cmd',
        'powershell': 'start powershell',
        'task manager': 'start taskmgr',
        'paint': 'start mspaint',
        'spotify': 'start spotify',
        'discord': 'start discord',
      };
      
      const command = appMap[appName.toLowerCase()] || `start ${appName}`;
      await execPromise(command);
      return { success: true, app: appName };
    } catch (error) {
      console.error('Open application error:', error);
      throw error;
    }
  });

  // Search web handler
  ipcMain.handle('search-web', async (event, query) => {
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      
      const encodedQuery = encodeURIComponent(query);
      await execPromise(`start https://www.google.com/search?q=${encodedQuery}`);
      return { success: true, query };
    } catch (error) {
      console.error('Search web error:', error);
      throw error;
    }
  });

  // Press key combination handler
  ipcMain.handle('press-keys', async (event, keys) => {
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      
      // PowerShell script to press keys (single line, properly formatted)
      const script = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${keys}')`;
      
      console.log('Executing PowerShell:', script);
      await execPromise(`powershell -Command "${script}"`);
      return { success: true, keys };
    } catch (error) {
      console.error('Press keys error:', error);
      throw error;
    }
  });

  // Screenshot capture handler
  ipcMain.handle('capture-screen', async () => {
    try {
      const { screen, desktopCapturer } = require('electron');
      const primaryDisplay = screen.getPrimaryDisplay();
      
      // Get screen sources
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
          width: primaryDisplay.size.width,
          height: primaryDisplay.size.height
        }
      });

      if (sources.length === 0) {
        throw new Error('No screen sources available');
      }

      // Get the primary screen's thumbnail as PNG
      const screenshot = sources[0].thumbnail.toPNG();
      
      // Convert to base64
      return screenshot.toString('base64');
    } catch (error) {
      console.error('Screenshot error:', error);
      throw error;
    }
  });

  // ElevenLabs TTS handler
  ipcMain.handle('text-to-speech', async (event, text) => {
    try {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        throw new Error('ElevenLabs API key not found in .env file');
      }

      const voiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel voice
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

      console.log('Making TTS request to:', url);
      console.log('Using API key:', apiKey.substring(0, 10) + '...');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_turbo_v2_5', // Updated to free tier model
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });

      console.log('TTS Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('TTS API error response:', errorText);
        throw new Error(`TTS API error: ${response.status} - ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      return Buffer.from(audioBuffer).toString('base64');
    } catch (error) {
      console.error('TTS error:', error);
      throw error;
    }
  });

  return mainWindow;
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
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
