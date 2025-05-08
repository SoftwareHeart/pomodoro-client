import React, { useState, useEffect } from 'react';

function Notification({ message, type, duration, onClose }) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => {
                onClose();
            }, 300); // Geçiş animasyonu için biraz bekleme
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className={`notification ${type} ${isVisible ? 'visible' : 'hidden'}`}>
            <div className="notification-content">
                <span>{message}</span>
                <button className="notification-close" onClick={() => setIsVisible(false)}>
                    &times;
                </button>
            </div>
        </div>
    );
}

export default Notification;