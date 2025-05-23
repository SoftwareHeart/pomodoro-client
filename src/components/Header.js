// src/components/Header.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ThemeSelector from './ThemeSelector';
import NotificationSettings from './NotificationSettings';
import CalendarToggle from './CalendarToggle';

function Header() {
    const { currentUser, isAuthenticated } = useAuth();

    return (
        <div className="app-header-container">
            <header>
                <h1>Pomodoro Zamanlayıcı</h1>
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
                <CalendarToggle />
                <NotificationSettings />
                <ThemeSelector />
            </div>
        </div>
    );
}

export default Header;