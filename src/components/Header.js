// src/components/Header.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ThemeSelector from './ThemeSelector';
import NotificationSettings from './NotificationSettings';

function Header() {
    const { currentUser, isAuthenticated } = useAuth();

    return (
        <div className="app-header-container">
            <header>
                <h1>
                    <Link to="/" className="logo-link">
                        Pomodoro Zamanlayıcı
                    </Link>
                </h1>
                <nav className="main-navigation">
                    <Link to="/" className="nav-link">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                        Ana Sayfa
                    </Link>
                    <Link to="/calendar" className="nav-link">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        Takvim
                    </Link>
                </nav>
            </header>
            <div className="app-controls">
                {isAuthenticated() && (
                    <div className="user-profile-link">
                        <Link to="/profile" className="profile-button">
                            <div className="profile-avatar-mini">
                                {currentUser.username.charAt(0).toUpperCase()}
                            </div>
                            <span>{currentUser.username}</span>
                        </Link>
                    </div>
                )}
                <NotificationSettings />
                <ThemeSelector />
            </div>
        </div>
    );
}

export default Header;