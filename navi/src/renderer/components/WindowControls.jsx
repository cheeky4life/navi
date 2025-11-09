import React from "react";

export default function WindowControls() {
    const handleMinimize = () => {
        if (window.electron) {
            window.electron.minimize();
        }
    };

    const handleMaximize = () => {
        if (window.electron) {
            window.electron.maximize();
        }
    };

    const handleClose = () => {
        if (window.electron) {
            window.electron.close();
        }
    };

    return (
        <div className="window-controls">
            <button className="window-btn minimize" onClick={handleMinimize} title="Minimize">
                −
            </button>
            <button className="window-btn maximize" onClick={handleMaximize} title="Maximize">
                □
            </button>
            <button className="window-btn close" onClick={handleClose} title="Close">
                ×
            </button>
        </div>
    );
}
