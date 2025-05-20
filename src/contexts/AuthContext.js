// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Sayfa yenilendiğinde localStorage'dan kullanıcı bilgilerini al
    useEffect(() => {
        const storedUser = localStorage.getItem('pomodoroUser');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setCurrentUser(parsedUser);
            } catch (error) {
                console.error('Stored user parsing error:', error);
                localStorage.removeItem('pomodoroUser');
            }
        }
        setLoading(false);
    }, []);

    // Kullanıcı girişi
    const login = async (username, password) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('https://localhost:7023/api/User/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Giriş yapılamadı');
            }

            const userData = await response.json();

            // Kullanıcı bilgilerini ve token'ı sakla
            const user = {
                id: userData.userId,
                username: userData.username,
                email: userData.email,
                token: userData.token
            };

            localStorage.setItem('pomodoroUser', JSON.stringify(user));
            setCurrentUser(user);
            setLoading(false);
            return user;
        } catch (error) {
            setError(error.message);
            setLoading(false);
            throw error;
        }
    };

    // Kullanıcı kaydı
    const register = async (username, email, password, confirmPassword) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('https://localhost:7023/api/User/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password, confirmPassword }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                let errorMessage = 'Kayıt yapılamadı';

                if (errorData.errors) {
                    // Validation errors
                    errorMessage = Object.values(errorData.errors)
                        .flat()
                        .join('\n');
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                }

                throw new Error(errorMessage);
            }

            setLoading(false);
            return true;
        } catch (error) {
            setError(error.message);
            setLoading(false);
            throw error;
        }
    };

    // Kullanıcı çıkışı
    const logout = () => {
        localStorage.removeItem('pomodoroUser');
        setCurrentUser(null);
    };

    // Bearer token'ı döndür
    const getAuthHeader = () => {
        if (currentUser && currentUser.token) {
            return { Authorization: `Bearer ${currentUser.token}` };
        }
        return {};
    };

    // JWT token'ın geçerli olup olmadığını kontrol et
    const isAuthenticated = () => {
        if (!currentUser || !currentUser.token) {
            return false;
        }

        // Token parsing ve expiry kontrolü yapabilirsiniz
        // Basit kontrol için sadece token varlığını kontrol ediyoruz
        return true;
    };

    const contextValue = {
        currentUser,
        loading,
        error,
        login,
        register,
        logout,
        getAuthHeader,
        isAuthenticated
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};