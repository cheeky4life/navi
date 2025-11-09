import React, { useState, useEffect, useRef } from "react";

export default function App() {
    const [messages, setMessages] = useState([]);
    const [conversationHistory, setConversationHistory] = useState([
        { 
            role: 'system', 
            content: `You are NAVI, a concise and problem-solving AI desktop assistant with computer control abilities. ALWAYS respond in English only - never translate to or use Korean or any other language. Remember conversation history and reference previous topics when relevant. Keep responses to 2-5 lines maximum. Be direct and solution-focused. When you see a screenshot, analyze it and provide actionable insights.

AVAILABLE ACTIONS:
- TYPE:<text> - Type text into the active window (ALWAYS use this when user says "type X")
- OPEN:<app> - Open an application (chrome, notepad, calculator, vscode, etc.)
- SEARCH:<query> - Search Google for a query
- PRESS:<keys> - Press keyboard shortcuts (use SendKeys format: ^c for Ctrl+C, %{TAB} for Alt+Tab)

CRITICAL: When user says "type X into Y" or "type X", you MUST:
1. First output: OPEN:<app name> (if app specified)
2. Then output: TYPE:<exact text to type>
3. Then explain what you did

Example 1:
User: "Type hello world into notepad"
NAVI: "OPEN:notepad
TYPE:hello world
Typing 'hello world' into notepad."

Example 2:
User: "Search for Python tutorials"
NAVI: "SEARCH:Python tutorials
Searching for Python tutorials on Google."

IMPORTANT: ALWAYS respond in English. Never translate to Korean.` 
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
            content: `You are NAVI, a concise and problem-solving AI desktop assistant with computer control abilities. ALWAYS respond in English only - never translate to or use Korean or any other language. Remember conversation history and reference previous topics when relevant. Keep responses to 2-5 lines maximum. Be direct and solution-focused. When you see a screenshot, analyze it and provide actionable insights.

AVAILABLE ACTIONS:
- TYPE:<text> - Type text into the active window (ALWAYS use this when user says "type X")
- OPEN:<app> - Open an application (chrome, notepad, calculator, vscode, etc.)
- SEARCH:<query> - Search Google for a query
- PRESS:<keys> - Press keyboard shortcuts (use SendKeys format: ^c for Ctrl+C, %{TAB} for Alt+Tab)

CRITICAL: When user says "type X into Y" or "type X", you MUST:
1. First output: OPEN:<app name> (if app specified)
2. Then output: TYPE:<exact text to type>
3. Then explain what you did

Example 1:
User: "Type hello world into notepad"
NAVI: "OPEN:notepad
TYPE:hello world
Typing 'hello world' into notepad."

Example 2:
User: "Search for Python tutorials"
NAVI: "SEARCH:Python tutorials
Searching for Python tutorials on Google."

IMPORTANT: ALWAYS respond in English. Never translate to Korean.` 
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

            const SPEECH_THRESHOLD = 5; // Increased threshold to reduce false positives
            const SILENCE_DURATION = 2500; // Increased to 2.5 seconds to capture full sentences

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
            } else {
                // If recording and volume is low (silence)
                if (isCurrentlyRecordingRef.current) {
                    if (!silenceTimeoutRef.current) {
                        silenceTimeoutRef.current = setTimeout(() => {
                            console.log('⏸️ Silence detected for', SILENCE_DURATION, 'ms, stopping recording');
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
            const commandRegex = /(TYPE|OPEN|SEARCH|PRESS):(.+)/g;
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
                                    // If there was an OPEN command before this, wait for app to fully load
                                    if (i > 0 && commands[i-1].action === 'OPEN') {
                                        console.log('⏳ Waiting 3s for app to open and focus...');
                                        await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
                                    }
                                    await window.electron.typeText(cmd.value);
                                    console.log('✅ Typing complete');
                                    break;
                                case 'OPEN':
                                    console.log('🚀 Opening app:', cmd.value);
                                    await window.electron.openApplication(cmd.value);
                                    console.log('✅ App opened');
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
