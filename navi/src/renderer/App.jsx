import React, { useState } from "react";
import CommandInput from "./components/CommandInput.jsx";
import StatusIndicator from "./components/StatusIndicator.jsx";

export default function App() {
    const [status, setStatus] = useState("Idle");
    const [command, setCommand] = useState("");
    const [response, setResponse] = useState("");
    const [history, setHistory] = useState([]);

    const handleCommand = (input) => {
        setCommand(input);
        setStatus("Processing...");

        // Add to history
        const newEntry = {
            command: input,
            timestamp: new Date().toLocaleTimeString(),
            response: null
        };
        
        setHistory(prev => [...prev, newEntry]);

        // Temporary mock  you'll replace this with actual AI routing
        setTimeout(() => {
            const mockResponse = "Processing complete. This will be replaced with actual AI responses.";
            setResponse(mockResponse);
            setStatus("Done");
            
            // Update history with response
            setHistory(prev => {
                const updated = [...prev];
                updated[updated.length - 1].response = mockResponse;
                return updated;
            });
        }, 1500);
    };

    return (
        <div className="app-container">
            <div className="header">
                <div className="logo-section">
                    <div className="logo-glow"></div>
                    <h1 className="app-title">
                        <span className="logo-icon">◆</span>
                        NAVI
                    </h1>
                </div>
                <p className="subtitle">AI-Powered Desktop Assistant</p>
            </div>
            
            <StatusIndicator status={status} />
            
            <div className="main-content">
                {history.length > 0 && (
                    <div className="response-area">
                        {history.map((item, index) => (
                            <div key={index} className="conversation-item">
                                <div className="user-message">
                                    <span className="message-label">You</span>
                                    <p>{item.command}</p>
                                    <span className="timestamp">{item.timestamp}</span>
                                </div>
                                {item.response && (
                                    <div className="ai-message">
                                        <span className="message-label">NAVI</span>
                                        <p>{item.response}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                
                {history.length === 0 && (
                    <div className="welcome-section">
                        <div className="feature-grid">
                            <div className="feature-card">
                                <span className="feature-icon">🎤</span>
                                <p>Voice Commands</p>
                            </div>
                            <div className="feature-card">
                                <span className="feature-icon">🤖</span>
                                <p>AI Assistance</p>
                            </div>
                            <div className="feature-card">
                                <span className="feature-icon">📄</span>
                                <p>Document Analysis</p>
                            </div>
                            <div className="feature-card">
                                <span className="feature-icon">⚡</span>
                                <p>Quick Actions</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <CommandInput onSubmit={handleCommand} />
        </div>
    );
}
