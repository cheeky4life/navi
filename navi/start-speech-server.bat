@echo off
echo Starting Speech Recognition Server...
echo.
echo Make sure you have installed dependencies:
echo   pip install -r python-clients\requirements.txt
echo.

cd /d "%~dp0navi\python-clients\scripts\voice_ai"

echo Current directory: %CD%
echo.
echo Starting server on ws://localhost:8766
echo Press Ctrl+C to stop the server
echo.

python speech_recognition_server.py

pause

