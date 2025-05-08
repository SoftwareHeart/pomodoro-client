// src/components/Timer.js
import React, { useState, useEffect } from 'react';

function Timer({ duration, isActive, onComplete, resetFlag }) {
    const [timeLeft, setTimeLeft] = useState(duration * 60);

    useEffect(() => {
        // Duration değiştiğinde veya resetFlag değiştiğinde timer'ı resetle
        setTimeLeft(duration * 60);
    }, [duration, resetFlag]);

    useEffect(() => {
        // Timer'ı başlat/durdur
        let interval = null;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
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
    }, [isActive, timeLeft, onComplete]);

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