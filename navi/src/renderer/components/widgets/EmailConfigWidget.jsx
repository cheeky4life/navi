import React from 'react';
import { GlassPanel, GlassButton, GlassCard } from '../GlassUI.jsx';

export default function EmailConfigWidget({ onClose }) {
    return (
        <GlassPanel className="w-80 h-[300px] shadow-lg">
            <div className="flex justify-between items-center p-4 border-b border-white/20 cursor-grab active:cursor-grabbing">
                <h2 className="text-white/90 font-medium flex-1">Email Config</h2>
                {onClose && (
                    <div onClick={(e) => e.stopPropagation()}>
                        <GlassButton
                            onClick={onClose}
                            className="w-8 h-8 p-0 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                            title="Close panel"
                        >
                            <span className="text-lg">×</span>
                        </GlassButton>
                    </div>
                )}
            </div>
            <div className="p-4">
                <GlassCard className="p-4">
                    <p className="text-white/80 text-sm mb-4">
                        Configure your email settings here.
                    </p>
                    <p className="text-white/60 text-xs">
                        Email configuration will be available soon.
                    </p>
                </GlassCard>
            </div>
        </GlassPanel>
    );
}

