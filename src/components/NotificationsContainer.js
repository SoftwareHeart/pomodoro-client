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
            const { message, type, duration, onClick } = event.detail;
            const id = Date.now();

            // Eski bildirimleri kontrol et - aynı mesajdan var mı?
            const existingMessageIndex = notifications.findIndex(
                n => n.message === message && n.type === type
            );

            if (existingMessageIndex !== -1) {
                // Aynı mesajı güncelle - süresini yenile
                setNotifications(prev => {
                    const newNotifications = [...prev];
                    newNotifications[existingMessageIndex] = {
                        ...newNotifications[existingMessageIndex],
                        id, // Yeni ID atadık, böylece aynı mesaj gibi görünse de yeni bildirimi fark eder
                        onClick // onClick fonksiyonunu güncelle
                    };
                    return newNotifications;
                });
            } else {
                // Yeni bildirim ekle
                setNotifications(prev => [
                    ...prev,
                    { id, message, type, duration: duration || 5000, onClick }
                ]);
            }
        };

        document.addEventListener('notification', handleNotification);

        return () => {
            document.removeEventListener('notification', handleNotification);
        };
    }, [notifications]);

    // Maksimum 5 bildirim göster
    const visibleNotifications = notifications.slice(-5);

    return (
        <div className="notifications-container">
            {visibleNotifications.map(notification => (
                <Notification
                    key={notification.id}
                    message={notification.message}
                    type={notification.type}
                    duration={notification.duration}
                    onClose={() => handleClose(notification.id)}
                    onClick={notification.onClick}
                />
            ))}
        </div>
    );
}

export default NotificationsContainer;