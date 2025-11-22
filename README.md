# NAVI · Neural Agent for Visual Interaction

Hands-free desktop control with voice and gestures. Think of it like a real-world **Jarvis** for your computer.

## Inspiration
We wanted a digital partner that understands **intent**, not just commands. The **Jarvis-style** assistant was the spark: something that listens, sees, and acts across apps to cut through tab chaos and help people work faster, including users with limited mobility.

## What it does
Say things like:  
“Hey NAVI, **summarize this PDF and email it to Dr. Smith**.”  
NAVI reads the file, writes the summary, drafts the email, and sends it. It combines **speech recognition**, **computer vision**, and **reasoning/planning** to automate multi-step workflows.

## How we built it
- **Electron + React** for the desktop app
- **NVIDIA Nemotron** for reasoning and planning
- **NVIDIA Riva** for low-latency ASR
- **TensorRT** for gesture detection and GPU-accelerated pose estimation
- **ElevenLabs** for natural TTS
- Integrations: **Gmail**, **Google Drive**, **Notion**, plus OS-level automation

## Key features
- **Voice and gesture control** for common actions and custom workflows
- **Natural-language task chaining** with live progress
- File actions: **read**, **summarize**, **tag**, **move**, **share**
- App automation: **open**, **navigate**, **click**, **type**
- **Privacy controls** and permission prompts for sensitive actions

## Challenges
Synchronizing **voice, vision, and reasoning** in real time without lag. Managing **OS permissions** securely. Stabilizing **gesture tracking** across lighting conditions and cameras.

## Accomplishments
End-to-end workflows, not just single commands. Real-time **gesture control** runs smoothly with **TensorRT** acceleration.

## What we learned
Multimodal pipelines are hard. **Latency budgets** matter. Efficient **GPU inference** is critical for real-time UX.

## What’s next
- **Deeper OS automation** and system-level affordances
- **Mobile companion** and cross-device continuity
- **Finer-grained gestures** and calibration
- **More connectors** and a visual workflow editor

## Quick start

### Prerequisites
- **Node.js 18+**
- **NVIDIA GPU** with recent drivers
- **CUDA** and **TensorRT** installed
- **Riva** server available (or another ASR endpoint)
- **ElevenLabs** API key (optional but recommended)
- OAuth credentials for **Gmail/Drive/Notion** if you enable those connectors

### Setup
```bash
# clone
git clone https://github.com/your-org/navi.git
cd navi

# install
npm install
# or
pnpm install
