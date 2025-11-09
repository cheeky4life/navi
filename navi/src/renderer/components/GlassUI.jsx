import React from 'react';

export const GlassPanel = ({ children, className = '' }) => (
  <div className={`backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl ${className}`}>
    {children}
  </div>
);

export const GlassButton = ({ children, onClick, active, disabled, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      backdrop-blur-xl rounded-2xl bg-white/10 hover:bg-white/20 
      transition-all duration-200 hover:scale-105 p-4
      flex items-center justify-center
      ${active ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/50' : ''}
      ${disabled ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}
      ${className}
    `}
  >
    {children}
  </button>
);

export const GlassCard = ({ children, className = '' }) => (
  <div className={`
    backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4
    hover:bg-white/10 transition-all duration-200
    ${className}
  `}>
    {children}
  </div>
);

export const PulseIndicator = ({ color = 'blue' }) => (
  <div className={`absolute -top-1 -right-1 flex h-3 w-3`}>
    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color === 'blue' ? 'bg-blue-400' : 'bg-purple-400'} opacity-75`}></span>
    <span className={`relative inline-flex rounded-full h-3 w-3 ${color === 'blue' ? 'bg-blue-500' : 'bg-purple-500'}`}></span>
  </div>
);