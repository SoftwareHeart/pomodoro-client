// src/components/Profile.js
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';

function Profile() {
    const { currentUser, logout } = useAuth();
    const { showVisualNotification } = useNotification();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        showVisualNotification('Başarıyla çıkış yapıldı', 'info', 3000);
        navigate('/login');
    };

    if (!currentUser) {
        return <div>Yükleniyor...</div>;
    }

    return (
        <div className="profile-container">
            <div className="profile-card">
                <h2>Kullanıcı Profili</h2>
                <div className="profile-info">
                    <div className="profile-avatar">
                        {currentUser.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="profile-details">
                        <div className="profile-item">
                            <span className="profile-label">Kullanıcı Adı:</span>
                            <span className="profile-value">{currentUser.username}</span>
                        </div>
                        <div className="profile-item">
                            <span className="profile-label">E-posta:</span>
                            <span className="profile-value">{currentUser.email}</span>
                        </div>
                    </div>
                </div>
                <div className="profile-actions">
                    <button className="profile-logout-btn" onClick={handleLogout}>
                        Çıkış Yap
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Profile;