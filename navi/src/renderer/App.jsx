import React, { useState } from "react";
import CommandInput from "./components/CommandInput.jsx";
import StatusIndicator from "./components/StatusIndicator.jsx";

export default function App() {
    const [status, setStatus] = useState("Idle");
    const [command, setCommand] = useState("");

    const handleCommand = (input) => {
        setCommand(input);
        setStatus("Processing...");

        // Temporary mock — you’ll replace this with actual AI routing
        setTimeout(() => {
            setStatus("Done");
        }, 1500);
    };

    return (
        <div className="app-container">
            <h1 className="app-title">🧠 NAVI</h1>
            <StatusIndicator status={status} />
            <CommandInput onSubmit={handleCommand} />
            {command && <p className="command-display">“{command}”</p>}
        </div>
    );
}
