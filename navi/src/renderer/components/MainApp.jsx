import React, { useState, useEffect, useRef, useCallback } from "react";
import { GlassPanel, GlassButton, GlassCard, PulseIndicator } from "./GlassUI.jsx";
import { useAuth } from "../contexts/AuthContext";
import { useSettings } from "../contexts/SettingsContext";
import { useAudioSpeechRecognition } from "../hooks/useAudioSpeechRecognition";
import { useVoiceAIWebSocket } from "../hooks/useVoiceAIWebSocket";
import { useTextToSpeech } from "../hooks/useTextToSpeech";
import { getFileIcon, formatFileSize, getRelativeTime } from "../utils/documentUtils";
import { parseCommand, executeCommand } from "../utils/commandParser";
import { getGeminiResponse } from "../utils/geminiApi.js";
import UserSettingsModal from "./UserSettingsModal";
import VoiceCommandListPopup from "./VoiceCommandListPopup";
import DraggableWidget from "./DraggableWidget";
import DocumentUploadWidget from "./widgets/DocumentUploadWidget";
import EmailConfigWidget from "./widgets/EmailConfigWidget";
import QuickNotesWidget from "./widgets/QuickNotesWidget";
import AIStatusMonitorWidget from "./widgets/AIStatusMonitorWidget";
import "./../styles/app.css";

