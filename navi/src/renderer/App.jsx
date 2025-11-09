import React, { useState, useEffect, useRef } from "react";
import { Conversation } from "@elevenlabs/client";

export default function App() {
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const conversationRef = useRef(null);

    useEffect(() => {
        initializeConversation();
        return () => {
            if (conversationRef.current) {
                conversationRef.current.endSession();
            }
        };
    }, []);

    const initializeConversation = async () => {
        try {
            // Get credentials from main process
            const apiKey = await window.electron.getElevenLabsKey();
            const agentId = await window.electron.getElevenLabsAgentId();
            
            if (!apiKey) {
                console.error('ElevenLabs API key not found. Please add ELEVENLABS_API_KEY to your .env file');
                setMessages([{ type: 'error', text: 'API key not configured. Please add ELEVENLABS_API_KEY to .env file' }]);
                return;
            }

            if (!agentId) {
                console.error('ElevenLabs Agent ID not found. Please add ELEVENLABS_AGENT_ID to your .env file');
                setMessages([{ type: 'error', text: 'Agent ID not configured. Please add ELEVENLABS_AGENT_ID to .env file' }]);
                return;
            }

            // Start ElevenLabs conversation
            const conversation = await Conversation.startSession({
                agentId: agentId,
                apiKey: apiKey,
                
                onConnect: () => {
                    console.log('Connected to ElevenLabs');
                    setIsConnected(true);
                    setMessages([{ type: 'system', text: 'Connected. Speak normally, AI is listening...' }]);
                },
                
                onDisconnect: () => {
                    console.log('Disconnected from ElevenLabs');
                    setIsConnected(false);
                },
                
                onMessage: (message) => {
                    console.log('Message:', message);
                    
                    // Handle user transcription - check source and role
                    if (message.source === 'user' || message.type === 'user_transcript' || message.role === 'user') {
                        const text = message.message || message.content || message.text || '';
                        if (text) {
                            setMessages(prev => [...prev, { 
                                type: 'user', 
                                text: text
                            }]);
                        }
                    }
                    
                    // Handle AI response - check source and role
                    if (message.source === 'ai' || message.type === 'agent_response' || message.role === 'assistant' || message.role === 'ai') {
                        const text = message.message || message.content || message.text || '';
                        if (text) {
                            setMessages(prev => [...prev, { 
                                type: 'ai', 
                                text: text
                            }]);
                        }
                    }
                },
                
                onError: (error) => {
                    console.error('ElevenLabs error:', error);
                    setMessages(prev => [...prev, { 
                        type: 'error', 
                        text: `Error: ${error.message}` 
                    }]);
                },
            });

            conversationRef.current = conversation;

        } catch (error) {
            console.error('Failed to initialize conversation:', error);
            setMessages([{ type: 'error', text: `Failed to connect: ${error.message}` }]);
        }
    };

    const handleKeyPress = (e) => {
        if (e.code === 'Space' && conversationRef.current && !isSpeaking) {
            e.preventDefault();
            setIsSpeaking(true);
            // ElevenLabs handles voice activation automatically
        }
    };

    const handleKeyRelease = (e) => {
        if (e.code === 'Space' && isSpeaking) {
            e.preventDefault();
            setIsSpeaking(false);
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);
        window.addEventListener('keyup', handleKeyRelease);
        
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
            window.removeEventListener('keyup', handleKeyRelease);
        };
    }, [isSpeaking]);

    return (
        <div className="output-bar">
            <div className="output-content">
                {messages.length === 0 ? (
                    <p className="placeholder">Connecting to ElevenLabs...</p>
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
                {isSpeaking && <span className="recording-indicator">● Speaking...</span>}
            </div>
        </div>
    );
}
