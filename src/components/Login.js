// src/components/Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();
    const { showVisualNotification } = useNotification();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(username, password);
            showVisualNotification('Giriş başarılı!', 'success', 3000);
            navigate('/');
        } catch (error) {
            setError(error.message || 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleContinueWithoutLogin = () => {
        showVisualNotification('Misafir olarak devam ediyorsunuz', 'info', 3000);
        navigate('/');
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Giriş Yap</h2>
                {error && <div className="auth-error">{error}</div>}
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Kullanıcı Adı veya E-posta</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Şifre</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>
                    <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                    </button>
                </form>
                <div className="auth-links">
                    <p>
                        Hesabınız yok mu? <Link to="/register">Kaydolun</Link>
                    </p>
                    <button
                        onClick={handleContinueWithoutLogin}
                        className="auth-continue-btn"
                    >
                        Giriş Yapmadan Devam Et
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Login;