import React, { useState } from "react";

export default function CommandInput({ onSubmit }) {
    const [input, setInput] = useState("");
    const [isListening, setIsListening] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim() === "") return;
        onSubmit(input);
        setInput("");
    };

    const handleVoiceInput = () => {
        setIsListening(!isListening);
        // Voice input functionality will be implemented later
        // For now, just toggle the visual state
    };

    return (
        <form className="command-form" onSubmit={handleSubmit}>
            <div className="input-wrapper">
                <button 
                    type="button"
                    className={`voice-btn ${isListening ? 'listening' : ''}`}
                    onClick={handleVoiceInput}
                    title="Voice input (coming soon)"
                >
                    <span className="mic-icon">🎤</span>
                </button>
                <input
                    className="command-input"
                    type="text"
                    placeholder='Type a command or click the mic...'
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                <button className="submit-btn" type="submit">
                    <span className="send-icon">→</span>
                </button>
            </div>
        </form>
    );
}
