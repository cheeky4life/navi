import React from "react";

export default function StatusIndicator({ status }) {
    const statusConfig = {
        "Idle": { 
            color: "#6366f1", 
            icon: "●",
            pulse: false 
        },
        "Listening...": { 
            color: "#3b82f6", 
            icon: "🎤",
            pulse: true 
        },
        "Processing...": { 
            color: "#f59e0b", 
            icon: "⚡",
            pulse: true 
        },
        "Done": { 
            color: "#10b981", 
            icon: "✓",
            pulse: false 
        }
    };

    const config = statusConfig[status] || statusConfig["Idle"];

    return (
        <div className="status-indicator">
            <div className="status-content">
                <span
                    className={`status-dot ${config.pulse ? 'pulse' : ''}`}
                    style={{ backgroundColor: config.color }}
                />
                <span className="status-icon">{config.icon}</span>
                <p className="status-text">{status}</p>
            </div>
        </div>
    );
}
