import React, { useState, useEffect, useRef } from "react";

export default function App() {
    const [messages, setMessages] = useState([]);
    const [conversationHistory, setConversationHistory] = useState([
        { 
            role: 'system', 
            content: `You are NAVI, an ACTION-ORIENTED AI desktop assistant with FULL computer control. You DON'T just advise - you DO IT. You have mouse clicking, keyboard typing, and app control. ALWAYS respond in English only. Keep responses to 2-5 lines maximum. When you see a screenshot, analyze it and ACT on it.

YOUR POWERS (use them aggressively):
- TYPE:<text> - Type anything into text apps (notepad, browsers, etc.)
- OPEN:<app> - Launch any application
- SEARCH:<query> - Search Google
- PRESS:<keys> - Keyboard shortcuts & calculator input (^c=Ctrl+C, %{TAB}=Alt+Tab, {ENTER}=Enter, numbers/operators for calc)
- CLICK:<x>,<y> - Click ANYWHERE on screen (1920x1080: center=960,540, corners=0,0 to 1920,1080)

YOUR PERSONALITY:
- NEVER say "I can't" or "I'm unable to" - TRY IT FIRST
- NEVER tell user to do something - YOU DO IT using commands
- If user asks for something, execute it immediately with commands
- Be confident and action-forward: "Opening X and typing Y" not "You can open X"
- Use multiple commands in sequence to complete complex tasks
- Always assume you CAN do it unless technically impossible

COMMAND RULES:
1. Text apps (notepad, browsers, etc.) → Use TYPE
2. Calculator → Use PRESS with {+} {-} {*} {/} {=} or {ENTER}
3. Clicks → Use CLICK with coordinates
4. After OPEN, auto 3-second delay happens before next command
5. Put each command on its own line

SPECIAL APP RULES:
- Calculator: PRESS:3{+}5{ENTER} (NOT TYPE)
- Notepad: TYPE:your text here
- Browsers: TYPE for address bar / search

Example 1 - Notepad:
User: "Open notepad and type hello world"
NAVI: "OPEN:notepad
TYPE:hello world
Opening notepad and typing your message."

Example 2 - Calculator:
User: "Open calculator and do 3 plus 5"
NAVI: "OPEN:calculator
PRESS:3{+}5{ENTER}
Opening calculator and calculating 3+5 = 8."

Example 3 - Complex code:
User: "Make a simple JavaScript program in notepad"
NAVI: "OPEN:notepad
TYPE:// Simple JavaScript Program
function greet(name) {
  console.log('Hello, ' + name + '!');
}
greet('User');
Created a basic JavaScript greeting program in notepad."

Example 3 - Click task:
User: "Click the start menu"
NAVI: "CLICK:20,1060
Clicking the Windows start button."

Example 4 - Multi-step task:
User: "Search for Python tutorials and open the first result"
NAVI: "SEARCH:Python tutorials
CLICK:960,400
Searching for Python tutorials and clicking the first result."

REMEMBER: You're a DOER not an ADVISOR. Execute commands, don't suggest them. Never say "I cannot" - just do it!` 
        }
    ]);
    const [isListening, setIsListening] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const silenceTimeoutRef = useRef(null);
    const speechTimeoutRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const streamRef = useRef(null);
    const isCurrentlyRecordingRef = useRef(false);
    const isProcessingRef = useRef(false);
    const isListeningRef = useRef(false);
    
    // Store conversation history in a ref to avoid stale closure issues
    const conversationHistoryRef = useRef([
        { 
            role: 'system', 
            content: `You are NAVI, an ACTION-ORIENTED AI desktop assistant with FULL computer control. You DON'T just advise - you DO IT. You have mouse clicking, keyboard typing, and app control. ALWAYS respond in English only. Keep responses to 2-5 lines maximum. When you see a screenshot, analyze it and ACT on it.

YOUR POWERS (use them aggressively):
- TYPE:<text> - Type anything into text apps (notepad, browsers, etc.)
- OPEN:<app> - Launch any application
- SEARCH:<query> - Search Google
- PRESS:<keys> - Keyboard shortcuts & calculator input (^c=Ctrl+C, %{TAB}=Alt+Tab, {ENTER}=Enter, numbers/operators for calc)
- CLICK:<x>,<y> - Click ANYWHERE on screen (1920x1080: center=960,540, corners=0,0 to 1920,1080)

YOUR PERSONALITY:
- NEVER say "I can't" or "I'm unable to" - TRY IT FIRST
- NEVER tell user to do something - YOU DO IT using commands
- If user asks for something, execute it immediately with commands
- Be confident and action-forward: "Opening X and typing Y" not "You can open X"
- Use multiple commands in sequence to complete complex tasks
- Always assume you CAN do it unless technically impossible

COMMAND RULES:
1. Text apps (notepad, browsers, etc.) → Use TYPE
2. Calculator → Use PRESS with {+} {-} {*} {/} {=} or {ENTER}
3. Clicks → Use CLICK with coordinates
4. After OPEN, auto 3-second delay happens before next command
5. Put each command on its own line

SPECIAL APP RULES:
- Calculator: PRESS:3{+}5{ENTER} (NOT TYPE)
- Notepad: TYPE:your text here
- Browsers: TYPE for address bar / search

Example 1 - Notepad:
User: "Open notepad and type hello world"
NAVI: "OPEN:notepad
TYPE:hello world
Opening notepad and typing your message."

Example 2 - Calculator:
User: "Open calculator and do 3 plus 5"
NAVI: "OPEN:calculator
PRESS:3{+}5{ENTER}
Opening calculator and calculating 3+5 = 8."

Example 3 - Complex code:
User: "Make a simple JavaScript program in notepad"
NAVI: "OPEN:notepad
TYPE:// Simple JavaScript Program
function greet(name) {
  console.log('Hello, ' + name + '!');
}
greet('User');
Created a basic JavaScript greeting program in notepad."

Example 4 - Click task:
User: "Click the start menu"
NAVI: "CLICK:20,1060
Clicking the Windows start button."

Example 5 - Web search:
User: "Search for Python tutorials"
NAVI: "SEARCH:Python tutorials
Searching for Python tutorials on Google."

REMEMBER: You're a DOER not an ADVISOR. Execute commands, don't suggest them. Never say "I cannot" - just do it!` 
        }
    ]);

    const continuousVoiceDetection = (stream, analyser) => {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const checkAudioLevel = () => {
            if (!isListeningRef.current || isProcessingRef.current) {
                requestAnimationFrame(checkAudioLevel);
                return;
            }

            analyser.getByteTimeDomainData(dataArray);
            
            // Calculate average volume
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                const normalized = (dataArray[i] - 128) / 128;
                sum += normalized * normalized;
            }
            const rms = Math.sqrt(sum / bufferLength);
            const volume = rms * 100;

            const SPEECH_THRESHOLD = 10; // Start recording when volume > 10
            const SILENCE_THRESHOLD = 10; // Stop recording when volume < 10 for 2.5s
            const SILENCE_DURATION = 2500; // 2.5 seconds of silence to stop recording

            // Debug: Log volume levels occasionally
            if (Math.random() < 0.02) { // Log ~2% of the time
                console.log('Volume level:', volume.toFixed(2), 'Threshold:', SPEECH_THRESHOLD);
            }

            // If volume is above threshold (speech detected)
            if (volume > SPEECH_THRESHOLD) {
                // Start recording if not already recording
                if (!isCurrentlyRecordingRef.current && !isProcessingRef.current) {
                    console.log('🎤 Speech detected! Volume:', volume.toFixed(2), '> Threshold:', SPEECH_THRESHOLD);
                    isCurrentlyRecordingRef.current = true;
                    startRecording(stream);
                }
                
                // Clear silence timeout since there's sound
                if (silenceTimeoutRef.current) {
                    clearTimeout(silenceTimeoutRef.current);
                    silenceTimeoutRef.current = null;
                }
            } else if (volume < SILENCE_THRESHOLD) {
                // If recording and volume is below threshold (silence)
                if (isCurrentlyRecordingRef.current) {
                    if (!silenceTimeoutRef.current) {
                        console.log('🔇 Silence detected (volume:', volume.toFixed(2), '< threshold:', SILENCE_THRESHOLD, ')');
                        silenceTimeoutRef.current = setTimeout(() => {
                            console.log('⏸️ Silence sustained for', SILENCE_DURATION, 'ms, stopping recording');
                            stopRecording();
                            isCurrentlyRecordingRef.current = false;
                        }, SILENCE_DURATION);
                    }
                }
            }

            requestAnimationFrame(checkAudioLevel);
        };

        checkAudioLevel();
    };

    const initializeContinuousListening = async () => {
        try {
            console.log('Requesting microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            console.log('Microphone access granted!');

            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
            source.connect(analyser);
            
            audioContextRef.current = audioContext;
            analyserRef.current = analyser;

            setIsListening(true);
            isListeningRef.current = true;
            console.log('Continuous listening started. Speak now!');
            continuousVoiceDetection(stream, analyser);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            setMessages([{ type: 'error', text: 'Microphone access denied' }]);
        }
    };

    const startRecording = (stream) => {
        try {
            console.log('🎤 Starting recording...');
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            
            setIsRecording(true);

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                console.log('🛑 Recording stopped, processing...');
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await processAudio(audioBlob);
            };

            mediaRecorder.start();
        } catch (error) {
            console.error('Error starting recording:', error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            console.log('⏹️ Stopping recording due to silence...');
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            
            // Clear silence timeout
            if (silenceTimeoutRef.current) {
                clearTimeout(silenceTimeoutRef.current);
                silenceTimeoutRef.current = null;
            }
        }
    };

    const processAudio = async (audioBlob) => {
        setIsProcessing(true);
        isProcessingRef.current = true;
        console.log('📝 Starting audio processing...');
        try {
            // Step 1: Convert audio to base64
            console.log('Converting audio to base64...');
            const arrayBuffer = await audioBlob.arrayBuffer();
            const base64Audio = btoa(
                new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
            );

            // Step 2: Transcribe with Whisper
            console.log('🎯 Sending to Whisper for transcription...');
            const transcription = await window.electron.transcribeAudio(base64Audio);
            console.log('✅ Transcription received:', transcription);
            
            if (!transcription) {
                throw new Error('No transcription received');
            }

            // Filter out non-English text (Korean, Chinese, Japanese, etc.)
            const hasNonEnglish = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f\uac00-\ud7af]/g.test(transcription);
            if (hasNonEnglish) {
                console.log('⚠️ Non-English text detected, ignoring:', transcription);
                throw new Error('Please speak in English only');
            }

            // Debug command: Show memory
            if (transcription.toLowerCase().includes('show memory') || transcription.toLowerCase().includes('what do you remember')) {
                console.log('🧠 CONVERSATION MEMORY:', conversationHistoryRef.current);
            }

            // Add user message to display
            setMessages(prev => [...prev, { type: 'user', text: transcription }]);

            // Check if user wants a screenshot
            const needsScreenshot = transcription.toLowerCase().includes('screenshot') || 
                                   transcription.toLowerCase().includes('screen shot') ||
                                   transcription.toLowerCase().includes('look at my screen') ||
                                   transcription.toLowerCase().includes('see my screen') ||
                                   transcription.toLowerCase().includes('what do you see');

            let screenshotBase64 = null;
            if (needsScreenshot) {
                console.log('📸 Screenshot requested! Capturing screen...');
                setMessages(prev => [...prev, { type: 'system', text: '📸 Capturing screenshot...' }]);
                try {
                    screenshotBase64 = await window.electron.captureScreen();
                    console.log('✅ Screenshot captured');
                    setMessages(prev => prev.filter(msg => msg.text !== '📸 Capturing screenshot...'));
                } catch (error) {
                    console.error('❌ Screenshot failed:', error);
                    setMessages(prev => [...prev.filter(msg => msg.text !== '📸 Capturing screenshot...'), 
                                        { type: 'error', text: '❌ Screenshot failed' }]);
                }
            }

            // Add to conversation history with optional screenshot
            let userMessage = { role: 'user', content: transcription };
            
            // If screenshot available, add it to the message for GPT-4 Vision
            if (screenshotBase64) {
                userMessage.content = [
                    { type: 'text', text: transcription },
                    { 
                        type: 'image_url', 
                        image_url: { 
                            url: `data:image/png;base64,${screenshotBase64}`,
                            detail: 'high' // High detail for better analysis
                        } 
                    }
                ];
            }

            // Use ref to get current history (avoids stale state)
            let newHistory = [...conversationHistoryRef.current, userMessage];
            
            // Trim history if too long (keep last 20 messages + system prompt)
            // This prevents hitting token limits while maintaining context
            if (newHistory.length > 21) {
                newHistory = [newHistory[0], ...newHistory.slice(-20)]; // Keep system + last 20
                console.log('📝 Trimmed conversation history to last 20 messages');
            }
            
            // Update both ref and state
            conversationHistoryRef.current = newHistory;
            setConversationHistory(newHistory);

            // Step 3: Get GPT-4 response
            console.log('🤖 Sending to GPT-4... (History length:', newHistory.length - 1, 'messages)');
            console.log('📜 Conversation history being sent:', newHistory.map(msg => ({
                role: msg.role,
                content: typeof msg.content === 'string' ? msg.content.substring(0, 50) + '...' : '[image+text]'
            })));
            const aiResponse = await window.electron.chatGPT(newHistory);
            console.log('✅ GPT-4 response received:', aiResponse);

            // Clean response for display (remove command markers)
            const displayResponse = aiResponse.replace(/(?:TYPE|OPEN|SEARCH|PRESS):.+\n?/g, '').trim();

            // Add AI response to display
            setMessages(prev => [...prev, { type: 'ai', text: displayResponse || aiResponse }]);

            // Update conversation history with AI response
            const updatedHistory = [...newHistory, { role: 'assistant', content: aiResponse }];
            conversationHistoryRef.current = updatedHistory;
            setConversationHistory(updatedHistory);
            console.log('💾 Total conversation messages:', updatedHistory.length - 1);

            // Step 4: Convert AI response to speech and play it
            console.log('🔊 Converting to speech...');
            const audioBase64 = await window.electron.textToSpeech(displayResponse || aiResponse);
            console.log('✅ Audio received, playing...');
            
            // Convert base64 to audio and play
            const ttsAudioBlob = new Blob(
                [Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))],
                { type: 'audio/mpeg' }
            );
            const audioUrl = URL.createObjectURL(ttsAudioBlob);
            const audio = new Audio(audioUrl);
            
            // Play audio and execute commands in parallel
            const audioPromise = audio.play();
            console.log('🎵 Audio playing...');

            // Parse and execute computer control commands while audio plays
            const commandRegex = /(TYPE|OPEN|SEARCH|PRESS|CLICK):(.+)/g;
            const commands = [];
            let match;
            while ((match = commandRegex.exec(aiResponse)) !== null) {
                commands.push({ action: match[1], value: match[2].trim() });
            }

            // Execute commands asynchronously (don't block audio)
            if (commands.length > 0) {
                console.log('🎮 Executing commands:', commands);
                // Execute in background without awaiting
                (async () => {
                    for (let i = 0; i < commands.length; i++) {
                        const cmd = commands[i];
                        try {
                            switch (cmd.action) {
                                case 'TYPE':
                                    console.log('⌨️ Typing:', cmd.value);
                                    // If there was an OPEN command before this, wait for app to fully load and focus
                                    if (i > 0 && commands[i-1].action === 'OPEN') {
                                        console.log('⏳ Waiting 3s for app to open...');
                                        await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
                                        // Click in center to ensure focus
                                        console.log('🖱️ Clicking app to focus...');
                                        await window.electron.clickMouse(960, 540);
                                        await new Promise(resolve => setTimeout(resolve, 500)); // Short delay after click
                                    }
                                    await window.electron.typeText(cmd.value);
                                    console.log('✅ Typing complete');
                                    break;
                                case 'OPEN':
                                    console.log('🚀 Opening app:', cmd.value);
                                    await window.electron.openApplication(cmd.value);
                                    console.log('✅ App opened');
                                    // If next command is TYPE, the click will happen before typing
                                    // If next command is not TYPE, wait and click to ensure app is focused
                                    if (i + 1 < commands.length && commands[i + 1].action !== 'TYPE') {
                                        await new Promise(resolve => setTimeout(resolve, 2000));
                                        console.log('🖱️ Clicking app to ensure focus...');
                                        await window.electron.clickMouse(960, 540);
                                    }
                                    break;
                                case 'SEARCH':
                                    console.log('🔍 Searching:', cmd.value);
                                    await window.electron.searchWeb(cmd.value);
                                    console.log('✅ Search opened');
                                    break;
                                case 'PRESS':
                                    console.log('🎹 Pressing keys:', cmd.value);
                                    await window.electron.pressKeys(cmd.value);
                                    console.log('✅ Keys pressed');
                                    break;
                                case 'CLICK':
                                    const coords = cmd.value.split(',').map(c => parseInt(c.trim()));
                                    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                                        console.log('🖱️ Clicking at:', coords[0], coords[1]);
                                        await window.electron.clickMouse(coords[0], coords[1]);
                                        console.log('✅ Click complete');
                                    } else {
                                        console.error('❌ Invalid click coordinates:', cmd.value);
                                    }
                                    break;
                            }
                        } catch (error) {
                            console.error(`❌ Failed to execute ${cmd.action}:`, error);
                        }
                    }
                })();
            }

            // Wait for audio to finish
            await audioPromise;
            console.log('🎵 Audio playback complete!');

        } catch (error) {
            console.error('❌ Processing error:', error);
            setMessages(prev => [...prev, { type: 'error', text: `Error: ${error.message}` }]);
        } finally {
            setIsProcessing(false);
            isProcessingRef.current = false;
            console.log('✅ Processing complete, ready for next input');
        }
    };

    useEffect(() => {
        // Start continuous listening on mount
        initializeContinuousListening();
        
        return () => {
            // Cleanup on unmount
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            if (silenceTimeoutRef.current) {
                clearTimeout(silenceTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="output-bar">
            <div className="mascot-container">
                <img src="navi.svg" alt="Navi Mascot" className="mascot-image" />
            </div>
            <div className="output-content">
                {messages.length === 0 ? (
                    <p className="placeholder">
                        {isListening ? 'Listening... Start speaking anytime' : 'Initializing...'}
                    </p>
                ) : (
                    <div className="messages">
                        {messages.slice(-2).map((msg, idx) => (
                            <p key={idx} className={msg.type}>
                                {msg.type === 'user' && <strong>You: </strong>}
                                {msg.type === 'ai' && <strong>AI: </strong>}
                                {msg.text}
                            </p>
                        ))}
                    </div>
                )}
                {isRecording && <span className="recording-indicator">● Recording...</span>}
                {isProcessing && <span className="recording-indicator">⟳ Processing...</span>}
                {isListening && !isRecording && !isProcessing && messages.length > 0 && (
                    <span className="status-indicator" style={{position: 'absolute', right: '20px', fontSize: '0.75rem', color: '#10b981'}}>
                        👂 Listening
                    </span>
                )}
            </div>
        </div>
    );
}
