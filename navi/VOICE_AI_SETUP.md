# Voice AI Setup Guide

This guide explains how to set up and use the real-time voice AI feature in your Electron app.

## Prerequisites

1. **Python 3.8+** installed and in your PATH
2. **Node.js and npm** installed
3. **Gemini API Key** (already configured in the code)

## Quick Start

### 1. Install Python Dependencies

Open a terminal in the `navi` directory and run:

```powershell
# Windows PowerShell
cd python-clients
pip install -r requirements.txt
pip install google-generativeai
```

```bash
# Linux/macOS
cd python-clients
pip install -r requirements.txt
pip install google-generativeai
```

### 2. Start the Voice AI Server

**Before starting your Electron app**, you need to start the Python WebSocket server:

**Windows:**
```powershell
# Option 1: Use the batch script
.\start-voice-server.bat

# Option 2: Manual start
cd python-clients\scripts\voice_ai
python voice_ai_server.py
```

**Linux/macOS:**
```bash
# Option 1: Use the shell script
chmod +x start-voice-server.sh
./start-voice-server.sh

# Option 2: Manual start
cd python-clients/scripts/voice_ai
python voice_ai_server.py
```

You should see:
```
Starting Voice AI WebSocket server on localhost:8765
Voice AI server is running on ws://localhost:8765
Waiting for connections...
```

**Keep this terminal window open** - the server needs to stay running.

### 3. Start Your Electron App

In a **separate terminal**, start your Electron app:

```powershell
npm run start
```

## How It Works

1. **Speech Recognition**: The app uses the Web Speech API to transcribe your voice in real-time
2. **WebSocket Connection**: When you speak, the transcript is sent to the Python server via WebSocket
3. **AI Processing**: The Python server uses Gemini API to generate intelligent responses
4. **Streaming Response**: AI responses stream back to the app in real-time

## Connection Status Indicators

Look at the microphone button (🎤) in the top center of the app:

- **Green dot**: WebSocket connected and ready
- **Yellow dot (pulsing)**: Connecting to server
- **Red dot**: Not connected (server may not be running)

## Troubleshooting

### "Connection Error" or Red Dot

**Problem**: The WebSocket server is not running or not accessible.

**Solution**:
1. Make sure the Python server is running (see Step 2 above)
2. Check that port 8765 is not blocked by firewall
3. Verify the server URL is `ws://localhost:8765`

### "Failed to connect" Error

**Problem**: The server failed to start or dependencies are missing.

**Solution**:
1. Verify Python dependencies are installed:
   ```powershell
   pip list | findstr "google-generativeai websockets"
   ```
2. Check that your Gemini API key is correct in `python-clients/scripts/voice_ai/voice_ai_server.py` (line 32)
3. Test the server manually:
   ```powershell
   cd python-clients\scripts\voice_ai
   python test_connection.py
   ```

### Microphone Not Working

**Problem**: The app can't access your microphone.

**Solution**:
1. Check Windows Privacy Settings → Microphone → Allow apps to access your microphone
2. Grant permission when Electron prompts you
3. Check browser console (F12) for permission errors

### No AI Response

**Problem**: Speech is transcribed but no AI response appears.

**Solution**:
1. Check the Python server terminal for errors
2. Verify Gemini API key is valid
3. Check your API quota at https://makersuite.google.com/app/apikey
4. Look for error messages in the Electron app's developer console (F12)

## Testing the Connection

You can test if everything is set up correctly:

```powershell
cd python-clients\scripts\voice_ai
python test_connection.py
```

This will verify:
- ✅ Gemini API is working
- ✅ WebSocket server is accessible

## Development Workflow

1. **Start the server** (in one terminal):
   ```powershell
   .\start-voice-server.bat
   ```

2. **Start the app** (in another terminal):
   ```powershell
   npm run start
   ```

3. **Test voice input**:
   - Click the microphone button (🎤)
   - Speak clearly
   - Watch for transcription and AI response

## Server Configuration

You can modify the server settings in `python-clients/scripts/voice_ai/voice_ai_server.py`:

- **Port**: Change `WEBSOCKET_PORT` (default: 8765)
- **Host**: Change `WEBSOCKET_HOST` (default: localhost)
- **API Key**: Change `GEMINI_API_KEY` or set environment variable
- **Model**: Change `gemini-2.0-flash` to another model (line 56)

## Notes

- The server must be running **before** starting the Electron app
- The app will automatically try to reconnect if the server goes down
- Document operations (like "update PDF") still use local processing
- General queries use the WebSocket AI server for faster responses

## Next Steps

Once everything is working:
- Customize the AI model for your needs
- Add more voice commands
- Integrate with other features in your app

