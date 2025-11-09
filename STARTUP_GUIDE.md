# NAVI Quick Start Guide

## 🚀 Starting the Application

### Prerequisites
1. Python 3.8+ installed
2. Node.js 16+ installed
3. Required Python packages (see below)

### Step 1: Install Python Dependencies
```powershell
# Navigate to project root
cd C:\Users\mayoa\navi

# Install Python requirements
pip install -r requirements.txt

# Install speech recognition dependencies
pip install SpeechRecognition pyaudio websockets
```

### Step 2: Start Servers (Choose One Method)

#### Method A: Using Batch Files (Recommended)
Open **3 separate terminals**:

**Terminal 1 - Flask Auth Server:**
```powershell
cd C:\Users\mayoa\navi
python server.py
```
Should see: `Running on http://0.0.0.0:5000`

**Terminal 2 - Speech Recognition Server:**
```powershell
cd C:\Users\mayoa\navi\navi
start-speech-server.bat
```
Should see: `WebSocket server started on ws://localhost:8766`

**Terminal 3 - Electron App:**
```powershell
cd C:\Users\mayoa\navi\navi
npm start
```

#### Method B: Manual Start
```powershell
# Terminal 1 - Flask
cd C:\Users\mayoa\navi
python server.py

# Terminal 2 - Speech Recognition
cd C:\Users\mayoa\navi\navi\python-clients\scripts\voice_ai
python speech_recognition_server.py

# Terminal 3 - Electron
cd C:\Users\mayoa\navi\navi
npm start
```

### Step 3: Verify Everything Works

✅ **Flask Server**: Open http://localhost:5000 (should see JSON response)
✅ **Speech Server**: Check Terminal 2 for WebSocket connection message
✅ **Electron App**: Should launch and show login page

---

## 🐛 Troubleshooting

### Issue: Window won't drag
**Solution**: The window should now be draggable. Make sure you're clicking on areas that are NOT marked as `.interactive-area` in the CSS.

**How dragging works:**
- Areas with class `.interactive-area` = clickable/interactive
- Other areas = draggable
- The app automatically handles mouse events

### Issue: Speech recognition not working
**Symptoms**: Microphone button doesn't respond or shows error

**Solutions:**

1. **Check if speech server is running**
   ```powershell
   # In Terminal 2, you should see:
   # "WebSocket server started on ws://localhost:8766"
   ```

2. **Verify Python packages**
   ```powershell
   pip install SpeechRecognition pyaudio websockets
   ```

3. **Check microphone permissions**
   - Windows Settings → Privacy → Microphone
   - Allow desktop apps to access microphone

4. **Test microphone**
   - Open Windows Sound settings
   - Test Recording tab
   - Make sure default microphone is selected

5. **Check browser console**
   - Press F12 in the Electron app
   - Look for WebSocket connection errors
   - Should see: "✅ Connected to speech recognition server"

6. **PyAudio installation issues (Windows)**
   ```powershell
   # If pip install pyaudio fails, try:
   pip install pipwin
   pipwin install pyaudio
   
   # Or download wheel from:
   # https://www.lfd.uci.edu/~gohlke/pythonlibs/#pyaudio
   ```

### Issue: Auth0 login not working
**Solution**: See `AUTH0_SETUP.md` for complete Auth0 configuration

Quick checklist:
- [ ] `.env` file created with Auth0 credentials
- [ ] Flask server running on port 5000
- [ ] Auth0 callback URLs configured correctly

### Issue: Window controls (minimize/maximize/close) not working
**Solution**: This has been fixed! The window control handlers are now properly connected.

---

## 📊 System Status Indicators

| Indicator | Meaning |
|-----------|---------|
| 🟢 Green dot | All systems operational |
| 🟡 Yellow dot | Partial functionality (some servers offline) |
| 🔴 Red dot | Critical error |

**What each service does:**
- **Flask Server (5000)**: Handles Auth0 authentication
- **Speech Server (8766)**: Processes voice commands
- **Electron App (3000)**: Main UI

---

## 🎤 Using Voice Commands

1. Click the microphone button
2. Wait for "Listening..." status
3. Speak your command clearly
4. Voice will automatically be transcribed
5. AI will process and respond

**Supported commands:**
- General questions (handled by Gemini AI)
- System commands (open apps, files, etc.)
- Document queries (if documents are uploaded)

---

## 🔧 Development Tips

### Hot Reload
- React components: Auto-reload on save
- Main process changes: Restart app (`Ctrl+C` then `npm start`)
- Python server changes: Restart server

### Debugging
- **Electron**: Press `F12` for DevTools
- **Flask**: Check terminal output
- **Speech Server**: Check WebSocket logs in terminal

### Clear Cache
```powershell
# Clear Electron cache
cd C:\Users\mayoa\navi\navi
rm -r node_modules/.cache
npm start
```

---

## 📝 Configuration Files

| File | Purpose |
|------|---------|
| `.env` | Auth0 and API credentials |
| `navi/package.json` | Node.js dependencies |
| `requirements.txt` | Python dependencies |
| `server.py` | Flask authentication server |

---

## 🔗 Port Reference

| Port | Service |
|------|---------|
| 3000 | Electron Dev Server |
| 5000 | Flask Auth Server |
| 8766 | Speech Recognition WebSocket |

---

## 💡 Quick Commands

```powershell
# Install all dependencies
pip install -r requirements.txt
cd navi && npm install

# Start everything
# Terminal 1
python server.py

# Terminal 2
cd navi
start-speech-server.bat

# Terminal 3
cd navi
npm start

# Stop everything
Ctrl+C in each terminal
```

---

## ✅ Success Checklist

- [ ] Python dependencies installed
- [ ] Node.js dependencies installed
- [ ] `.env` file configured
- [ ] Flask server running (port 5000)
- [ ] Speech server running (port 8766)
- [ ] Electron app launches
- [ ] Can login with Auth0
- [ ] Window can be dragged
- [ ] Microphone button works
- [ ] Voice transcription appears
- [ ] Window controls work (min/max/close)

---

## 🆘 Still Having Issues?

1. Check all three terminals for error messages
2. Verify all ports are available (not used by other apps)
3. Make sure Python and Node.js are in PATH
4. Try restarting all services
5. Check the browser console (F12) for errors
6. Review server logs for connection issues

**Common Error Messages:**

| Error | Solution |
|-------|----------|
| "Port 5000 already in use" | Stop other Flask apps or change port |
| "WebSocket connection failed" | Start speech server first |
| "Auth0 not configured" | Create `.env` file with credentials |
| "Module not found" | Run `pip install -r requirements.txt` |
| "Cannot find module" | Run `npm install` in navi folder |
