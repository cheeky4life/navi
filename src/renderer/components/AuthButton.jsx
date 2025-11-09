import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthButton = () => {
    const { user, isAuthenticated, isLoading, login, logout, error, authConfig } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm text-gray-300">Loading...</span>
            </div>
        );
    }

    if (!authConfig.configured) {
        return (
            <div className="px-4 py-2 bg-yellow-900/30 border border-yellow-500/50 rounded-lg">
                <p className="text-xs text-yellow-300">⚠️ Auth0 not configured</p>
            </div>
        );
    }

    if (isAuthenticated && user) {
        return (
            <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg px-3 py-2">
                    {user.picture && (
                        <img
                            src={user.picture}
                            alt={user.name}
                            className="w-8 h-8 rounded-full"
                        />
                    )}
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{user.name || user.email}</span>
                        {user.email && user.name && (
                            <span className="text-xs text-gray-400">{user.email}</span>
                        )}
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                >
                    Logout
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-2">
            <button
                onClick={login}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium shadow-lg hover:shadow-xl"
            >
                Login with Auth0
            </button>
            {error && (
                <p className="text-xs text-red-400 bg-red-900/30 px-3 py-1 rounded border border-red-500/50">
                    {error}
                </p>
            )}
        </div>
    );
};

export default AuthButton;
