import { useState, useEffect, useRef, useCallback } from 'react';

const WEBSOCKET_URL = 'ws://localhost:8765';
const RECONNECT_DELAY = 3000; // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Custom hook for WebSocket connection to Python Voice AI server
 * Handles real-time communication for voice AI responses
 */
export function useVoiceAIWebSocket({ enabled = true }) {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);
    const [aiResponse, setAiResponse] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);

    const websocketRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimeoutRef = useRef(null);
    const currentResponseRef = useRef('');
    const lastConnectionAttemptRef = useRef(0);
    const connectionStableRef = useRef(false);

    // Connect to WebSocket server
    const connect = useCallback(() => {
        // Check if already connected or connecting
        if (websocketRef.current?.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected');
            setIsConnected(true);
            setIsConnecting(false);
            return;
        }

        if (websocketRef.current?.readyState === WebSocket.CONNECTING) {
            console.log('Connection already in progress');
            setIsConnecting(true);
            return;
        }

        // Close any existing connection before creating new one
        if (websocketRef.current) {
            try {
                websocketRef.current.close();
            } catch (e) {
                // Ignore errors when closing
            }
            websocketRef.current = null;
        }

        setIsConnecting(true);
        setError(null);
        connectionStableRef.current = false;
        lastConnectionAttemptRef.current = Date.now();

        try {
            console.log(`Connecting to WebSocket server: ${WEBSOCKET_URL}`);
            const ws = new WebSocket(WEBSOCKET_URL);

            ws.onopen = () => {
                console.log('WebSocket connected successfully');
                setIsConnected(true);
                setIsConnecting(false);
                setError(null);
                reconnectAttemptsRef.current = 0;
                currentResponseRef.current = '';
                connectionStableRef.current = true;
                // Small delay to ensure state is stable before any UI updates
                setTimeout(() => {
                    connectionStableRef.current = true;
                }, 100);
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    handleWebSocketMessage(message);
                } catch (err) {
                    console.error('Error parsing WebSocket message:', err);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                setError('WebSocket connection error. Is the server running?');
                setIsConnecting(false);
            };

            ws.onclose = (event) => {
                console.log('WebSocket closed:', event.code, event.reason);
                setIsConnected(false);
                setIsConnecting(false);

                // Clear any existing reconnect timeout
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = null;
                }

                // Only attempt to reconnect if:
                // 1. Enabled
                // 2. Not a clean close (code 1000)
                // 3. Haven't exceeded max attempts
                // 4. Connection was actually attempted (not just failed immediately)
                if (enabled && event.code !== 1000 && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttemptsRef.current++;
                    console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`);
                    
                    reconnectTimeoutRef.current = setTimeout(() => {
                        // Only reconnect if still enabled and not already connected
                        if (enabled && websocketRef.current?.readyState !== WebSocket.OPEN) {
                            connect();
                        }
                    }, RECONNECT_DELAY);
                } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
                    setError('Failed to connect to voice AI server after multiple attempts. Please ensure the server is running.');
                    reconnectAttemptsRef.current = 0; // Reset after showing error
                } else if (event.code === 1000) {
                    // Clean close - reset reconnect attempts
                    reconnectAttemptsRef.current = 0;
                }
            };

            websocketRef.current = ws;
        } catch (err) {
            console.error('Error creating WebSocket:', err);
            setError(`Failed to connect: ${err.message}`);
            setIsConnecting(false);
        }
    }, [enabled]);

    // Handle incoming WebSocket messages
    const handleWebSocketMessage = useCallback((message) => {
        switch (message.type) {
            case 'initialized':
                console.log('Server initialized:', message.message);
                break;

            case 'ai_response':
                // Stream AI response
                if (message.text) {
                    currentResponseRef.current += message.text;
                    setAiResponse(currentResponseRef.current);
                    setIsStreaming(true);
                }
                
                if (message.is_final) {
                    setIsStreaming(false);
                    // Keep the final response, but reset for next response
                    setTimeout(() => {
                        currentResponseRef.current = '';
                    }, 100);
                }
                break;

            case 'error':
                console.error('Server error:', message.message);
                setError(message.message);
                break;

            case 'pong':
                // Health check response
                break;

            default:
                console.warn('Unknown message type:', message.type);
        }
    }, []);

    // Send transcript to server
    const sendTranscript = useCallback((text, isFinal = false) => {
        console.log('📡 sendTranscript called:', { text, isFinal, readyState: websocketRef.current?.readyState, isConnected });
        
        if (!text || !text.trim()) {
            console.warn('⚠️ Cannot send empty transcript');
            return;
        }

        if (websocketRef.current?.readyState === WebSocket.OPEN) {
            try {
                const message = {
                    type: 'transcript',
                    text: text.trim(),
                    is_final: isFinal
                };
                console.log('📤 Sending to WebSocket:', message);
                websocketRef.current.send(JSON.stringify(message));
                console.log('✅ Transcript sent successfully to server');
            } catch (err) {
                console.error('❌ Error sending transcript:', err);
            }
        } else {
            const state = websocketRef.current?.readyState;
            const stateNames = {
                0: 'CONNECTING',
                1: 'OPEN',
                2: 'CLOSING',
                3: 'CLOSED'
            };
            console.warn(`⚠️ WebSocket not ready. State: ${stateNames[state] || state}, isConnected: ${isConnected}`);
        }
    }, [isConnected]);

    // Clear current response
    const clearResponse = useCallback(() => {
        currentResponseRef.current = '';
        setAiResponse('');
        setIsStreaming(false);
    }, []);

    // Disconnect from WebSocket
    const disconnect = useCallback(() => {
        console.log('Disconnecting WebSocket...');
        
        // Clear reconnect timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        // Reset reconnect attempts
        reconnectAttemptsRef.current = 0;

        // Close WebSocket connection
        if (websocketRef.current) {
            try {
                // Only close if not already closed
                if (websocketRef.current.readyState === WebSocket.OPEN || 
                    websocketRef.current.readyState === WebSocket.CONNECTING) {
                    websocketRef.current.close(1000, 'Client disconnecting');
                }
            } catch (e) {
                console.error('Error closing WebSocket:', e);
            }
            websocketRef.current = null;
        }

        setIsConnected(false);
        setIsConnecting(false);
        currentResponseRef.current = '';
        setAiResponse('');
    }, []);

    // Auto-connect when enabled - FIXED: Prevent infinite loops and rapid reconnection
    useEffect(() => {
        const now = Date.now();
        const timeSinceLastAttempt = now - lastConnectionAttemptRef.current;
        const MIN_RECONNECT_INTERVAL = 2000; // Wait at least 2 seconds between attempts

        // Only connect if:
        // 1. Enabled
        // 2. Not connected
        // 3. Not connecting
        // 4. No active connection attempt
        // 5. Enough time has passed since last attempt (prevent rapid reconnection)
        if (enabled && 
            !isConnected && 
            !isConnecting && 
            websocketRef.current?.readyState !== WebSocket.CONNECTING &&
            timeSinceLastAttempt > MIN_RECONNECT_INTERVAL) {
            console.log('Auto-connecting WebSocket...');
            lastConnectionAttemptRef.current = now;
            connect();
        }

        return () => {
            // Only disconnect on unmount or when explicitly disabled
            if (!enabled) {
                disconnect();
            }
        };
        // Remove connect and disconnect from deps to prevent loops
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, isConnected, isConnecting]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        isConnected,
        isConnecting,
        error,
        aiResponse,
        isStreaming,
        connect,
        disconnect,
        sendTranscript,
        clearResponse,
    };
}

