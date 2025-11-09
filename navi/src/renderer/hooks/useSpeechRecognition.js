import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for speech recognition with silence detection
 * @param {Object} options - Configuration options
 * @param {Function} options.onTranscript - Callback when transcript is updated
 * @param {Function} options.onFinalTranscript - Callback when final transcript is received
 * @param {number} options.silenceTimeout - Milliseconds of silence before auto-stop (default: 3000)
 * @param {string} options.language - Language for recognition (default: 'en-US')
 * @returns {Object} - { isListening, startListening, stopListening, error, transcript }
 */
export function useSpeechRecognition({
    onTranscript,
    onFinalTranscript,
    silenceTimeout = 3000,
    language = 'en-US',
}) {
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState(null);
    const [transcript, setTranscript] = useState('');
    const [hasPermission, setHasPermission] = useState(false);

    const recognitionRef = useRef(null);
    const silenceTimerRef = useRef(null);
    const lastSpeechTimeRef = useRef(null);
    const isFinalRef = useRef(false);
    const isListeningRef = useRef(false);
    const stopListeningRef = useRef(null);
    const onTranscriptRef = useRef(onTranscript);
    const onFinalTranscriptRef = useRef(onFinalTranscript);
    const streamRef = useRef(null);
    const hasReceivedSpeechRef = useRef(false);
    const accumulatedFinalTranscriptRef = useRef(''); // Accumulate final transcripts like HTML client

    // Update callback refs when they change
    useEffect(() => {
        onTranscriptRef.current = onTranscript;
        onFinalTranscriptRef.current = onFinalTranscript;
    }, [onTranscript, onFinalTranscript]);

    // Initialize speech recognition
    useEffect(() => {
        let cleanup = () => { };

        const initializeSpeechRecognition = async () => {
            try {
                console.log('Starting speech recognition initialization...');

                // Check if browser supports speech recognition
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

                if (!SpeechRecognition) {
                    throw new Error('Speech Recognition API not found');
                }

                // Create recognition instance
                recognitionRef.current = new SpeechRecognition();
                const recognition = recognitionRef.current;

                // Configure recognition
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = language;
                recognition.maxAlternatives = 1;

                // Set up event handlers
                recognition.onerror = (event) => {
                    // Log error details for debugging
                    console.log('Speech Recognition Error:', event.error, {
                        error: event.error,
                        message: event.message,
                        type: event.type,
                        timeStamp: event.timeStamp,
                        isListening: isListeningRef.current
                    });
                    
                    // Clear silence timer on error (except for non-critical errors)
                    if (silenceTimerRef.current && 
                        event.error !== 'network' && 
                        event.error !== 'no-speech') {
                        clearTimeout(silenceTimerRef.current);
                        silenceTimerRef.current = null;
                    }
                    
                    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                        console.error('Microphone access denied by user or system');
                        setError('Microphone access denied. Please allow microphone access in your browser/system settings.');
                        setIsListening(false);
                        isListeningRef.current = false;
                        // Stop stream on permission error
                        if (streamRef.current) {
                            streamRef.current.getTracks().forEach(track => track.stop());
                            streamRef.current = null;
                        }
                    } else if (event.error === 'no-speech') {
                        console.log('No speech detected - this is normal when starting or during silence');
                        // Don't set error for no-speech, it's normal
                        // CRITICAL: Don't stop listening - let it continue
                        // The onend handler will restart if needed
                    } else if (event.error === 'aborted') {
                        console.log('Recognition aborted');
                        // CRITICAL FIX: Don't stop if we're still supposed to be listening
                        // Aborted can happen during restart, so check if we should continue
                        if (isListeningRef.current) {
                            console.log('Recognition aborted but should continue - will restart in onend');
                            // Let onend handler restart it
                        } else {
                            setIsListening(false);
                        }
                        // Don't set error for aborted, it might be intentional or during restart
                    } else if (event.error === 'network') {
                        console.warn('Network error in speech recognition - this is often non-critical');
                        // Network errors are often non-critical - don't stop
                        // The OnSizeReceived error is a known Chromium issue and can be ignored
                        // Network errors typically don't cause recognition to end, but if they do,
                        // the onend handler will restart if we're still supposed to be listening
                        // Don't set error state or stop listening for network errors
                        return; // Exit early, don't process further
                    } else if (event.error === 'audio-capture') {
                        console.error('Audio capture error - microphone may not be available');
                        setError('Microphone not available. Please check your microphone connection.');
                        setIsListening(false);
                        isListeningRef.current = false;
                        if (streamRef.current) {
                            streamRef.current.getTracks().forEach(track => track.stop());
                            streamRef.current = null;
                        }
                    } else {
                        console.error(`Recognition error: ${event.error}`);
                        // Only set error for critical errors
                        // Don't stop listening for non-critical errors - let onend restart
                        if (event.error !== 'no-speech' && event.error !== 'aborted' && event.error !== 'network') {
                            setError(`Recognition error: ${event.error}`);
                            // Only stop for truly critical errors
                            if (event.error === 'bad-grammar' || event.error === 'language-not-supported') {
                                // These are critical and we should stop
                                setIsListening(false);
                                isListeningRef.current = false;
                            }
                        }
                    }
                };

                recognition.onstart = () => {
                    console.log('Speech recognition started');
                    // Ensure we're marked as listening
                    // Don't override if we're already set to listening (from startListening)
                    if (!isListeningRef.current) {
                        isListeningRef.current = true;
                    }
                    setIsListening(true);
                    // Reset speech detection flag and accumulated transcript
                    hasReceivedSpeechRef.current = false;
                    accumulatedFinalTranscriptRef.current = '';
                    // Clear any existing silence timer - don't start it yet
                    if (silenceTimerRef.current) {
                        clearTimeout(silenceTimerRef.current);
                        silenceTimerRef.current = null;
                    }
                    // Don't start silence timer here - wait for actual speech
                };

                recognition.onend = () => {
                    console.log('Speech recognition ended, isListeningRef:', isListeningRef.current);
                    
                    // CRITICAL FIX: If we're still supposed to be listening, restart recognition
                    // The Web Speech API can end prematurely (especially after network errors), so we need to restart it
                    if (isListeningRef.current) {
                        console.log('Recognition ended but we should still be listening - restarting...');
                        // Small delay before restart to avoid rapid restart loops
                        // Also gives time for any network errors to clear
                        setTimeout(() => {
                            if (isListeningRef.current && recognitionRef.current && streamRef.current) {
                                try {
                                    // Verify stream is still active before restarting
                                    const activeTracks = streamRef.current.getAudioTracks().filter(t => 
                                        t.readyState === 'live' && t.enabled && !t.muted
                                    );
                                    
                                    if (activeTracks.length === 0) {
                                        console.warn('No active audio tracks, cannot restart recognition');
                                        setIsListening(false);
                                        isListeningRef.current = false;
                                        return;
                                    }
                                    
                                    console.log('Restarting speech recognition...');
                                    recognitionRef.current.start();
                                } catch (restartError) {
                                    console.error('Error restarting recognition:', restartError);
                                    // If restart fails, try one more time after a longer delay
                                    if (restartError.name === 'InvalidStateError') {
                                        // Recognition might be in a weird state, wait longer
                                        setTimeout(() => {
                                            if (isListeningRef.current && recognitionRef.current) {
                                                try {
                                                    recognitionRef.current.start();
                                                } catch (e) {
                                                    console.error('Second restart attempt failed:', e);
                                                    setIsListening(false);
                                                    isListeningRef.current = false;
                                                }
                                            }
                                        }, 500);
                                    } else {
                                        // Other errors - stop listening
                                        setIsListening(false);
                                        isListeningRef.current = false;
                                        if (streamRef.current) {
                                            streamRef.current.getTracks().forEach(track => track.stop());
                                            streamRef.current = null;
                                        }
                                    }
                                }
                            } else {
                                console.log('Cannot restart - not in listening state or recognition/stream missing');
                            }
                        }, 150); // Slightly longer delay to handle network errors
                        // Don't update state or stop stream - we're restarting
                        return;
                    }
                    
                    // Only stop if we're actually supposed to stop
                    // Clear silence timer when recognition ends
                    if (silenceTimerRef.current) {
                        clearTimeout(silenceTimerRef.current);
                        silenceTimerRef.current = null;
                    }
                    
                    // Stop the microphone stream when recognition ends (and we're not restarting)
                    if (streamRef.current) {
                        console.log('Stopping microphone stream...');
                        streamRef.current.getTracks().forEach(track => {
                            track.stop();
                            console.log('Stopped track:', track.id);
                        });
                        streamRef.current = null;
                    }
                    
                    // Update state only if we're actually stopping
                    setIsListening(false);
                };

                recognition.onresult = (event) => {
                    let interimTranscript = '';
                    let finalTranscript = '';

                    console.log('🎯 Speech recognition result event:', {
                        resultIndex: event.resultIndex,
                        resultsLength: event.results.length,
                        isListening: isListeningRef.current
                    });

                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const result = event.results[i];
                        const transcript = result[0]?.transcript || '';
                        console.log(`  Result ${i}:`, { transcript, isFinal: result.isFinal, confidence: result[0]?.confidence });
                        
                        if (result.isFinal) {
                            finalTranscript += transcript + ' ';
                        } else {
                            interimTranscript += transcript;
                        }
                    }

                    const currentTranscript = (finalTranscript || interimTranscript).trim();
                    
                    // Only mark as received speech if we have actual content
                    if (currentTranscript.length > 0) {
                        hasReceivedSpeechRef.current = true;
                    }
                    
                    console.log('📝 Processed transcript:', {
                        currentTranscript,
                        finalTranscript: finalTranscript.trim(),
                        interimTranscript,
                        hasReceivedSpeech: hasReceivedSpeechRef.current,
                        isListening: isListeningRef.current
                    });

                    // Reset silence timer whenever we get results (speech detected)
                    if (silenceTimerRef.current) {
                        clearTimeout(silenceTimerRef.current);
                        silenceTimerRef.current = null;
                    }
                    
                    // Update transcript
                    setTranscript(currentTranscript);
                    if (onTranscriptRef.current) {
                        onTranscriptRef.current(currentTranscript, !!interimTranscript);
                    }

                    // CRITICAL FIX: Accumulate and send final transcripts like the HTML client
                    // The HTML client accumulates: this.currentTranscriptText += finalTranscript
                    // Then sends: this.sendTranscriptToServer(finalTranscript.trim(), true)
                    // So we should accumulate and send each final chunk
                    if (finalTranscript.trim()) {
                        // Accumulate final transcripts (like HTML client does)
                        accumulatedFinalTranscriptRef.current += finalTranscript;
                        const finalText = finalTranscript.trim(); // Send just this chunk, not accumulated
                        console.log('📤 Final transcript chunk received:', finalText);
                        console.log('📊 Accumulated final transcript:', accumulatedFinalTranscriptRef.current.trim());
                        
                        // Call onFinalTranscript with the current final chunk
                        // This matches the HTML client behavior - it sends each final chunk separately
                        if (onFinalTranscriptRef.current) {
                            onFinalTranscriptRef.current(finalText);
                        }
                    }

                    lastSpeechTimeRef.current = Date.now();
                    
                    // Only set up silence detection timer if we've received speech
                    // This prevents the timer from firing immediately when starting
                    if (hasReceivedSpeechRef.current && silenceTimeout > 0 && isListeningRef.current) {
                        silenceTimerRef.current = setTimeout(() => {
                            console.log('Silence detected after speech, stopping recognition...');
                            if (stopListeningRef.current && isListeningRef.current) {
                                stopListeningRef.current();
                            }
                        }, silenceTimeout);
                    }
                };
                
                // Handle speech start/end events for better silence detection
                recognition.onspeechstart = () => {
                    console.log('Speech started');
                    hasReceivedSpeechRef.current = true;
                    // Clear silence timer when speech starts
                    if (silenceTimerRef.current) {
                        clearTimeout(silenceTimerRef.current);
                        silenceTimerRef.current = null;
                    }
                };
                
                recognition.onspeechend = () => {
                    console.log('Speech ended, hasReceivedSpeech:', hasReceivedSpeechRef.current);
                    // Only start silence timer if we've actually received speech
                    // This prevents immediate timeout when no speech is detected initially
                    if (hasReceivedSpeechRef.current && silenceTimeout > 0 && isListeningRef.current) {
                        // Clear any existing timer
                        if (silenceTimerRef.current) {
                            clearTimeout(silenceTimerRef.current);
                        }
                        
                        // Start silence timer when speech ends
                        silenceTimerRef.current = setTimeout(() => {
                            console.log('Silence detected after speech end, stopping recognition...');
                            if (stopListeningRef.current && isListeningRef.current) {
                                stopListeningRef.current();
                            }
                        }, silenceTimeout);
                    }
                };

                // Don't request permission here - let it be requested on demand
                // This prevents permission request on component mount
                setHasPermission(true); // Will be set to true when permission is granted
                console.log('Speech recognition initialized successfully');

                // Set up cleanup function
                cleanup = () => {
                    console.log('Cleaning up speech recognition...');
                    
                    // Clear silence timer
                    if (silenceTimerRef.current) {
                        clearTimeout(silenceTimerRef.current);
                        silenceTimerRef.current = null;
                    }
                    
                    // Stop recognition
                    if (recognitionRef.current) {
                        try {
                            recognitionRef.current.stop();
                        } catch (e) {
                            // Ignore errors during cleanup
                        }
                    }
                    
                    // Stop microphone stream
                    if (streamRef.current) {
                        streamRef.current.getTracks().forEach(track => track.stop());
                        streamRef.current = null;
                    }
                };

            } catch (error) {
                console.error('Speech Recognition initialization error:', error);
                setError(error.message);
                setHasPermission(false);
            }
        };

        initializeSpeechRecognition();
        return cleanup;
    }, [language, silenceTimeout]);

    const startListening = useCallback(async () => {
        if (!recognitionRef.current) {
            console.error('Speech recognition not initialized');
            setError('Speech recognition not available');
            return;
        }

        try {
            // Always request microphone access - keep the stream active during recognition
            // The Web Speech API needs an active microphone stream
            console.log('Requesting microphone access...');
            
            try {
                // Stop any existing stream first
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }
                
                // Request new microphone stream
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        sampleRate: 16000, // Good for speech recognition
                    }
                });
                
                console.log('Microphone stream acquired:', stream.id);
                console.log('Audio tracks:', stream.getAudioTracks().map(t => ({
                    id: t.id,
                    label: t.label,
                    enabled: t.enabled,
                    readyState: t.readyState
                })));
                
                // Keep the stream active - don't stop it!
                streamRef.current = stream;
                setHasPermission(true);
                
                // Verify stream is actually active
                const tracks = stream.getAudioTracks();
                console.log('🎤 Microphone stream active:', {
                    trackCount: tracks.length,
                    tracks: tracks.map(t => ({
                        id: t.id,
                        label: t.label,
                        enabled: t.enabled,
                        readyState: t.readyState,
                        muted: t.muted
                    }))
                });
                
                // Check if any track is muted or not enabled
                const activeTracks = tracks.filter(t => t.enabled && !t.muted && t.readyState === 'live');
                if (activeTracks.length === 0) {
                    console.warn('⚠️ No active audio tracks found!');
                    setError('Microphone stream is not active. Please check your microphone settings.');
                }
                
                // Small delay to ensure stream is ready
                await new Promise(resolve => setTimeout(resolve, 200));
                
            } catch (permError) {
                console.error('Permission error:', permError);
                setError(`Microphone permission error: ${permError.message || permError.name}`);
                setHasPermission(false);
                setIsListening(false);
                isListeningRef.current = false;
                return;
            }

            // Now start recognition with the active stream
            console.log('🎙️ Starting speech recognition with active microphone stream...');
            console.log('Recognition state before start:', {
                isListening: isListeningRef.current,
                streamActive: !!streamRef.current,
                recognitionExists: !!recognitionRef.current
            });
            
            // Set listening flag BEFORE starting to ensure onend handler knows we want to keep listening
            isListeningRef.current = true;
            setIsListening(true);
            
            try {
                recognitionRef.current.start();
                console.log('✅ Speech recognition start() called successfully');
                console.log('Waiting for onstart event...');
            } catch (startError) {
                console.error('Error calling recognition.start():', startError);
                if (startError.name === 'InvalidStateError') {
                    // Recognition is already running, try to stop and restart
                    console.log('Recognition already running, attempting to restart...');
                    try {
                        // Temporarily set flag to false so onend doesn't restart
                        const wasListening = isListeningRef.current;
                        isListeningRef.current = false;
                        recognitionRef.current.stop();
                        await new Promise(resolve => setTimeout(resolve, 200));
                        // Restore flag before restarting
                        isListeningRef.current = wasListening;
                        recognitionRef.current.start();
                        console.log('Recognition restarted successfully');
                    } catch (restartError) {
                        console.error('Error restarting recognition:', restartError);
                        setError('Failed to start speech recognition: ' + restartError.message);
                        isListeningRef.current = false;
                        setIsListening(false);
                        // Stop the stream if recognition failed
                        if (streamRef.current) {
                            streamRef.current.getTracks().forEach(track => track.stop());
                            streamRef.current = null;
                        }
                    }
                } else {
                    setError('Failed to start speech recognition: ' + startError.message);
                    isListeningRef.current = false;
                    setIsListening(false);
                    // Stop the stream if recognition failed
                    if (streamRef.current) {
                        streamRef.current.getTracks().forEach(track => track.stop());
                        streamRef.current = null;
                    }
                }
            }
        } catch (error) {
            console.error('Error in startListening:', error);
            setError('Failed to start speech recognition: ' + error.message);
            // Stop the stream on error
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        }
    }, []);

    const stopListening = useCallback(() => {
        console.log('stopListening called, isListeningRef:', isListeningRef.current);
        
        // CRITICAL: Set flag to false FIRST to prevent onend from restarting
        // This must happen before calling stop() to avoid race conditions
        isListeningRef.current = false;
        setIsListening(false);
        
        // Clear silence timer
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
        
        // Stop recognition if it exists and is running
        if (recognitionRef.current) {
            try {
                console.log('Stopping speech recognition...');
                recognitionRef.current.stop();
            } catch (error) {
                // Ignore errors - recognition might already be stopped
                console.log('Recognition stop error (likely already stopped):', error.message);
            }
        }
        
        // Stop microphone stream
        if (streamRef.current) {
            console.log('Stopping microphone stream...');
            try {
                streamRef.current.getTracks().forEach(track => {
                    if (track.readyState !== 'ended') {
                        track.stop();
                        console.log('Stopped track:', track.id, track.label);
                    }
                });
            } catch (error) {
                console.log('Error stopping stream tracks:', error);
            }
            streamRef.current = null;
        }
        
        console.log('stopListening completed');
    }, []);

    // Store stopListening in ref for use in event handlers
    useEffect(() => {
        stopListeningRef.current = stopListening;
    }, [stopListening]);

    return {
        isListening,
        startListening,
        stopListening,
        error,
        transcript,
        hasPermission
    };
}