import React, { useState } from "react";

export default function CommandInput({ onSubmit }) {
    const [input, setInput] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim() === "") return;
        onSubmit(input);
        setInput("");
    };

    return (
        <form className="command-form" onSubmit={handleSubmit}>
            <input
                className="command-input"
                type="text"
                placeholder='Say or type a command (e.g. "Summarize this PDF")'
                value={input}
                onChange={(e) => setInput(e.target.value)}
            />
            <button className="submit-btn" type="submit">
                Send
            </button>
        </form>
    );
}
