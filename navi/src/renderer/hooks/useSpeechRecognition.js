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

    const recognitionRef = useRef(null);
    const silenceTimerRef = useRef(null);
    const lastSpeechTimeRef = useRef(null);
    const isFinalRef = useRef(false);
    const isListeningRef = useRef(false);
    const stopListeningRef = useRef(null);
    const onTranscriptRef = useRef(onTranscript);
    const onFinalTranscriptRef = useRef(onFinalTranscript);

    // Update callback refs when they change
    useEffect(() => {
        onTranscriptRef.current = onTranscript;
        onFinalTranscriptRef.current = onFinalTranscript;
    }, [onTranscript, onFinalTranscript]);

    // Initialize speech recognition
    useEffect(() => {
        // Check if browser supports speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setError('Speech recognition is not supported in this browser.');
            return;
        }

        // Create recognition instance
        recognitionRef.current = new SpeechRecognition();
        const recognition = recognitionRef.current;

        // Configure recognition
        recognition.continuous = true; // Keep listening continuously
        recognition.interimResults = true; // Get interim results
        recognition.lang = language;
        recognition.maxAlternatives = 1;

        // Handle speech recognition results
        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            // Process all results
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;

                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                    isFinalRef.current = true;
                } else {
                    interimTranscript += transcript;
                    isFinalRef.current = false;
                }
            }

            // Update transcript state
            const fullTranscript = finalTranscript || interimTranscript;
            setTranscript(fullTranscript.trim());

            // Call callbacks using refs to get latest versions
            if (onTranscriptRef.current) {
                try {
                    onTranscriptRef.current(fullTranscript.trim(), !finalTranscript);
                } catch (err) {
                    console.error('Error in onTranscript callback:', err);
                }
            }

            if (finalTranscript && onFinalTranscriptRef.current) {
                try {
                    onFinalTranscriptRef.current(finalTranscript.trim());
                } catch (err) {
                    console.error('Error in onFinalTranscript callback:', err);
                }
            }

            // Reset silence timer when speech is detected
            if (fullTranscript.trim()) {
                const now = Date.now();
                lastSpeechTimeRef.current = now;
                // Reset the silence timer - we'll do this inline since we're in the event handler
                if (silenceTimerRef.current) {
                    clearTimeout(silenceTimerRef.current);
                    silenceTimerRef.current = null;
                }
                if (isListeningRef.current) {
                    silenceTimerRef.current = setTimeout(() => {
                        const timeSinceLastSpeech = Date.now() - lastSpeechTimeRef.current;
                        if (timeSinceLastSpeech >= silenceTimeout && isListeningRef.current) {
                            console.log('Silence timeout reached, stopping recognition');
                            if (stopListeningRef.current) {
                                stopListeningRef.current();
                            }
                        }
                    }, silenceTimeout);
                }
            }
        };

        // Handle errors
        recognition.onerror = (event) => {
            // Don't log or set error for 'no-speech' as it's expected during silence
            // Also ignore 'aborted' errors which can occur during normal operation
            if (event.error === 'no-speech' || event.error === 'aborted') {
                return;
            }

            console.error('Speech recognition error:', event.error);

            // Handle specific errors
            if (event.error === 'not-allowed') {
                setError('Microphone permission denied. Please allow microphone access.');
                if (stopListeningRef.current) {
                    stopListeningRef.current();
                }
            } else if (event.error === 'network') {
                // Network errors from Web Speech API are often non-critical
                // The "OnSizeReceived failed with Error: -2" is a known Chromium internal issue
                // that occurs during audio stream upload to Google's speech recognition servers.
                // This error is logged to stderr but doesn't actually prevent speech recognition
                // from working. The API continues to function normally despite this error.
                console.warn('Speech recognition network warning (non-critical, continuing...):', event.error);
                // Don't set error state for network errors - they don't affect functionality
                // The error will appear in the console but speech recognition will continue working
                return;
            } else {
                // Only set error for other critical errors
                setError(`Speech recognition error: ${event.error}`);
            }
        };

        // Handle when recognition ends
        recognition.onend = () => {
            // If we were listening and it ended unexpectedly, check if we should restart
            // We need to check the current listening state from a ref to avoid stale closure
            if (isListeningRef.current) {
                // Check if we should restart (if we haven't hit silence timeout)
                const timeSinceLastSpeech = Date.now() - (lastSpeechTimeRef.current || Date.now());
                if (timeSinceLastSpeech < silenceTimeout) {
                    // Restart recognition if it ended but we're still supposed to be listening
                    // Use a small delay to avoid immediate restart issues
                    setTimeout(() => {
                        if (isListeningRef.current && recognitionRef.current) {
                            try {
                                recognitionRef.current.start();
                            } catch (err) {
                                // Recognition might already be starting, ignore error
                                console.log('Recognition restart:', err.message);
                                // If we can't restart, stop listening
                                if (err.message.includes('already started')) {
                                    // Already started, that's fine
                                } else {
                                    if (stopListeningRef.current) {
                                        stopListeningRef.current();
                                    }
                                }
                            }
                        }
                    }, 100);
                } else {
                    // Silence timeout reached
                    if (stopListeningRef.current) {
                        stopListeningRef.current();
                    }
                }
            }
        };

        // Reset silence timer function (defined inside useEffect to access silenceTimeout)
        const resetSilenceTimer = () => {
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
            }

            if (isListeningRef.current) {
                silenceTimerRef.current = setTimeout(() => {
                    // Check if enough time has passed since last speech
                    const timeSinceLastSpeech = Date.now() - (lastSpeechTimeRef.current || Date.now());
                    if (timeSinceLastSpeech >= silenceTimeout && isListeningRef.current) {
                        console.log('Silence timeout reached, stopping recognition');
                        if (stopListeningRef.current) {
                            stopListeningRef.current();
                        }
                    }
                }, silenceTimeout);
            }
        };

        // Handle when recognition starts
        recognition.onstart = () => {
            setError(null);
            lastSpeechTimeRef.current = Date.now();
            isListeningRef.current = true;
            resetSilenceTimer();
        };

        // Cleanup
        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (err) {
                    // Ignore errors during cleanup
                }
            }
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
            }
        };
    }, [language, silenceTimeout]); // Only depend on language and timeout

    // Request microphone permissions first
    const requestMicrophonePermission = useCallback(async () => {
        try {
            // Request microphone permission explicitly
            // This will show the permission prompt to the user
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Stop the stream immediately - we just needed permission
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (err) {
            console.error('Microphone permission error:', err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('Microphone permission denied. Please allow microphone access in your browser settings.');
                return false;
            } else if (err.name === 'NotFoundError') {
                setError('No microphone found. Please connect a microphone.');
                return false;
            } else {
                setError('Failed to access microphone. Please check your microphone settings.');
                return false;
            }
        }
    }, []);

    // Start listening
    const startListening = useCallback(async () => {
        if (!recognitionRef.current) {
            setError('Speech recognition is not available.');
            return;
        }

        if (isListeningRef.current) {
            return; // Already listening
        }

        // Request microphone permission first
        setError(null);
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
            isListeningRef.current = false;
            setIsListening(false);
            return;
        }

        try {
            setTranscript('');
            lastSpeechTimeRef.current = Date.now();
            isListeningRef.current = true;
            setIsListening(true);
            recognitionRef.current.start();
            // Silence timer will be set up in onstart handler
        } catch (err) {
            console.error('Error starting speech recognition:', err);
            setError('Faile to start speech recognition. Please try again.');
            isListeningRef.current = false;
            setIsListening(false);
        }
    }, [requestMicrophonePermission]);

    // Stop listening
    const stopListening = useCallback(() => {
        if (!recognitionRef.current) {
            return;
        }

        isListeningRef.current = false;

        try {
            recognitionRef.current.stop();
        } catch (err) {
            // Ignore errors when stopping
            console.log('Error stopping recognition:', err.message);
        } finally {
            setIsListening(false);
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
            }
        }
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
    };
}

