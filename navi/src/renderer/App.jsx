import React from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import LoginPage from "./components/LoginPage";
import MainApp from "./components/MainApp";
import WindowControls from "./components/WindowControls";
import "./styles/app.css";

function AppContent() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="app-container">
                <WindowControls />
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">Loading...</p>
                </div>
            </div>
        );
    }

    return isAuthenticated ? <MainApp /> : <LoginPage />;
}

export default function App() {
    return (
        <AuthProvider>
            <SettingsProvider>
                <AppContent />
            </SettingsProvider>
        </AuthProvider>
    );
}
