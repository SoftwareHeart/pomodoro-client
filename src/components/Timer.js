// src/components/Timer.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';

function Timer({ duration, isActive, onComplete, resetFlag }) {
    // State değişkenleri
    const [timeLeft, setTimeLeft] = useState(duration * 60);
    const [workerReady, setWorkerReady] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);  // Başlama durumunu izlemek için state

    // Referanslar
    const workerRef = useRef(null);
    const previousIsActiveRef = useRef(isActive);  // Önceki isActive değerini takip etmek için referans

    // Context
    const { playSound, showVisualNotification, showBrowserNotification } = useNotification();

    // Worker'dan gelen mesajları işleyen callback
    const handleWorkerMessage = useCallback((event) => {
        const { type, timeLeft } = event.data;

        switch (type) {
            case 'tick':
                setTimeLeft(timeLeft);
                break;

            case 'complete':
                setHasStarted(false);  // Timer tamamlandığında başlama durumunu sıfırla
                playSound('complete');
                showVisualNotification('Pomodoro tamamlandı! Bir mola verin.', 'success', 5000);
                showBrowserNotification('Pomodoro Tamamlandı', 'Tebrikler! Şimdi bir mola hak ettiniz.');
                onComplete();
                break;

            default:
                console.log('Bilinmeyen mesaj tipi:', type);
        }
    }, [onComplete, playSound, showVisualNotification, showBrowserNotification]);

    // Worker'ı oluştur
    useEffect(() => {
        // Worker'ı başlat
        const workerUrl = `${process.env.PUBLIC_URL}/TimerWorker.js`;
        workerRef.current = new Worker(workerUrl);

        // Mesaj yöneticisini ayarla
        workerRef.current.onmessage = handleWorkerMessage;

        // Worker hazır
        setWorkerReady(true);

        // Temizlik fonksiyonu
        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
        };
    }, [handleWorkerMessage]);

    // Zamanlayıcı sıfırlandığında veya süre değiştiğinde
    useEffect(() => {
        if (workerRef.current && workerReady) {
            workerRef.current.postMessage({
                command: 'reset',
                duration: duration * 60
            });
            setHasStarted(false);  // Sıfırlama yapıldığında başlama durumunu sıfırla
        }
    }, [duration, resetFlag, workerReady]);

    // İsActive değişimlerini yönet
    useEffect(() => {
        if (!workerRef.current || !workerReady) return;

        const wasActive = previousIsActiveRef.current;
        previousIsActiveRef.current = isActive;

        if (isActive) {
            // Sadece ilk kez başlatıldığında veya timer sıfırlandıktan sonra tekrar başlatıldığında ses çal
            if (!hasStarted) {
                playSound('start');
                setHasStarted(true);
            }

            workerRef.current.postMessage({
                command: 'start',
                duration: timeLeft
            });
        } else {
            // Daha önce aktifse şimdi duraklat
            if (wasActive) {
                workerRef.current.postMessage({
                    command: 'pause'
                });
            }
        }
    }, [isActive, timeLeft, playSound, workerReady, hasStarted]);

    // Görsel formatı oluştur
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