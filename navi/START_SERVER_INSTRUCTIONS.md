# How to Start the Speech Recognition Server

## Quick Start

### Option 1: Use the Batch File (Easiest)
1. Double-click `start-speech-server.bat` in the `navi` folder
2. The server will start on `ws://localhost:8766`
3. Keep this window open while using the app

### Option 2: Manual Start
1. Open a terminal/PowerShell
2. Navigate to the server directory:
   ```powershell
   cd C:\Users\mayoa\navi\navi\python-clients\scripts\voice_ai
   ```
3. Start the server:
   ```powershell
   python speech_recognition_server.py
   ```

## First Time Setup

If you haven't installed dependencies yet:

```powershell
cd C:\Users\mayoa\navi\navi\python-clients
pip install -r requirements.txt
```

This installs:
- `SpeechRecognition` - For Google Speech API
- `pyaudio` - For audio processing
- `websockets` - For WebSocket server
- `google-genai` - For Gemini AI

## Troubleshooting

### "Module not found" error
- Make sure you installed dependencies: `pip install -r requirements.txt`
- Check that Python 3.7+ is installed: `python --version`

### "Port already in use" error
- Another instance might be running
- Close other terminals running the server
- Or change the port in `speech_recognition_server.py` (line 34)

### Server starts but app can't connect
- Make sure the server is running on port 8766
- Check Windows Firewall isn't blocking the connection
- Verify the server shows: "Speech Recognition server is running on ws://localhost:8766"

## What You Should See

When the server starts successfully, you'll see:
```
Starting Speech Recognition WebSocket server on localhost:8766
Speech Recognition server is running on ws://localhost:8766
Waiting for connections...
```

Then when the Electron app connects:
```
New WebSocket connection from ('127.0.0.1', ...)
Speech recognition session initialized
```

## Next Steps

1. Start the server (using one of the methods above)
2. Run the Electron app: `npm run start`
3. Click the microphone button
4. The app should connect and you can start speaking!