export default function MainApp() {
    const { user, logout } = useAuth();
    const { activeWidgets, setShowSettings, removeWidget } = useSettings();
    const [status, setStatus] = useState("Idle");
    const [command, setCommand] = useState("");
    const [response, setResponse] = useState("");
    const [history, setHistory] = useState([]);
    const [isVideoActive, setIsVideoActive] = useState(false);
    // showDocuments is now managed by activeWidgets in SettingsContext
    const showDocuments = activeWidgets.some(w => w.id === 'document-upload');
    const [documents, setDocuments] = useState([]);
    const [selectedDocument, setSelectedDocument] = useState(null);

    // Track the last processed command to avoid reprocessing
    const lastProcessedCommandRef = useRef('');

    // Load documents from storage on mount
    useEffect(() => {
        const savedDocuments = localStorage.getItem('navi_documents');
        if (savedDocuments) {
            try {
                setDocuments(JSON.parse(savedDocuments));
            } catch (e) {
                console.error('Error loading documents:', e);
            }
        }
    }, []);

    // Save documents to storage whenever they change
    useEffect(() => {
        if (documents.length > 0) {
            localStorage.setItem('navi_documents', JSON.stringify(documents));
        }
    }, [documents]);

    // Handle file selection
    const handleAddDocument = async () => {
        try {
            if (window.electron?.dialog?.openFile) {
                const result = await window.electron.dialog.openFile({
                    title: 'Select a document',
                    filters: [
                        { name: 'All Files', extensions: ['*'] },
                        { name: 'PDFs', extensions: ['pdf'] },
                        { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt', 'md'] },
                        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] },
                    ],
                    properties: ['openFile'],
                });

                if (!result.canceled && result.filePaths.length > 0) {
                    const filePath = result.filePaths[0];
                    const fileName = filePath.split(/[\\/]/).pop();

                    const newDocument = {
                        id: Date.now().toString(),
                        name: fileName,
                        path: filePath,
                        size: 0, // Will be updated if we add file stats API
                        addedAt: new Date().toISOString(),
                        modifiedAt: new Date().toISOString(),
                    };

                    setDocuments(prev => [...prev, newDocument]);
                    setStatus(`Added ${fileName}`);
                    setTimeout(() => setStatus("Idle"), 2000);
                }
            } else {
                setStatus("File dialog not available");
            }
        } catch (error) {
            console.error('Error adding document:', error);
            setStatus("Error adding document");
        }
    };

    // Handle document removal
    const handleRemoveDocument = (documentId) => {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        if (selectedDocument?.id === documentId) {
            setSelectedDocument(null);
        }
    };

    // Text-to-speech for AI responses
    const { speak: speakText, stop: stopSpeaking, isAvailable: ttsAvailable } = useTextToSpeech();

    // WebSocket connection for real-time voice AI
    const {
        isConnected: isWebSocketConnected,
        isConnecting: isWebSocketConnecting,
        error: websocketError,
        aiResponse: websocketAIResponse,
        isStreaming: isAIStreaming,
        sendTranscript: sendTranscriptToServer,
        clearResponse: clearWebSocketResponse,
    } = useVoiceAIWebSocket({ enabled: true });

    // Audio-based speech recognition hook (streams audio to Python backend)
    const {
        isListening,
        startListening,
        stopListening,
        error: speechError,
        transcript,
    } = useAudioSpeechRecognition({
        enabled: true,
        onTranscript: (transcript, isInterim) => {
            console.log('🎤 Received transcript:', transcript, 'isInterim:', isInterim);
            // Update command in real-time as user speaks
            setCommand(transcript);
            if (isInterim) {
                setStatus("Listening...");
            } else {
                setStatus("Processing...");
            }
        },
        onFinalTranscript: (finalTranscript) => {
            // Final transcript received - send to WebSocket server for AI response
            console.log('🔊 FINAL TRANSCRIPT RECEIVED:', finalTranscript);
            setCommand(finalTranscript);
            setStatus("Processing...");
            
            // Send to WebSocket server if connected, otherwise fallback to local processing
            if (isWebSocketConnected && finalTranscript.trim()) {
                console.log('📤 Sending final transcript to WebSocket server:', finalTranscript);
                sendTranscriptToServer(finalTranscript, true);
                clearWebSocketResponse(); // Clear previous response
            } else if (!isWebSocketConnected) {
                // Fallback: process locally if WebSocket not available
                console.log('⚠️ WebSocket not connected, processing locally:', finalTranscript);
                // The processCommand will be called by the useEffect below
            } else {
                console.log('⚠️ Final transcript is empty or WebSocket not ready');
            }
        },
    });

    // Handle mic button toggle
    const handleMicToggle = async () => {
        try {
            if (isListening) {
                console.log('Stopping listening...');
                stopListening();
                setStatus("Processing...");
                // Process the final transcript if available
                if (transcript) {
                    console.log('Processing final transcript:', transcript);
                    processCommand(transcript);
                }
            } else {
                console.log('Starting listening...');
                setCommand(""); // Clear previous command
                setResponse(""); // Clear previous response
                clearWebSocketResponse(); // Clear WebSocket response
                lastProcessedCommandRef.current = ''; // Reset processed command tracking
                
                // Check WebSocket connection status
                if (!isWebSocketConnected && !isWebSocketConnecting) {
                    setStatus("Connecting to AI server...");
                } else if (isWebSocketConnecting) {
                    setStatus("Connecting to AI server...");
                } else {
                    setStatus("Starting microphone...");
                }

                // Start listening - the hook will handle microphone access
                // Don't request permission here - let the hook handle it
                // Speech recognition works independently of WebSocket connection
                try {
                    startListening();
                    // Always set to listening - WebSocket is optional
                    setStatus("Listening...");
                } catch (err) {
                    console.error('Error starting listening:', err);
                    let errorMsg = "Failed to start listening";
                    if (err.message) {
                        errorMsg = err.message;
                    }
                    setStatus(errorMsg);
                    setResponse(errorMsg);
                }
            }
        } catch (error) {
            console.error('Error in handleMicToggle:', error);
            setStatus("Error: " + error.message);
            setResponse("Error: " + error.message);
        }
    };

    // Process voice command
    const processCommand = useCallback(async (commandText) => {
        try {
            // Remove "Navi" prefix if present for cleaner parsing
            const cleanedCommand = commandText.replace(/^navi\s+/i, '').trim();

            if (!cleanedCommand) {
                setStatus("Idle");
                return;
            }

            // Update status to processing
            setStatus("Processing...");
            setResponse(""); // Clear previous response

            // Parse command for document operations
            const parsedCommand = parseCommand(cleanedCommand);

            // Check if this is a document operation command
            const isDocumentCommand = parsedCommand.action && (
                parsedCommand.action === 'update' ||
                parsedCommand.action === 'send' ||
                parsedCommand.action === 'update_and_send'
            );

            let aiResponse = '';
            let commandResult = null;

            // If it's a document command, execute it and get AI feedback
            if (isDocumentCommand) {
                try {
                    // Execute the command
                    const results = await executeCommand(parsedCommand, documents, (progress) => {
                        setStatus(progress);
                    });

                    commandResult = results[0];

                    // Get AI response with context about the command execution
                    const context = {
                        documents,
                        selectedDocument,
                        commandResult,
                        parsedCommand,
                    };

                    const commandSummary = commandResult.success
                        ? `Successfully executed: ${commandResult.message}`
                        : `Command failed: ${commandResult.message}`;

                    aiResponse = await getGeminiResponse(
                        `User said: "${cleanedCommand}". ${commandSummary}. Provide a helpful, concise response confirming what was done or suggesting alternatives if it failed.`,
                        context
                    );
                } catch (cmdError) {
                    console.error('Error executing command:', cmdError);
                    // Still get AI response about the error
                    aiResponse = await getGeminiResponse(
                        `User requested: "${cleanedCommand}". I encountered an error: ${cmdError.message}. Provide a helpful error message.`,
                        { documents, selectedDocument }
                    );
                }
            } else {
                // General query - get AI response with full context
                aiResponse = await getGeminiResponse(cleanedCommand, {
                    documents,
                    selectedDocument,
                });
            }

            setResponse(aiResponse);
            setStatus("Done");

            // Speak the AI response
            if (aiResponse.trim() && ttsAvailable) {
                console.log('🔊 Speaking AI response...');
                speakText(aiResponse, {
                    rate: 1.0,
                    pitch: 1.0,
                    volume: 0.8,
                    lang: 'en-US',
                    onEnd: () => {
                        console.log('🔊 Finished speaking AI response');
                    }
                });
            }

            // Update history with response
            setHistory(prev => {
                const updated = [...prev];
                if (updated.length > 0) {
                    updated[updated.length - 1].response = aiResponse;
                    if (commandResult) {
                        updated[updated.length - 1].commandResult = commandResult;
                    }
                }
                return updated;
            });
        } catch (error) {
            console.error('Error processing command:', error);
            const errorMessage = error.message || "I apologize, but I encountered an error processing your request. Please try again.";
            setResponse(errorMessage);
            setStatus("Error");

            // Update history with error
            setHistory(prev => {
                const updated = [...prev];
                if (updated.length > 0) {
                    updated[updated.length - 1].response = errorMessage;
                    updated[updated.length - 1].error = true;
                }
                return updated;
            });
        }
    }, [documents, selectedDocument]);

    // Track last spoken response to prevent duplicate TTS
    const lastSpokenResponseRef = useRef('');

    // Update response from WebSocket AI and speak when complete
    useEffect(() => {
        if (websocketAIResponse) {
            setResponse(websocketAIResponse);
            if (isAIStreaming) {
                setStatus("AI responding...");
            } else {
                setStatus("Done");
                // Speak the AI response when it's complete (only once per response)
                if (websocketAIResponse.trim() && 
                    ttsAvailable && 
                    lastSpokenResponseRef.current !== websocketAIResponse) {
                    lastSpokenResponseRef.current = websocketAIResponse;
                    console.log('🔊 Speaking AI response...');
                    speakText(websocketAIResponse, {
                        rate: 1.0,
                        pitch: 1.0,
                        volume: 0.8,
                        lang: 'en-US',
                        onEnd: () => {
                            console.log('🔊 Finished speaking AI response');
                        }
                    });
                }
            }
        }
    }, [websocketAIResponse, isAIStreaming, ttsAvailable, speakText]);

    // Handle command processing (when speech recognition stops)
    // Only process document commands locally, let WebSocket handle AI responses
    useEffect(() => {
        // When listening stops and we have a command that hasn't been processed yet
        if (!isListening && command.trim() && command.trim() !== lastProcessedCommandRef.current) {
            const commandToProcess = command.trim();
            lastProcessedCommandRef.current = commandToProcess;

            // Add to history
            const newEntry = {
                command: commandToProcess,
                timestamp: new Date().toLocaleTimeString(),
                response: null
            };

            setHistory(prev => [...prev, newEntry]);
            setStatus("Processing...");

            // Parse command to check if it's a document operation
            const parsedCommand = parseCommand(commandToProcess.replace(/^navi\s+/i, '').trim());
            const isDocumentCommand = parsedCommand.action && (
                parsedCommand.action === 'update' ||
                parsedCommand.action === 'send' ||
                parsedCommand.action === 'update_and_send'
            );

            // Only process document commands locally, WebSocket handles AI responses
            if (isDocumentCommand) {
                processCommand(commandToProcess);
            } else if (isWebSocketConnected) {
                // WebSocket will handle the AI response
                // Just wait for it to come through
                setStatus("Waiting for AI response...");
            } else {
                // Fallback to local processing if WebSocket not connected
                processCommand(commandToProcess);
            }
        }
    }, [isListening, command, processCommand, isWebSocketConnected]);

    // Show speech recognition errors
    useEffect(() => {
        if (speechError) {
            console.error('Speech recognition error:', speechError);
            setStatus("Error");
            // You could show a toast notification here
        }
    }, [speechError]);

    // Show WebSocket connection errors
    useEffect(() => {
        if (websocketError) {
            console.error('WebSocket error:', websocketError);
            // Don't override status if actively listening
            if (!isListening) {
                setStatus("Connection Error");
            }
        }
    }, [websocketError, isListening]);

    // Handle voice commands
    useEffect(() => {
        if (command.toLowerCase().includes('open settings')) {
            setShowSettings(true);
        } else if (command.toLowerCase().includes('scroll down')) {
            window.scrollBy(0, 200);
        } else if (command.toLowerCase().includes('scroll up')) {
            window.scrollBy(0, -200);
        } else if (command.toLowerCase().includes('go home')) {
            // Navigate to home/dashboard if you have routing
            console.log('Navigate to home');
        }
    }, [command, setShowSettings]);

    return (
        <div className="app-container interactive-area" data-main-app>
            {/* Settings Modal */}
            <UserSettingsModal />

            {/* Voice Commands Popup */}
            <VoiceCommandListPopup />

            {/* User menu in top right */}
            <div className="fixed top-6 right-6 z-50">
                <div className="relative">
                    <GlassButton
                        onClick={() => setShowSettings(true)}
                        className="flex items-center gap-2 px-4 py-2"
                        title="Open Settings"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/20">
                            {user?.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full" />
                            ) : (
                                <span className="text-sm">👤</span>
                            )}
                        </div>
                        <span className="text-white/90 text-sm">{user?.name || 'User'}</span>
                        <span className="text-white/40">⚙️</span>
                    </GlassButton>
                </div>
            </div>

            {/* Render Active Widgets as Draggable */}
            {activeWidgets.map(widget => {

                if (widget.id === 'document-upload') {
                    return (
                        <DraggableWidget key={widget.id} widgetId={widget.id}>
                            <DocumentUploadWidget
                                documents={documents}
                                selectedDocument={selectedDocument}
                                onAddDocument={handleAddDocument}
                                onRemoveDocument={handleRemoveDocument}
                                onSelectDocument={setSelectedDocument}
                                onClose={() => removeWidget(widget.id)}
                            />
                        </DraggableWidget>
                    );
                }

                if (widget.id === 'email-config') {
                    return (
                        <DraggableWidget key={widget.id} widgetId={widget.id}>
                            <EmailConfigWidget
                                onClose={() => removeWidget(widget.id)}
                            />
                        </DraggableWidget>
                    );
                }

                if (widget.id === 'quick-notes') {
                    return (
                        <DraggableWidget key={widget.id} widgetId={widget.id}>
                            <QuickNotesWidget
                                onClose={() => removeWidget(widget.id)}
                            />
                        </DraggableWidget>
                    );
                }

                if (widget.id === 'ai-status-monitor') {
                    return (
                        <DraggableWidget key={widget.id} widgetId={widget.id}>
                            <AIStatusMonitorWidget
                                status={status}
                                onClose={() => removeWidget(widget.id)}
                            />
                        </DraggableWidget>
                    );
                }

                return null;
            })}

            {/* Top center controls */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 flex gap-4">
                <div className="relative">
                    <GlassButton
                        onClick={handleMicToggle}
                        active={isListening}
                        disabled={false}
                        className="w-12 h-12"
                        title={isListening ? "Click to stop listening" : "Click to start listening"}
                    >
                        🎤
                        {isListening && <PulseIndicator color="blue" />}
                        {/* WebSocket connection indicator - only show when stable */}
                        {!isWebSocketConnecting && (
                            <>
                                {!isWebSocketConnected && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white/20" title="AI server not connected"></div>
                                )}
                                {isWebSocketConnected && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white/20" title="AI server connected"></div>
                                )}
                            </>
                        )}
                        {isWebSocketConnecting && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white/20 animate-pulse" title="Connecting to AI server..."></div>
                        )}
                    </GlassButton>
                    {speechError && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1 bg-red-500/90 text-white text-xs rounded-lg whitespace-nowrap z-50">
                            {speechError}
                        </div>
                    )}
                    {websocketError && !isListening && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1 bg-orange-500/90 text-white text-xs rounded-lg whitespace-nowrap z-50 max-w-xs">
                            {websocketError}
                        </div>
                    )}
                </div>
                <div className="relative">
                    <GlassButton
                        onClick={() => setIsVideoActive(!isVideoActive)}
                        active={isVideoActive}
                        className="w-12 h-12"
                    >
                        📷
                        {isVideoActive && <PulseIndicator color="purple" />}
                    </GlassButton>
                </div>
            </div>

            {/* Right side panel */}
            <div className="fixed right-2 top-24 w-72 h-[calc(100vh-96px)]">
                <GlassPanel className="h-full">
                    <div className="h-1/2 p-4 border-b border-white/20 border-dashed">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                👤
                            </div>
                            <h2 className="text-white/90 font-medium">You said</h2>
                        </div>
                        {command ? (
                            <GlassCard>
                                <p className="text-white/90 whitespace-pre-wrap">{command}</p>
                                {isListening && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                        <span className="text-white/60 text-xs">Listening...</span>
                                    </div>
                                )}
                            </GlassCard>
                        ) : (
                            <p className="text-white/40">
                                {isListening ? "Speak now..." : "Waiting for input..."}
                            </p>
                        )}
                    </div>
                    <div className="h-1/2 p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                🤖
                            </div>
                            <h2 className="text-white/90 font-medium">AI Response</h2>
                        </div>
                        {response ? (
                            <GlassCard className="bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                                {response}
                            </GlassCard>
                        ) : (
                            <p className="text-white/40">AI will respond here...</p>
                        )}
                    </div>
                </GlassPanel>
            </div>
        </div>
    );
}

