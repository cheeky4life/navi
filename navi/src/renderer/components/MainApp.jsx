import React, { useState, useEffect, useRef, useCallback } from "react";
import { GlassPanel, GlassButton, GlassCard, PulseIndicator } from "./GlassUI.jsx";
import { useAuth } from "../contexts/AuthContext";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { getFileIcon, formatFileSize, getRelativeTime } from "../utils/documentUtils";
import { parseCommand, executeCommand } from "../utils/commandParser";
import "./../styles/app.css";

export default function MainApp() {
    const { user, logout } = useAuth();
    const [status, setStatus] = useState("Idle");
    const [command, setCommand] = useState("");
    const [response, setResponse] = useState("");
    const [history, setHistory] = useState([]);
    const [isVideoActive, setIsVideoActive] = useState(false);
    const [showDocuments, setShowDocuments] = useState(true);
    const [showQuickSearch, setShowQuickSearch] = useState(true);
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

    // Speech recognition hook
    const {
        isListening,
        startListening,
        stopListening,
        error: speechError,
        transcript,
    } = useSpeechRecognition({
        onTranscript: (transcript, isInterim) => {
            // Update command in real-time as user speaks
            setCommand(transcript);
            if (isInterim) {
                setStatus("Listening...");
            } else {
                setStatus("Processing...");
            }
        },
        onFinalTranscript: (finalTranscript) => {
            // Final transcript received
            setCommand(finalTranscript);
            setStatus("Processing...");
        },
        silenceTimeout: 3000, // 3 seconds of silence before auto-stop
        language: 'en-US',
    });

    // Handle mic button toggle
    const handleMicToggle = () => {
        if (isListening) {
            stopListening();
            setStatus("Idle");
        } else {
            setCommand(""); // Clear previous command
            lastProcessedCommandRef.current = ''; // Reset processed command tracking
            startListening();
            setStatus("Listening...");
        }
    };

    // Process voice command
    const processCommand = useCallback(async (commandText) => {
        try {
            // Remove "Navi" prefix if present for cleaner parsing
            const cleanedCommand = commandText.replace(/^navi\s+/i, '').trim();

            // Parse the command
            const parsedCommand = parseCommand(cleanedCommand);

            // Update status based on command
            if (parsedCommand.action) {
                setStatus(`Processing: ${parsedCommand.action}...`);
            }

            // Execute the command
            const onProgress = (message) => {
                setStatus(message);
            };

            const results = await executeCommand(parsedCommand, documents, onProgress);

            // Format response - combine results for chained commands
            let responseText = '';
            if (results.length > 0) {
                const successResults = results.filter(r => r.success);
                const errorResults = results.filter(r => !r.success);

                if (errorResults.length > 0) {
                    // If there are errors, show the error message
                    responseText = errorResults[0].message || 'Failed to execute command.';
                } else if (successResults.length > 0) {
                    // Combine success messages for chained commands
                    if (results.length > 1) {
                        responseText = results.map(r => r.message).filter(Boolean).join(' ');
                    } else {
                        responseText = results[0].message || 'Command executed successfully.';
                    }
                } else {
                    responseText = "Command processed.";
                }
            } else {
                responseText = "I understood your command. Processing...";
            }

            setResponse(responseText);
            setStatus("Done");

            // Update history with response
            setHistory(prev => {
                const updated = [...prev];
                if (updated.length > 0) {
                    updated[updated.length - 1].response = responseText;
                }
                return updated;
            });
        } catch (error) {
            console.error('Error processing command:', error);
            const errorMessage = "I encountered an error processing your command. Please try again.";
            setResponse(errorMessage);
            setStatus("Error");

            // Update history with error
            setHistory(prev => {
                const updated = [...prev];
                if (updated.length > 0) {
                    updated[updated.length - 1].response = errorMessage;
                }
                return updated;
            });
        }
    }, [documents]);

    // Handle command processing (when speech recognition stops)
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

            // Parse and execute command
            processCommand(commandToProcess);
        }
    }, [isListening, command, processCommand]);

    // Show speech recognition errors
    useEffect(() => {
        if (speechError) {
            console.error('Speech recognition error:', speechError);
            setStatus("Error");
            // You could show a toast notification here
        }
    }, [speechError]);

    return (
        <div className="app-container interactive-area" data-main-app>
            {/* User menu in top right */}
            <div className="fixed top-6 right-6 z-50">
                <div className="relative">
                    <GlassButton
                        onClick={() => { }}
                        className="flex items-center gap-2 px-4 py-2"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/20">
                            {user?.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full" />
                            ) : (
                                <span className="text-sm">👤</span>
                            )}
                        </div>
                        <span className="text-white/90 text-sm">{user?.name || 'User'}</span>
                        <span className="text-white/40">▼</span>
                    </GlassButton>
                    {/* Dropdown menu - could be expanded later */}
                </div>
            </div>

            {/* Left side panels */}
            <div className="fixed left-6 top-24 w-80 flex flex-col gap-4">
                {showDocuments && (
                    <GlassPanel className="h-[400px]">
                        <div className="flex justify-between items-center p-4 border-b border-white/20">
                            <h2 className="text-white/90 font-medium">Documents</h2>
                            <div className="flex gap-2">
                                <GlassButton
                                    onClick={handleAddDocument}
                                    className="w-8 h-8 p-0 flex items-center justify-center hover:bg-green-500/20 transition-colors"
                                    title="Add document"
                                >
                                    <span className="text-lg">+</span>
                                </GlassButton>
                                <GlassButton
                                    onClick={() => setShowDocuments(false)}
                                    className="w-8 h-8 p-0 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                                    title="Close panel"
                                >
                                    <span className="text-lg">×</span>
                                </GlassButton>
                            </div>
                        </div>
                        <div className="p-4 space-y-2 overflow-y-auto max-h-[332px]">
                            {documents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-center">
                                    <div className="text-4xl mb-2">📁</div>
                                    <p className="text-white/60 text-sm mb-2">No documents yet</p>
                                    <p className="text-white/40 text-xs">Click + to add a document</p>
                                </div>
                            ) : (
                                documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="group"
                                    >
                                        <GlassCard
                                            className={`cursor-pointer transition-all hover:bg-white/15 ${selectedDocument?.id === doc.id ? 'ring-2 ring-blue-500/50 bg-white/10' : ''
                                                }`}
                                            onClick={() => setSelectedDocument(doc)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl flex-shrink-0">{getFileIcon(doc.name)}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white/90 text-sm font-medium truncate" title={doc.name}>
                                                        {doc.name}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <p className="text-white/60 text-xs">
                                                            {getRelativeTime(new Date(doc.addedAt))}
                                                        </p>
                                                        {doc.size > 0 && (
                                                            <>
                                                                <span className="text-white/40">•</span>
                                                                <p className="text-white/60 text-xs">
                                                                    {formatFileSize(doc.size)}
                                                                </p>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveDocument(doc.id);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded p-1 transition-all text-white/60 hover:text-red-400 flex-shrink-0 w-6 h-6 flex items-center justify-center"
                                                    title="Remove document"
                                                >
                                                    <span className="text-lg leading-none">×</span>
                                                </button>
                                            </div>
                                        </GlassCard>
                                    </div>
                                ))
                            )}
                        </div>
                    </GlassPanel>
                )}

                {showQuickSearch && (
                    <GlassPanel className="h-[300px]">
                        <div className="flex justify-between items-center p-4 border-b border-white/20">
                            <h2 className="text-white/90 font-medium">Quick Search</h2>
                            <GlassButton onClick={() => setShowQuickSearch(false)}>×</GlassButton>
                        </div>
                        <div className="p-4">
                            <GlassButton className="w-full mb-4">
                                <span className="mr-2">✨</span>
                                Tap to ask
                            </GlassButton>
                            {/* Quick search content */}
                        </div>
                    </GlassPanel>
                )}
            </div>

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
                    </GlassButton>
                    {speechError && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1 bg-red-500/90 text-white text-xs rounded-lg whitespace-nowrap z-50">
                            {speechError}
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

