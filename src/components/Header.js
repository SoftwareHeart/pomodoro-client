// src/components/Header.js
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import ThemeSelector from './ThemeSelector';
import NotificationSettings from './NotificationSettings';

function Header() {
    const { currentUser, isAuthenticated, logout } = useAuth();
    const { showVisualNotification } = useNotification();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef(null);

    // Dışarı tıklandığında profil menüsünü kapatma
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        logout();
        showVisualNotification('Başarıyla çıkış yapıldı', 'info', 3000);
        setIsProfileOpen(false);
        navigate('/');
    };

    return (
        <div className="app-header-container">
            <header>
                <div className="header-left">
                    <h1>
                        <Link to="/" className="logo-link">
                            Pomodoro Zamanlayıcı
                        </Link>
                    </h1>
                </div>

                <nav className="main-navigation">
                    <Link to="/" className="nav-link">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                        <span className="nav-text">Ana Sayfa</span>
                    </Link>
                    <Link to="/calendar" className="nav-link">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span className="nav-text">Takvim</span>
                    </Link>
                </nav>

                <div className="app-controls">
                    {isAuthenticated() && (
                        <div className="user-profile-container" ref={profileRef}>
                            <button
                                className="profile-button"
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                aria-label="Profil Menüsü"
                            >
                                <div className="profile-avatar-mini">
                                    {currentUser.username.charAt(0).toUpperCase()}
                                </div>
                                <span className="profile-username">{currentUser.username}</span>
                                <svg
                                    className={`profile-chevron ${isProfileOpen ? 'open' : ''}`}
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>

                            {isProfileOpen && (
                                <div className="profile-dropdown">
                                    <div className="profile-dropdown-header">
                                        <div className="profile-avatar-large">
                                            {currentUser.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="profile-user-info">
                                            <h3>{currentUser.username}</h3>
                                            <p>{currentUser.email}</p>
                                        </div>
                                    </div>

                                    <div className="profile-dropdown-content">
                                        <div className="profile-actions">
                                            <button
                                                className="profile-logout-btn"
                                                onClick={handleLogout}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                                    <polyline points="16 17 21 12 16 7"></polyline>
                                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                                </svg>
                                                Çıkış Yap
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <NotificationSettings />
                    <ThemeSelector />
                </div>
            </header>
        </div>
    );
}

export default Header;