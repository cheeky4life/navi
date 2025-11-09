import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GlassPanel, GlassButton, GlassCard } from './GlassUI.jsx';

const OAuthProvider = ({ provider, icon, name, color, onClick, isLoading }) => {
    return (
        <GlassButton
            onClick={onClick}
            disabled={isLoading}
            className={`
        w-full p-6 flex items-center justify-center gap-4
        transition-all duration-300 hover:scale-105
        disabled:opacity-50 disabled:cursor-not-allowed
        ${color}
      `}
        >
            <span className="text-3xl">{icon}</span>
            <span className="text-white/90 font-semibold text-lg">
                {isLoading ? 'Connecting...' : `Continue with ${name}`}
            </span>
        </GlassButton>
    );
};

export default function LoginPage() {
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [loadingProvider, setLoadingProvider] = useState(null);
    const [error, setError] = useState(null);

    const handleLogin = async (provider) => {
        setError(null);
        setLoadingProvider(provider);
        setIsLoading(true);

        try {
            const result = await login(provider);
            if (!result.success) {
                setError(result.error || 'Authentication failed. Please try again.');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
            setLoadingProvider(null);
        }
    };

    return (
        <div className="w-screen h-screen flex items-center justify-center app-container interactive-area">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20"></div>

            <GlassPanel className="w-full max-w-md mx-4 p-8 md:p-12 relative z-10">
                {/* Logo/Branding */}
                <div className="text-center mb-8">
                    <div className="inline-block mb-4">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center backdrop-blur-xl border border-white/20">
                            <span className="text-4xl">🚀</span>
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        NAVI
                    </h1>
                    <p className="text-white/60 text-sm">
                        Your AI-powered assistant
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <GlassCard className="mb-6 p-4 bg-red-500/10 border-red-500/30">
                        <p className="text-red-300 text-sm text-center mb-2">{error}</p>
                        {error.includes('connection is not enabled') && (
                            <div className="text-red-200 text-xs text-center mt-2 space-y-1">
                                <p>To fix this:</p>
                                <ol className="list-decimal list-inside space-y-1 text-left max-w-md mx-auto">
                                    <li>Go to Auth0 Dashboard → Authentication → Social</li>
                                    <li>Enable Google connection</li>
                                    <li>Make sure it's enabled for your application</li>
                                    <li>Configure Google OAuth credentials if needed</li>
                                </ol>
                            </div>
                        )}
                    </GlassCard>
                )}

                {/* OAuth Providers */}
                <div className="space-y-4 mb-6">
                    <OAuthProvider
                        provider="google"
                        icon="🔵"
                        name="Google"
                        color="hover:bg-blue-500/20"
                        onClick={() => handleLogin('google')}
                        isLoading={isLoading && loadingProvider === 'google'}
                    />

                    <OAuthProvider
                        provider="github"
                        icon="⚫"
                        name="GitHub"
                        color="hover:bg-gray-500/20"
                        onClick={() => handleLogin('github')}
                        isLoading={isLoading && loadingProvider === 'github'}
                    />

                    <OAuthProvider
                        provider="discord"
                        icon="💜"
                        name="Discord"
                        color="hover:bg-indigo-500/20"
                        onClick={() => handleLogin('discord')}
                        isLoading={isLoading && loadingProvider === 'discord'}
                    />
                </div>

                {/* Divider */}
                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/20"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-transparent text-white/40">or</span>
                    </div>
                </div>

                {/* Sign up hint */}
                <p className="text-center text-white/50 text-sm">
                    New to NAVI? Sign up with any provider above
                </p>

                {/* Loading overlay */}
                {isLoading && (
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                            <p className="text-white/70 text-sm">Authenticating...</p>
                        </div>
                    </div>
                )}
            </GlassPanel>
        </div>
    );
}

