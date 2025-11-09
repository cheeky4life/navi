import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [authConfig, setAuthConfig] = useState({ configured: false });

    // Check auth status on mount
    useEffect(() => {
        checkAuthStatus();
        checkAuthConfig();
    }, []);

    const checkAuthConfig = async () => {
        try {
            if (window.auth && window.auth.getConfig) {
                const config = await window.auth.getConfig();
                setAuthConfig(config);
            }
        } catch (err) {
            console.error('Failed to check auth config:', err);
        }
    };

    const checkAuthStatus = async () => {
        try {
            setIsLoading(true);
            if (window.auth && window.auth.getStatus) {
                const status = await window.auth.getStatus();
                setIsAuthenticated(status.isAuthenticated);
                setUser(status.user);
            }
        } catch (err) {
            console.error('Failed to check auth status:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const login = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            if (!window.auth || !window.auth.login) {
                throw new Error('Auth module not available');
            }

            const result = await window.auth.login();

            if (result.success) {
                setIsAuthenticated(true);
                setUser(result.user);
                return { success: true };
            } else {
                throw new Error(result.error || 'Login failed');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            if (!window.auth || !window.auth.logout) {
                throw new Error('Auth module not available');
            }

            const result = await window.auth.logout();

            if (result.success) {
                setIsAuthenticated(false);
                setUser(null);
                return { success: true };
            } else {
                throw new Error(result.error || 'Logout failed');
            }
        } catch (err) {
            console.error('Logout error:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const value = {
        user,
        isAuthenticated,
        isLoading,
        error,
        authConfig,
        login,
        logout,
        checkAuthStatus,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
