import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook for audio-based speech recognition using Python backend
 * Streams audio to WebSocket server instead of using Web Speech API
 */
export function useAudioSpeechRecognition({
    onTranscript,
    onFinalTranscript,
    enabled = true,
    language = 'en-US',
}) {
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState(null);
    const [transcript, setTranscript] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    
    const websocketRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const audioContextRef = useRef(null);
    const processorRef = useRef(null);
    const onTranscriptRef = useRef(onTranscript);
    const onFinalTranscriptRef = useRef(onFinalTranscript);
    const reconnectAttemptsRef = useRef(0);
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY = 2000;
    
    // WebSocket server URL for speech recognition
    const SPEECH_WS_URL = 'ws://localhost:8766';
    
    // Update callback refs
    useEffect(() => {
        onTranscriptRef.current = onTranscript;
        onFinalTranscriptRef.current = onFinalTranscript;
    }, [onTranscript, onFinalTranscript]);
    
    // Connect to WebSocket server
    const connect = useCallback(() => {
        if (websocketRef.current?.readyState === WebSocket.OPEN) {
            return; // Already connected
        }
        
        // Don't try to connect if already attempting
        if (websocketRef.current?.readyState === WebSocket.CONNECTING) {
            return;
        }
        
        try {
            console.log('🎤 Connecting to speech recognition server at', SPEECH_WS_URL);
            const ws = new WebSocket(SPEECH_WS_URL);
            
            // Set connection timeout
            const connectionTimeout = setTimeout(() => {
                if (ws.readyState !== WebSocket.OPEN) {
                    console.warn('⚠️ Connection timeout - speech recognition server may not be running');
                    ws.close();
                    setError('Speech recognition server not available. Please start the Python server.');
                    setIsConnected(false);
                }
            }, 3000); // 3 second timeout
            
            ws.onopen = () => {
                clearTimeout(connectionTimeout);
                console.log('✅ Connected to speech recognition server');
                setIsConnected(true);
                setError(null);
                reconnectAttemptsRef.current = 0;
            };
            
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.type === 'transcript') {
                        const text = data.text || '';
                        const isFinal = data.is_final || false;
                        
                        if (text) {
                            setTranscript(text);
                            
                            if (isFinal) {
                                console.log('📤 Final transcript:', text);
                                if (onFinalTranscriptRef.current) {
                                    onFinalTranscriptRef.current(text);
                                }
                            } else {
                                console.log('📝 Interim transcript:', text);
                                if (onTranscriptRef.current) {
                                    onTranscriptRef.current(text, true);
                                }
                            }
                        }
                    } else if (data.type === 'error') {
                        console.error('❌ Speech recognition error:', data.message);
                        setError(data.message);
                    } else if (data.type === 'initialized') {
                        console.log('✅ Speech recognition initialized');
                    }
                } catch (e) {
                    console.error('Error parsing WebSocket message:', e);
                }
            };
            
            ws.onerror = (error) => {
                clearTimeout(connectionTimeout);
                console.error('❌ WebSocket error:', error);
                // Don't set error immediately - wait for onclose to handle reconnection
            };
            
            ws.onclose = (event) => {
                clearTimeout(connectionTimeout);
                console.log('🔌 WebSocket connection closed', event.code, event.reason);
                setIsConnected(false);
                
                // Only show error if it wasn't a clean close and we're not reconnecting
                if (event.code !== 1000 && reconnectAttemptsRef.current === 0) {
                    setError('Speech recognition server not available. Please start: python speech_recognition_server.py');
                }
                
                // Attempt to reconnect if we were listening
                if (isListening && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttemptsRef.current++;
                    console.log(`🔄 Reconnecting... (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
                    setTimeout(() => {
                        if (enabled) {
                            connect();
                        }
                    }, RECONNECT_DELAY);
                }
            };
            
            websocketRef.current = ws;
        } catch (error) {
            console.error('Error creating WebSocket:', error);
            setError('Failed to create WebSocket connection. Make sure the server is running.');
            setIsConnected(false);
        }
    }, [enabled, isListening]);
    
    // Disconnect from WebSocket
    const disconnect = useCallback(() => {
        if (websocketRef.current) {
            websocketRef.current.close();
            websocketRef.current = null;
        }
        setIsConnected(false);
    }, []);
    
    // Start audio capture and streaming
    const startListening = useCallback(async () => {
        if (isListening) {
            console.log('Already listening');
            return;
        }
        
        try {
            // Connect to WebSocket if not connected
            if (!isConnected) {
                connect();
                // Wait a bit for connection
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Request microphone access
            console.log('🎤 Requesting microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 16000,
                    channelCount: 1,
                }
            });
            
            mediaStreamRef.current = stream;
            console.log('✅ Microphone access granted');
            
            // Create AudioContext for processing
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioContext({ sampleRate: 16000 });
            audioContextRef.current = audioContext;
            
            // Create audio source from stream
            const source = audioContext.createMediaStreamSource(stream);
            
            // Create script processor for audio chunks
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;
            
            processor.onaudioprocess = (e) => {
                if (!isListening || !websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
                    return;
                }
                
                // Get audio data
                const inputData = e.inputBuffer.getChannelData(0);
                
                // Convert Float32Array to Int16Array (16-bit PCM)
                const int16Array = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    // Clamp and convert to 16-bit integer
                    const s = Math.max(-1, Math.min(1, inputData[i]));
                    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }
                
                // Convert Int16Array to base64
                // Use a more efficient method for large arrays
                const uint8Array = new Uint8Array(int16Array.buffer);
                const base64Audio = btoa(
                    String.fromCharCode.apply(null, Array.from(uint8Array))
                );
                
                // Send audio chunk to server
                try {
                    websocketRef.current.send(JSON.stringify({
                        type: 'audio',
                        data: base64Audio
                    }));
                } catch (error) {
                    console.error('Error sending audio chunk:', error);
                }
            };
            
            // Connect source to processor to destination
            source.connect(processor);
            processor.connect(audioContext.destination);
            
            setIsListening(true);
            setError(null);
            console.log('✅ Started listening and streaming audio');
            
        } catch (error) {
            console.error('❌ Error starting audio capture:', error);
            setError(error.message || 'Failed to start audio capture');
            setIsListening(false);
        }
    }, [isListening, isConnected, connect]);
    
    // Stop listening
    const stopListening = useCallback(() => {
        console.log('🛑 Stopping audio capture...');
        
        // Stop audio processing
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        
        // Close audio context
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        
        // Stop media stream
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        
        // Finalize transcript
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
            websocketRef.current.send(JSON.stringify({ type: 'finalize' }));
        }
        
        setIsListening(false);
        setTranscript('');
        console.log('✅ Stopped listening');
    }, []);
    
    // Auto-connect when enabled (with delay to avoid immediate connection attempts)
    useEffect(() => {
        if (enabled && !isConnected && websocketRef.current?.readyState !== WebSocket.CONNECTING) {
            // Small delay to avoid rapid connection attempts
            const timeoutId = setTimeout(() => {
                connect();
            }, 500);
            
            return () => {
                clearTimeout(timeoutId);
                if (!enabled) {
                    disconnect();
                    stopListening();
                }
            };
        }
        
        return () => {
            if (!enabled) {
                disconnect();
                stopListening();
            }
        };
    }, [enabled, isConnected, connect, disconnect, stopListening]);
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopListening();
            disconnect();
        };
    }, [stopListening, disconnect]);
    
    return {
        isListening,
        isConnected,
        transcript,
        error,
        startListening,
        stopListening,
        connect,
        disconnect,
    };
}

