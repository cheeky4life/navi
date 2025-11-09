# Speech Recognition Setup Guide

## Overview

The app now uses **Python-based speech recognition** instead of the Web Speech API. Audio is streamed from the Electron app to a Python backend server that processes it using Google Speech API.

## Why This Change?

1. **More Reliable**: Google Speech API is more accurate and consistent than Web Speech API
2. **Better for Electron**: Works reliably in Electron apps (Web Speech API can be flaky)
3. **Offline Option**: Can be switched to Whisper for offline recognition
4. **Better Control**: Full control over audio processing and recognition parameters

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd navi/python-clients
pip install -r requirements.txt
```

This installs:
- `SpeechRecognition` - Main speech recognition library
- `pyaudio` - Audio I/O library
- `websockets` - WebSocket server
- `google-genai` - Gemini API for AI responses

### 2. Start the Speech Recognition Server

**Windows:**
```bash
cd navi/python-clients/scripts/voice_ai
python speech_recognition_server.py
```

Or use the batch file:
```bash
cd navi/python-clients/scripts/voice_ai
start_speech_server.bat
```

**Linux/Mac:**
```bash
cd navi/python-clients/scripts/voice_ai
python3 speech_recognition_server.py
```

The server will start on `ws://localhost:8766`

### 3. Start the Voice AI Server (for AI responses)

In a separate terminal:
```bash
cd navi/python-clients/scripts/voice_ai
python voice_ai_server.py
```

This server handles AI responses and runs on `ws://localhost:8765`

### 4. Run the Electron App

```bash
cd navi
npm run start
```

The app will automatically connect to the speech recognition server when you click the microphone button.

## How It Works

1. **Audio Capture**: Electron app captures microphone audio using `getUserMedia`
2. **Audio Processing**: Audio is converted to 16-bit PCM format (16kHz, mono)
3. **WebSocket Streaming**: Audio chunks are sent to Python server via WebSocket
4. **Speech Recognition**: Python server uses Google Speech API to transcribe audio
5. **Transcript Return**: Server sends transcripts back to Electron app
6. **AI Processing**: Final transcripts are sent to Voice AI server for Gemini responses

## Troubleshooting

### "Failed to connect to speech recognition server"

- Make sure the Python server is running on port 8766
- Check firewall settings
- Verify the server started without errors

### "No speech detected"

- Check microphone permissions in Windows settings
- Ensure microphone is working in other apps
- Check server logs for errors

### "Speech recognition API error"

- Google Speech API requires internet connection
- Check your internet connection
- For offline use, consider switching to Whisper (requires additional setup)

### PyAudio Installation Issues

**Windows:**
```bash
pip install pipwin
pipwin install pyaudio
```

**Linux:**
```bash
sudo apt-get install portaudio19-dev python3-pyaudio
pip install pyaudio
```

**Mac:**
```bash
brew install portaudio
pip install pyaudio
```

## Configuration

### Change Server Port

Edit `navi/src/renderer/hooks/useAudioSpeechRecognition.js`:
```javascript
const SPEECH_WS_URL = 'ws://localhost:8766'; // Change port here
```

And `navi/python-clients/scripts/voice_ai/speech_recognition_server.py`:
```python
WEBSOCKET_PORT = int(os.getenv("WEBSOCKET_PORT", "8766"))  # Change port here
```

### Switch to Offline Recognition (Whisper)

1. Install Whisper:
```bash
pip install openai-whisper
```

2. Update `speech_recognition_server.py` to use Whisper instead of Google Speech API

## Grid-Based Dragging

The widget dragging system now uses a **20px grid** for smooth, predictable movement. Widgets snap to grid points automatically, making positioning consistent and visually clean.

### Grid Configuration

Edit `navi/src/renderer/components/DraggableWidget.jsx`:
```javascript
const GRID_SIZE = 20; // Change grid size (in pixels)
const SNAP_TO_GRID = true; // Set to false to disable snapping
```

## Next Steps

- Consider adding Whisper support for offline recognition
- Add visual grid overlay option in settings
- Implement drag handles for better UX
- Add keyboard shortcuts for widget positioning

