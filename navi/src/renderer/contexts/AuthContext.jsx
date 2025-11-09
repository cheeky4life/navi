import React, { createContext, useContext, useState, useEffect } from 'react';

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
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check if user is already authenticated on mount
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            if (window.electron?.auth?.getAuthStatus) {
                const status = await window.electron.auth.getAuthStatus();
                if (status.isAuthenticated && status.user) {
                    setUser(status.user);
                    setIsAuthenticated(true);
                }
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (provider) => {
        try {
            setIsLoading(true);
            if (window.electron?.auth?.login) {
                const result = await window.electron.auth.login(provider);
                if (result.success && result.user) {
                    setUser(result.user);
                    setIsAuthenticated(true);
                    return { success: true };
                }
                return { success: false, error: result.error };
            }
            return { success: false, error: 'Auth methods not available' };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            if (window.electron?.auth?.logout) {
                await window.electron.auth.logout();
            }
            setUser(null);
            setIsAuthenticated(false);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const value = {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

