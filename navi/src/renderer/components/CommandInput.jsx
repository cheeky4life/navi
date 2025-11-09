import React, { useState, useEffect, useRef } from "react";

export default function CommandInput({ onSubmit }) {
    const [input, setInput] = useState("");
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    useEffect(() => {
        // Initialize speech recognition
        if (window.webkitSpeechRecognition) {
            const SpeechRecognition = window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            
            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim() === "") return;
        onSubmit(input);
        setInput("");
    };

    const handleVoiceInput = () => {
        if (!recognitionRef.current) {
            alert('Speech recognition is not supported in this browser.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    return (
        <form className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[600px]" onSubmit={handleSubmit}>
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-2 flex gap-2">
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-transparent border-none text-white placeholder-white/40 focus:outline-none px-4"
                />
                <button
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200"
                    type="submit"
                    title="Send"
                >
                    <span role="img" aria-label="send" className="text-lg">↗️</span>
                </button>
            </div>
        </form>
    );
}
