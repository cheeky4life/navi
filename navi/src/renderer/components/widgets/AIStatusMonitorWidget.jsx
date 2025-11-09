import React from 'react';
import { GlassPanel, GlassButton, GlassCard } from '../GlassUI.jsx';
import { PulseIndicator } from '../GlassUI.jsx';

export default function AIStatusMonitorWidget({ status, onClose }) {
    return (
        <GlassPanel className="w-80 h-[300px] shadow-lg">
            <div className="flex justify-between items-center p-4 border-b border-white/20 cursor-grab active:cursor-grabbing">
                <h2 className="text-white/90 font-medium flex-1">AI Status Monitor</h2>
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
            <div className="p-4 space-y-3">
                <GlassCard className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <PulseIndicator color="blue" />
                        <div>
                            <p className="text-white/90 font-medium">Status</p>
                            <p className="text-white/60 text-sm">{status || 'Idle'}</p>
                        </div>
                    </div>
                    <div className="space-y-2 text-xs text-white/60">
                        <p>• Gemini API: Connected</p>
                        <p>• Speech Recognition: Active</p>
                        <p>• Voice Commands: Enabled</p>
                    </div>
                </GlassCard>
            </div>
        </GlassPanel>
    );
}

