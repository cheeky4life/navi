import React from "react";

export default function App() {
    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            fontFamily: 'sans-serif'
        }}>
            <h1 style={{ fontSize: '3rem', margin: 0 }}>◆ NAVI</h1>
            <p style={{ fontSize: '1.2rem', color: '#94a3b8' }}>Testing if React works...</p>
            <div style={{
                marginTop: '20px',
                padding: '20px',
                background: 'rgba(99, 102, 241, 0.2)',
                borderRadius: '12px'
            }}>
                <p>✅ If you can see this, React is working!</p>
            </div>
        </div>
    );
}
