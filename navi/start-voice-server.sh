#!/bin/bash
# Start the Python Voice AI WebSocket Server
# This should be run before starting the Electron app

echo "Starting Voice AI Server..."
cd python-clients/scripts/voice_ai
python voice_ai_server.py

