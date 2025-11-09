import React, { useState } from 'react';
import { useSettings, AVAILABLE_WIDGETS } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { GlassPanel, GlassButton, GlassCard } from './GlassUI.jsx';

export default function UserSettingsModal() {
    const {
        theme,
        toggleTheme,
        activeWidgets,
        addWidget,
        removeWidget,
        showSettings,
        setShowSettings,
        setShowVoiceCommands,
    } = useSettings();
    const { user } = useAuth();
    const [activeSection, setActiveSection] = useState('account');

    if (!showSettings) return null;

    const activeWidgetIds = activeWidgets.map(w => w.id);
    const availableWidgetsList = Object.keys(AVAILABLE_WIDGETS).filter(
        id => !activeWidgetIds.includes(id)
    );

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    setShowSettings(false);
                }
            }}
        >
            <GlassPanel className="w-full max-w-4xl max-h-[90vh] mx-4 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/20">
                    <h2 className="text-2xl font-bold text-white/90">Settings</h2>
                    <GlassButton
                        onClick={() => setShowSettings(false)}
                        className="w-8 h-8 p-0 flex items-center justify-center hover:bg-red-500/20"
                    >
                        <span className="text-lg">×</span>
                    </GlassButton>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Navigation */}
                    <div className="w-64 border-r border-white/20 p-4 space-y-2 overflow-y-auto">
                        <NavButton
                            active={activeSection === 'account'}
                            onClick={() => setActiveSection('account')}
                            icon="👤"
                            label="Account"
                        />
                        <NavButton
                            active={activeSection === 'widgets'}
                            onClick={() => setActiveSection('widgets')}
                            icon="🔲"
                            label="Widget Management"
                        />
                        <NavButton
                            active={activeSection === 'theme'}
                            onClick={() => setActiveSection('theme')}
                            icon="🎨"
                            label="Theme"
                        />
                        <NavButton
                            active={activeSection === 'voice'}
                            onClick={() => setActiveSection('voice')}
                            icon="🎤"
                            label="Voice Commands"
                        />
                    </div>

                    {/* Content Are */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {activeSection === 'account' && <AccountSection user={user} />}
                        {activeSection === 'widgets' && (
                            <WidgetManagementSection
                                activeWidgets={activeWidgets}
                                availableWidgets={availableWidgetsList}
                                addWidget={addWidget}
                                removeWidget={removeWidget}
                                widgetsConfig={AVAILABLE_WIDGETS}
                            />
                        )}
                        {activeSection === 'theme' && (
                            <ThemeSection theme={theme} toggleTheme={toggleTheme} />
                        )}
                        {activeSection === 'voice' && (
                            <VoiceCommandsSection
                                onViewCommands={() => {
                                    setShowVoiceCommands(true);
                                    setShowSettings(false);
                                }}
                            />
                        )}
                    </div>
                </div>
            </GlassPanel>
        </div>
    );
}

// Navigation Button Component
function NavButton({ active, onClick, icon, label }) {
    return (
        <button
            onClick={onClick}
            className={`
                w-full p-3 rounded-lg text-left transition-all
                ${active
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:bg-white/10 hover:text-white/80'
                }
            `}
        >
            <span className="mr-3">{icon}</span>
            <span>{label}</span>
        </button>
    );
}

// Account Section
function AccountSection({ user }) {
    return (
        <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white/90 mb-4">Account</h3>
            <GlassCard className="p-4">
                <div className="space-y-3">
                    <div>
                        <label className="text-sm text-white/60">Name</label>
                        <p className="text-white/90 mt-1">{user?.name || 'Not available'}</p>
                    </div>
                    <div>
                        <label className="text-sm text-white/60">Email</label>
                        <p className="text-white/90 mt-1">{user?.email || 'Not available'}</p>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}

// Widget Management Section
function WidgetManagementSection({
    activeWidgets,
    availableWidgets,
    addWidget,
    removeWidget,
    widgetsConfig
}) {
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white/90 mb-4">Widget Management</h3>

            {/* Active Widgets */}
            <div>
                <h4 className="text-lg font-medium text-white/80 mb-3">Active Widgets</h4>
                <div className="space-y-2">
                    {activeWidgets.length === 0 ? (
                        <GlassCard className="p-4 text-center text-white/60">
                            No active widgets
                        </GlassCard>
                    ) : (
                        activeWidgets.map(widget => (
                            <WidgetItem
                                key={widget.id}
                                widgetId={widget.id}
                                widgetName={widgetsConfig[widget.id]?.name || widget.id}
                                widgetIcon={widgetsConfig[widget.id]?.icon || '🔲'}
                                isActive={true}
                                onToggle={() => removeWidget(widget.id)}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Available Widgets */}
            <div>
                <h4 className="text-lg font-medium text-white/80 mb-3">Available Widgets</h4>
                <div className="space-y-2">
                    {availableWidgets.length === 0 ? (
                        <GlassCard className="p-4 text-center text-white/60">
                            All widgets are active
                        </GlassCard>
                    ) : (
                        availableWidgets.map(widgetId => (
                            <WidgetItem
                                key={widgetId}
                                widgetId={widgetId}
                                widgetName={widgetsConfig[widgetId]?.name || widgetId}
                                widgetIcon={widgetsConfig[widgetId]?.icon || '🔲'}
                                isActive={false}
                                onToggle={() => addWidget(widgetId)}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// Widget Item Component
function WidgetItem({ widgetId, widgetName, widgetIcon, isActive, onToggle }) {
    return (
        <GlassCard className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <span className="text-2xl">{widgetIcon}</span>
                <div>
                    <p className="text-white/90 font-medium">{widgetName}</p>
                    <p className="text-white/60 text-xs">{widgetId}</p>
                </div>
            </div>
            <GlassButton
                onClick={onToggle}
                className={`px-4 py-2 ${isActive
                        ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300'
                        : 'bg-green-500/20 hover:bg-green-500/30 text-green-300'
                    }`}
            >
                {isActive ? 'Remove' : 'Add'}
            </GlassButton>
        </GlassCard>
    );
}

// Theme Section
function ThemeSection({ theme, toggleTheme }) {
    return (
        <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white/90 mb-4">Theme</h3>
            <GlassCard className="p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-white/90 font-medium">Theme Mode</p>
                        <p className="text-white/60 text-sm mt-1">
                            Current: {theme === 'dark' ? 'Dark' : 'Light'}
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={theme === 'dark'}
                            onChange={toggleTheme}
                            className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                        <span className="ml-3 text-sm text-white/80">
                            {theme === 'dark' ? 'Dark' : 'Light'}
                        </span>
                    </label>
                </div>
            </GlassCard>
        </div>
    );
}

// Voice Commands Section
function VoiceCommandsSection({ onViewCommands }) {
    return (
        <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white/90 mb-4">Voice Commands</h3>
            <GlassCard className="p-4">
                <p className="text-white/80 mb-4">
                    View available voice commands that you can use with Navi.
                </p>
                <GlassButton
                    onClick={onViewCommands}
                    className="w-full py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300"
                >
                    View Voice Commands
                </GlassButton>
            </GlassCard>
        </div>
    );
}

