# Debugging Voice Capture Issues

## Quick Debug Steps

### 1. Check Browser Console (F12)

When you click the microphone button, you should see these logs in order:

1. **🎙️ Starting speech recognition** - Recognition is starting
2. **🎤 Microphone stream active** - Microphone is working
3. **✅ Speech recognition start() called** - Recognition started successfully
4. **Speech recognition started** - onstart event fired
5. **🎯 Speech recognition result event** - Audio is being processed
6. **📝 Processed transcript** - Text is being extracted
7. **🎤 Received transcript** - Transcript reached the app
8. **🔊 FINAL TRANSCRIPT RECEIVED** - Final text ready
9. **📤 Sending final transcript to WebSocket server** - Sending to AI

### 2. Common Issues

#### Issue: No "🎯 Speech recognition result event" logs
**Problem**: Speech recognition isn't receiving audio
**Solutions**:
- Check Windows microphone privacy settings
- Ensure microphone is not muted in Windows
- Try a different microphone
- Check if microphone works in other apps

#### Issue: "⚠️ No active audio tracks found!"
**Problem**: Microphone stream is not active
**Solutions**:
- Grant microphone permission when prompted
- Check Windows Settings → Privacy → Microphone
- Restart the app

#### Issue: "⚠️ WebSocket not ready"
**Problem**: WebSocket server isn't running
**Solutions**:
- Start the Python server: `.\start-voice-server.bat`
- Check if port 8765 is available
- Voice will still work, but AI responses won't come through WebSocket

#### Issue: Transcripts appear but no AI response
**Problem**: WebSocket connection issue
**Solutions**:
- Check if server is running
- Look for "📤 Sending to WebSocket" logs
- Check server terminal for errors

### 3. Test Microphone

1. Open Windows Settings → Privacy → Microphone
2. Ensure "Allow apps to access your microphone" is ON
3. Test microphone in Windows Voice Recorder
4. If it works there, the issue is in the app

### 4. Check WebSocket Connection

Look for these indicators on the mic button:
- **Red dot**: Server not connected (voice still works)
- **Yellow dot**: Connecting
- **Green dot**: Connected and ready

### 5. Enable Verbose Logging

All logs are prefixed with emojis for easy identification:
- 🎤 = Microphone/audio
- 🎙️ = Speech recognition
- 📝 = Transcript processing
- 📤 = Sending data
- 📡 = WebSocket communication
- ✅ = Success
- ⚠️ = Warning
- ❌ = Error

### 6. Manual Test

1. Click mic button
2. Speak clearly: "Hello, this is a test"
3. Watch console for logs
4. Check if transcript appears in the "You said" panel
5. Check if AI response appears (if server is running)

## Still Not Working?

Share the console logs (especially the emoji-prefixed ones) and I can help diagnose further!

