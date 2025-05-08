import React, { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';

function Timer({ duration, isActive, onComplete, resetFlag }) {
    const [timeLeft, setTimeLeft] = useState(duration * 60);
    const { playSound, showVisualNotification, showBrowserNotification } = useNotification();

    useEffect(() => {
        // Duration değiştiğinde veya resetFlag değiştiğinde timer'ı resetle
        setTimeLeft(duration * 60);
    }, [duration, resetFlag]);

    useEffect(() => {
        // Timer başladığında ses çal
        if (isActive) {
            playSound('start');
        }
    }, [isActive, playSound]);

    useEffect(() => {
        // Timer'ı başlat/durdur
        let interval = null;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);

                        // Zamanlayıcı tamamlandığında bildirimleri tetikle
                        playSound('complete');
                        showVisualNotification('Pomodoro tamamlandı! Bir mola verin.', 'success', 5000);
                        showBrowserNotification('Pomodoro Tamamlandı', 'Tebrikler! Şimdi bir mola hak ettiniz.');

                        onComplete();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (!isActive) {
            clearInterval(interval);
        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft, onComplete, playSound, showVisualNotification, showBrowserNotification]);

    // Dakika ve saniye formatını hesapla
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="timer">
            <div className="time-display">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
        </div>
    );
}

export default Timer;