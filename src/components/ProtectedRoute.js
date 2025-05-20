// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { currentUser, loading, isAuthenticated } = useAuth();

    if (loading) {
        return <div className="loading">Yükleniyor...</div>;
    }

    if (!isAuthenticated()) {
        return <Navigate to="/login" />;
    }

    return children;
};

export default ProtectedRoute;