import React, { useState, useEffect, useRef } from 'react';

function Notification({ message, type = 'info', duration = 5000, onClose }) {
    const [isVisible, setIsVisible] = useState(false);
    const timerRef = useRef(null);
    const animationTimeoutRef = useRef(null);

    // Bileşen monte edildiğinde animasyonlu gösterme için
    useEffect(() => {
        // Kısa bir gecikme ile animasyonu başlat
        animationTimeoutRef.current = setTimeout(() => {
            setIsVisible(true);
        }, 10);

        return () => {
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
            }
        };
    }, []);

    // Otomatik kapanma
    useEffect(() => {
        if (duration && duration > 0) {
            timerRef.current = setTimeout(() => {
                handleClose();
            }, duration);
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [duration]);

    const handleClose = () => {
        setIsVisible(false);

        // Animasyon tamamlandıktan sonra bildirimi kaldır
        setTimeout(() => {
            onClose();
        }, 300); // Geçiş animasyonu süresi
    };

    // Fare üzerine gelince zamanlayıcıyı durdur
    const handleMouseEnter = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
    };

    // Fare ayrıldığında zamanlayıcıyı yeniden başlat
    const handleMouseLeave = () => {
        if (duration && duration > 0) {
            timerRef.current = setTimeout(() => {
                handleClose();
            }, duration / 2); // Yarı sürede kapat
        }
    };

    // Bildirim tipi için icon seçimi
    const getIcon = () => {
        switch (type) {
            case 'success':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                );
            case 'warning':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                );
            case 'error':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                );
            default:
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                );
        }
    };

    return (
        <div
            className={`notification ${type} ${isVisible ? 'visible' : 'hidden'}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ '--notification-duration': `${duration}ms` }}
            aria-live="polite"
            role="alert"
        >
            <div className="notification-icon">
                {getIcon()}
            </div>
            <div className="notification-content">
                <p className="notification-message">{message}</p>
            </div>
            <button
                className="notification-close"
                onClick={handleClose}
                aria-label="Bildirimi kapat"
            >
                ×
            </button>
        </div>
    );
}

export default Notification;