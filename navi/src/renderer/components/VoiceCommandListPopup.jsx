import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { GlassPanel, GlassButton, GlassCard } from './GlassUI.jsx';

// Voice commands list
const VOICE_COMMANDS = [
    { command: 'Scroll Down', description: 'Scrolls the current page down' },
    { command: 'Scroll Up', description: 'Scrolls the current page up' },
    { command: 'Go Home', description: 'Navigates to the main dashboard' },
    { command: 'Open Settings', description: 'Opens the main settings modal' },
    { command: 'Add Document', description: 'Opens the file picker to add a document' },
    { command: 'Show Documents', description: 'Shows the documents panel' },
    { command: 'Hide Documents', description: 'Hides the documents panel' },
    { command: 'Update Font', description: 'Updates the font in the selected document' },
    { command: 'Send Email', description: 'Sends the selected document via email' },
];

export default function VoiceCommandListPopup() {
    const { showVoiceCommands, setShowVoiceCommands } = useSettings();

    if (!showVoiceCommands) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-end justify-end p-6 pointer-events-none"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    setShowVoiceCommands(false);
                }
            }}
        >
            <GlassPanel className="w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col pointer-events-auto animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/20">
                    <h3 className="text-lg font-semibold text-white/90">Voice Commands</h3>
                    <GlassButton
                        onClick={() => setShowVoiceCommands(false)}
                        className="w-8 h-8 p-0 flex items-center justify-center hover:bg-red-500/20"
                    >
                        <span className="text-lg">×</span>
                    </GlassButton>
                </div>

                {/* Commands List */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-3">
                        {VOICE_COMMANDS.map((cmd, index) => (
                            <VoiceCommandItem 
                                key={index}
                                command={cmd.command}
                                description={cmd.description}
                            />
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/20">
                    <p className="text-white/60 text-xs text-center">
                        Say "Navi" followed by any command to activate it
                    </p>
                </div>
            </GlassPanel>
        </div>
    );
}

// Voice Command Item Component
function VoiceCommandItem({ command, description }) {
    return (
        <GlassCard className="p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-start gap-3">
                <span className="text-blue-400 font-mono text-sm mt-1">🎤</span>
                <div className="flex-1">
                    <p className="text-white/90 font-medium text-sm">{command}</p>
                    <p className="text-white/60 text-xs mt-1">{description}</p>
                </div>
            </div>
        </GlassCard>
    );
}

