import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext(null);

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

// Available widgets configuration
export const AVAILABLE_WIDGETS = {
    'document-upload': { name: 'Document Upload', icon: '📁' },
    'email-config': { name: 'Email Config', icon: '📧' },
    'voice-command-list': { name: 'Voice Commands', icon: '🎤' },
    'quick-notes': { name: 'Quick Notes', icon: '📝' },
    'ai-status-monitor': { name: 'AI Status Monitor', icon: '🤖' },
};

// Initial active widgets with positions
const getInitialWidgets = () => {
    const saved = localStorage.getItem('navi_widgets');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Error loading widgets:', e);
        }
    }
    // Default active widgets with positions
    return [
        { id: 'document-upload', x: 50, y: 100 },
        { id: 'email-config', x: 50, y: 300 },
    ];
};

export const SettingsProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('navi_theme');
        return saved || 'dark';
    });
    
    const [activeWidgets, setActiveWidgets] = useState(getInitialWidgets);
    const [showSettings, setShowSettings] = useState(false);
    const [showVoiceCommands, setShowVoiceCommands] = useState(false);

    // Save widgets to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('navi_widgets', JSON.stringify(activeWidgets));
    }, [activeWidgets]);

    // Save theme to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('navi_theme', theme);
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    // Apply theme on mount
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, []);

    // Add widget to active list
    const addWidget = (widgetId) => {
        if (!activeWidgets.find(w => w.id === widgetId)) {
            // Calculate default position (stack vertically)
            const lastWidget = activeWidgets[activeWidgets.length - 1];
            const newY = lastWidget ? lastWidget.y + 200 : 100;
            
            setActiveWidgets(prev => [...prev, { 
                id: widgetId, 
                x: 50, 
                y: newY 
            }]);
        }
    };

    // Remove widget from active list
    const removeWidget = (widgetId) => {
        setActiveWidgets(prev => prev.filter(w => w.id !== widgetId));
    };

    // Update widget position
    const updateWidgetPosition = (widgetId, x, y) => {
        setActiveWidgets(prev => 
            prev.map(w => 
                w.id === widgetId 
                    ? { ...w, x, y }
                    : w
            )
        );
    };

    // Toggle theme
    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const value = {
        theme,
        toggleTheme,
        activeWidgets,
        addWidget,
        removeWidget,
        updateWidgetPosition,
        showSettings,
        setShowSettings,
        showVoiceCommands,
        setShowVoiceCommands,
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

