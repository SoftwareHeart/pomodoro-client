import React, { useState, useEffect, useCallback } from 'react';
import Notification from './Notification';

function NotificationsContainer() {
    const [notifications, setNotifications] = useState([]);

    const handleClose = useCallback((id) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, []);

    useEffect(() => {
        // Bildirim olaylarını dinle
        const handleNotification = (event) => {
            const { message, type, duration } = event.detail;
            const id = Date.now();

            setNotifications(prev => [...prev, { id, message, type, duration }]);
        };

        document.addEventListener('notification', handleNotification);

        return () => {
            document.removeEventListener('notification', handleNotification);
        };
    }, []);

    return (
        <div className="notifications-container">
            {notifications.map(notification => (
                <Notification
                    key={notification.id}
                    message={notification.message}
                    type={notification.type}
                    duration={notification.duration}
                    onClose={() => handleClose(notification.id)}
                />
            ))}
        </div>
    );
}

export default NotificationsContainer;