import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import AuthButton from './components/AuthButton';
import CommandInput from './components/CommandInput';
import StatusIndicator from './components/StatusIndicator';
import VoiceInput from './components/VoiceInput';

const App = () => {
    return (
        <AuthProvider>
            <div className="min-h-screen bg-black/30 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-8">
                    <div className="grid gap-8">
                        {/* Auth Section */}
                        <div className="flex justify-end">
                            <AuthButton />
                        </div>

                        <StatusIndicator />
                        <CommandInput />
                        <VoiceInput />
                    </div>
                </div>
            </div>
        </AuthProvider>
    );
};

export default App;