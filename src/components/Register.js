// src/components/Register.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { register } = useAuth();
    const { showVisualNotification } = useNotification();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Şifreler eşleşmiyor');
            return;
        }

        setIsLoading(true);

        try {
            await register(username, email, password, confirmPassword);
            showVisualNotification('Kayıt başarılı! Şimdi giriş yapabilirsiniz.', 'success', 5000);
            navigate('/login');
        } catch (error) {
            setError(error.message || 'Kayıt yapılamadı. Lütfen bilgilerinizi kontrol edin.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Hesap Oluştur</h2>
                {error && <div className="auth-error">{error}</div>}
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Kullanıcı Adı</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">E-posta</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                            minLength="6"
                        />
                        <small>Şifreniz en az 6 karakter uzunluğunda olmalıdır</small>
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Şifre Tekrar</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Kaydediliyor...' : 'Kaydol'}
                    </button>
                </form>
                <div className="auth-links">
                    <p>
                        Zaten bir hesabınız var mı? <Link to="/login">Giriş yapın</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;