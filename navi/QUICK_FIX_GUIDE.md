# Quick Fix Guide - Dragging & Speech Recognition

## Issue 1: Dragging Not Working

**Fixed!** The dragging system now:
- Allows dragging from **anywhere on the widget** (not just the header)
- Still prevents dragging when clicking buttons/interactive elements
- Uses grid-based snapping for smooth movement

**To test:**
1. Click and hold anywhere on a widget (like the Documents widget)
2. Drag it around - it should move smoothly and snap to a 20px grid

## Issue 2: Speech Recognition Connection Failed

**Fixed!** The app now:
- Shows clear error messages when the server isn't running
- Has a 3-second connection timeout
- Provides helpful instructions in the error message

**To fix the connection:**

### Option 1: Start the Python Server (Recommended)

1. Open a terminal and navigate to:
```bash
cd navi/python-clients/scripts/voice_ai
```

2. Install dependencies (if not already done):
```bash
pip install -r ../../requirements.txt
```

3. Start the speech recognition server:
```bash
python speech_recognition_server.py
```

You should see:
```
Starting Speech Recognition WebSocket server on localhost:8766
Speech Recognition server is running on ws://localhost:8766
Waiting for connections...
```

4. Keep this terminal open and run the Electron app:
```bash
cd navi
npm run start
```

### Option 2: Use Web Speech API Fallback (Temporary)

If you can't run the Python server right now, the app will show an error but won't crash. You can:
- Wait for the connection timeout (3 seconds)
- The error message will tell you to start the server
- The app will continue to work, just without voice recognition

## Troubleshooting

### "Connection timeout" error
- Make sure the Python server is running
- Check that port 8766 is not blocked by firewall
- Verify the server started without errors

### Dragging still not working
- Make sure you're clicking on the widget itself (not outside it)
- Try clicking on the header area (where it says "Documents")
- Check browser console for any JavaScript errors

### Python server won't start
- Make sure Python 3.7+ is installed
- Install dependencies: `pip install -r ../../requirements.txt`
- Check for port conflicts (another app using port 8766)

## Next Steps

Once both are working:
1. **Dragging**: Widgets should move smoothly with grid snapping
2. **Speech Recognition**: Click the mic button and speak - transcripts should appear

If issues persist, check the browser console (F12) for detailed error messages.

