import React from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginPage from "./components/LoginPage";
import MainApp from "./components/MainApp";
import "./styles/app.css";

function AppContent() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="w-screen h-screen flex items-center justify-center app-container">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                    <p className="text-white/70 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    return isAuthenticated ? <MainApp /> : <LoginPage />;
}

export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}
