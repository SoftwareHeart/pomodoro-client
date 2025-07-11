import React, { createContext, useState, useContext, useEffect } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    // localStorage'dan bildirim tercihlerini al veya varsayılanları kullan
    const [settings, setSettings] = useState(() => {
        const savedSettings = localStorage.getItem('pomodoroNotifications');
        return savedSettings ? JSON.parse(savedSettings) : {
            soundEnabled: true,
            soundVolume: 0.7,
            visualEnabled: true,
            browserEnabled: false
        };
    });

    // Ayarlar değiştiğinde localStorage'a kaydet
    useEffect(() => {
        localStorage.setItem('pomodoroNotifications', JSON.stringify(settings));
    }, [settings]);

    // Ses çalma fonksiyonu
    const playSound = (soundName) => {
        if (!settings.soundEnabled) return;

        // Her bir sesle ilgili özel durum kontrolü
        if (soundName === 'start' || soundName === 'complete') {
            // Ses dosyalarının adlarını konsola yazdır (Debug amaçlı)
            console.log(`Playing sound: ${soundName}.mp3`);
        }

        const sound = new Audio(`/sounds/${soundName}.mp3`);
        sound.volume = settings.soundVolume;

        // Ses çalınmadan önce eski ses oynatmalarını durdurmak için
        // Aynı anda birden fazla ses çalınmasını engelle
        sound.oncanplaythrough = () => {
            sound.play().catch(error => console.error(`Sound play error (${soundName}):`, error));
        };
    }

    // Tarayıcı bildirimi gösterme
    const showBrowserNotification = (title, body) => {
        if (!settings.browserEnabled) return;

        // Tarayıcı bildirimlerini kontrol et ve izin iste
        if (Notification.permission === 'granted') {
            new Notification(title, { body });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(title, { body });
                }
            });
        }
    };

    // Görsel bildirim gösterme (DOM'da bir element olarak)
    const showVisualNotification = (message, type = 'info', duration = 5000, onClick) => {
        if (!settings.visualEnabled) return;

        // Bildirim eklemek için EventBus kullan
        const event = new CustomEvent('notification', {
            detail: { message, type, duration, onClick }
        });
        document.dispatchEvent(event);
    };

    // Bildirim ayarlarını güncelleme
    const updateSettings = (newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    // Tarayıcı bildirim izni durumunu kontrol etme
    const checkNotificationPermission = async () => {
        if (settings.browserEnabled && Notification.permission !== 'granted') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return Notification.permission === 'granted';
    };

    return (
        <NotificationContext.Provider value={{
            settings,
            updateSettings,
            playSound,
            showBrowserNotification,
            showVisualNotification,
            checkNotificationPermission
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);