import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';

import LoginPage from './LoginPage.js';
import Dashboard from './Dashboard.js';

const AuthContext = createContext(null);

const PrivateRoute = ({ children }) => {
    const { isAuthenticated } = useContext(AuthContext);
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return children;
};

function AppContent() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkSession = async () => {
            const API_URL = 'http://localhost/proyek_undangan/api/check_session.php';
            try {
                const response = await fetch(API_URL, { credentials: 'include' });
                const data = await response.json();
                if (data.status === 'success' && data.is_logged_in) {
                    setIsAuthenticated(true);
                    setUser(data.user);
                } else {
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error("Tidak bisa memeriksa sesi:", error);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };
        checkSession();
    }, []);

    const handleLogin = (userData) => {
        setIsAuthenticated(true);
        setUser(userData);
        navigate('/dashboard');
    };

    const handleLogout = async () => {
        const API_URL = 'http://localhost/proyek_undangan/api/logout.php';
        try {
            await fetch(API_URL, { credentials: 'include' });
        } catch (error) {
            console.error("Error saat logout:", error);
        } finally {
            setIsAuthenticated(false);
            setUser(null);
            navigate('/login');
        }
    };

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Memeriksa status login...</div>;
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, user }}>
            <Routes>
                <Route 
                    path="/login" 
                    element={!isAuthenticated ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/dashboard" />} 
                />
                <Route 
                    path="/dashboard" 
                    element={
                        <PrivateRoute>
                            <Dashboard handleLogout={handleLogout} />
                        </PrivateRoute>
                    } 
                />
                <Route 
                    path="*" 
                    element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
                />
            </Routes>
        </AuthContext.Provider>
    );
}

export default function App() {
    return <AppContent />;
}
