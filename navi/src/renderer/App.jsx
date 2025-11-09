import React, { useState } from "react";
import WindowControls from "./components/WindowControls.jsx";

export default function App() {
    const [outputText, setOutputText] = useState("Output text will go here");

    return (
        <div className="output-bar">
            <WindowControls />
            <div className="output-content">
                <p>{outputText}</p>
            </div>
        </div>
    );
}
