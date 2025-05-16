import React, { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';

function Timer({ duration, isActive, onComplete, resetFlag }) {
    const [timeLeft, setTimeLeft] = useState(duration * 60);
    const [startTime, setStartTime] = useState(null);
    const { playSound, showVisualNotification, showBrowserNotification } = useNotification();

    // Zamanlayıcıyı başa döndür
    useEffect(() => {
        setTimeLeft(duration * 60);
        setStartTime(null);
    }, [duration, resetFlag]);

    // Başlangıç sesi
    useEffect(() => {
        if (isActive && !startTime) {
            playSound('start');
            setStartTime(Date.now());
        } else if (!isActive) {
            setStartTime(null);
        }
    }, [isActive, playSound, startTime]);

    // Daha hassas zamanlayıcı implementasyonu
    useEffect(() => {
        if (!isActive || timeLeft <= 0) return;

        // Başlangıç zamanı ve kalan süre kaydediliyor
        const initialTime = Date.now();
        const initialTimeLeft = timeLeft;

        const timer = setInterval(() => {
            // Geçen süreyi hesapla ve kalan süreyi güncelle
            const elapsed = Math.floor((Date.now() - initialTime) / 1000);
            const newTimeLeft = initialTimeLeft - elapsed;

            if (newTimeLeft <= 0) {
                clearInterval(timer);
                setTimeLeft(0);

                // Tamamlama bildirimleri
                playSound('complete');
                showVisualNotification('Pomodoro tamamlandı! Bir mola verin.', 'success', 5000);
                showBrowserNotification('Pomodoro Tamamlandı', 'Tebrikler! Şimdi bir mola hak ettiniz.');

                onComplete();
            } else {
                setTimeLeft(newTimeLeft);
            }
        }, 250); // Daha sık kontrol ederek hassasiyeti artır

        return () => clearInterval(timer);
    }, [isActive, timeLeft, onComplete, playSound, showVisualNotification, showBrowserNotification]);

    // Dakika ve saniye formatı
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