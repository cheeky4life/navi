@echo off
REM Start the Python Voice AI WebSocket Server
REM This should be run before starting the Electron app

echo Starting Voice AI Server...
cd python-clients\scripts\voice_ai
python voice_ai_server.py
pause

