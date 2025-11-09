# NAVI - ElevenLabs Conversational AI Setup

## Overview
NAVI now uses ElevenLabs' realtime Conversational AI API for voice interactions. This provides:
- Real-time speech-to-text transcription
- AI-powered conversational responses
- Text-to-speech playback of AI responses
- Natural conversation flow

## Setup Instructions

### 1. Get Your ElevenLabs API Key
1. Go to https://elevenlabs.io/app/settings/api-keys
2. Create a new API key or copy an existing one

### 2. Create a Conversational AI Agent
1. Go to https://elevenlabs.io/app/conversational-ai
2. Click "Create Agent"
3. Configure your agent with:
   - Name: "NAVI" (or whatever you prefer)
   - Voice: Choose a voice you like
   - System Prompt: Define how the AI should behave (e.g., "You are NAVI, a helpful AI desktop assistant")
   - Knowledge Base: (Optional) Add any custom knowledge
4. Save your agent and **copy the Agent ID**

### 3. Configure Environment Variables
1. Create a `.env` file in the project root (`c:\Users\xxsoi\Desktop\Navi\navi\navi\.env`)
2. Add your credentials:

```env
ELEVENLABS_API_KEY=sk_your_api_key_here
ELEVENLABS_AGENT_ID=your_agent_id_here
```

### 4. Run the App
```bash
npm start
```

## How to Use

1. **Start Speaking**: Hold down the **SPACEBAR** to speak
2. **Stop Speaking**: Release the **SPACEBAR** when done
3. **View Conversation**: The last 2 messages appear in the output bar:
   - **You:** Your transcribed speech
   - **AI:** The AI's response

## Features

- ✅ Real-time speech recognition
- ✅ Natural conversation with AI
- ✅ Voice responses from AI (played automatically)
- ✅ Transparent floating bar interface
- ✅ Always on top display
- ✅ Hold spacebar to speak

## How It Works

1. When you hold SPACEBAR, your microphone activates
2. ElevenLabs' API transcribes your speech in real-time
3. The transcription is sent to your configured AI agent
4. The AI processes your message and generates a response
5. The response is:
   - Displayed as text in the output bar
   - Spoken back to you using text-to-speech
6. The conversation continues naturally

## Troubleshooting

### "API key not configured"
- Make sure you created the `.env` file in the correct location
- Verify your API key is valid and not expired

### "Failed to connect"
- Check your internet connection
- Verify your Agent ID is correct
- Make sure your ElevenLabs subscription is active

### No audio playback
- Check your system audio settings
- Ensure the app has microphone permissions
- Try adjusting your volume

### Messages not appearing
- The output bar only shows the last 2 messages
- Check the browser console (Ctrl+Shift+I) for detailed logs

## Notes

- The app uses **realtime conversational AI**, not batch file processing
- This means conversations are more natural and responsive
- Audio is streamed bidirectionally for lower latency
- The AI remembers context within the conversation session
