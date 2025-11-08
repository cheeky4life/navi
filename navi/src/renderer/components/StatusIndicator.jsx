import React from "react";

export default function StatusIndicator({ status }) {
    const colorMap = {
        "Idle": "#888",
        "Listening...": "#4AA3F0",
        "Processing...": "#E3B341",
        "Done": "#6CC070"
    };

    return (
        <div className="status-indicator">
            <span
                className="status-dot"
                style={{ backgroundColor: colorMap[status] || "#888" }}
            />
            <p>{status}</p>
        </div>
    );
}
