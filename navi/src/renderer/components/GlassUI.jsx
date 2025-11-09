import React from 'react';
import '../styles/GlassUI.css';

export const GlassPanel = ({ children, className = '' }) => (
  <div className={`glass-panel ${className}`}>
    {children}
  </div>
);

export const GlassButton = ({ children, onClick, active, disabled, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`glass-button ${active ? 'active' : ''} ${disabled ? 'disabled' : ''} ${className}`}
  >
    {children}
  </button>
);

export const GlassCard = ({ children, className = '' }) => (
  <div className={`glass-card ${className}`}>
    {children}
  </div>
);

export const PulseIndicator = ({ color = 'blue' }) => (
  <div className={`pulse-indicator ${color}`}>
    <span className="pulse-ping"></span>
    <span className="pulse-dot"></span>
  </div>
);