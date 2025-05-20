// src/components/LoginPrompt.js
import React from 'react';
import { Link } from 'react-router-dom';

function LoginPrompt({ message, actionText }) {
    return (
        <div className="login-prompt-container">
            <div className="login-prompt-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
            </div>
            <h3 className="login-prompt-title">{message || 'Giriş Yapmanız Gerekiyor'}</h3>
            <p className="login-prompt-text">
                {actionText || 'Bu özelliği kullanmak için giriş yapmalı veya kayıt olmalısınız.'}
            </p>
            <div className="login-prompt-actions">
                <Link to="/login" className="login-btn">Giriş Yap</Link>
                <span className="login-prompt-separator">veya</span>
                <Link to="/register" className="register-btn">Kayıt Ol</Link>
            </div>
        </div>
    );
}

export default LoginPrompt;