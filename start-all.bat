@echo off
echo ========================================
echo Starting NAVI Application
echo ========================================
echo.

echo [1/3] Starting Flask Auth Server...
start "Flask Auth Server" cmd /k "cd /d %~dp0 && python server.py"
timeout /t 2 /nobreak >nul

echo [2/3] Starting Speech Recognition Server...
start "Speech Recognition Server" cmd /k "cd /d %~dp0navi && start-speech-server.bat"
timeout /t 2 /nobreak >nul

echo [3/3] Starting Electron App...
start "NAVI Electron App" cmd /k "cd /d %~dp0navi && npm start"

echo.
echo ========================================
echo All services started!
echo ========================================
echo.
echo Services running:
echo - Flask Auth Server (http://localhost:5000)
echo - Speech Recognition (ws://localhost:8766)
echo - Electron App
echo.
echo Press any key to exit this window...
echo (The services will continue running in their own windows)
pause >nul
