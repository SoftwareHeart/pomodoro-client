import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';

function Timer({ duration, isActive, onComplete, resetFlag }) {
    // State değişkenleri
    const [timeLeft, setTimeLeft] = useState(duration * 60);
    const [workerReady, setWorkerReady] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const [mode, setMode] = useState('pomodoro'); // 'pomodoro', 'shortBreak', 'longBreak'
    const [pomodoroCount, setPomodoroCount] = useState(0);

    // Sabit değerler
    const SHORT_BREAK_DURATION = 5; // 5 dakika
    const LONG_BREAK_DURATION = 15; // 15 dakika
    const POMODOROS_UNTIL_LONG_BREAK = 4; // 4 pomodoro sonra uzun mola

    // Referanslar
    const workerRef = useRef(null);
    const previousIsActiveRef = useRef(isActive);

    // Context
    const { playSound, showVisualNotification, showBrowserNotification } = useNotification();

    // Timer modunu değiştiren fonksiyon
    const changeMode = useCallback((newMode) => {
        setMode(newMode);
        let newDuration;
        switch (newMode) {
            case 'pomodoro':
                newDuration = duration;
                break;
            case 'shortBreak':
                newDuration = SHORT_BREAK_DURATION;
                break;
            case 'longBreak':
                newDuration = LONG_BREAK_DURATION;
                break;
            default:
                newDuration = duration;
        }
        setTimeLeft(newDuration * 60);
        if (workerRef.current && workerReady) {
            workerRef.current.postMessage({
                command: 'reset',
                duration: newDuration * 60
            });
        }
    }, [duration, workerReady]);

    // Worker'dan gelen mesajları işleyen callback
    const handleWorkerMessage = useCallback((event) => {
        const { type, timeLeft } = event.data;

        switch (type) {
            case 'tick':
                setTimeLeft(timeLeft);
                break;

            case 'complete':
                setHasStarted(false);
                setIsCompleting(true);
                playSound('complete');

                if (mode === 'pomodoro') {
                    const newPomodoroCount = pomodoroCount + 1;
                    setPomodoroCount(newPomodoroCount);

                    if (newPomodoroCount % POMODOROS_UNTIL_LONG_BREAK === 0) {
                        showVisualNotification('Pomodoro tamamlandı! Uzun mola zamanı.', 'success', 5000);
                        showBrowserNotification('Pomodoro Tamamlandı', 'Uzun mola zamanı!');
                        changeMode('longBreak');
                    } else {
                        showVisualNotification('Pomodoro tamamlandı! Kısa mola zamanı.', 'success', 5000);
                        showBrowserNotification('Pomodoro Tamamlandı', 'Kısa mola zamanı!');
                        changeMode('shortBreak');
                    }
                } else {
                    showVisualNotification('Mola bitti! Yeni bir pomodoro başlatın.', 'info', 5000);
                    showBrowserNotification('Mola Bitti', 'Yeni bir pomodoro başlatın!');
                    changeMode('pomodoro');
                }

                onComplete();
                setTimeout(() => {
                    setIsCompleting(false);
                }, 1000);
                break;

            default:
                console.log('Bilinmeyen mesaj tipi:', type);
        }
    }, [onComplete, playSound, showVisualNotification, showBrowserNotification, mode, pomodoroCount, changeMode]);

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
            setIsCompleting(false); // Tamamlanma durumunu da sıfırla
        }
    }, [duration, resetFlag, workerReady]);

    // İsActive değişimlerini yönet
    useEffect(() => {
        if (!workerRef.current || !workerReady) return;

        const wasActive = previousIsActiveRef.current;
        previousIsActiveRef.current = isActive;

        if (isActive && !isCompleting) { // isCompleting true ise ses çalma
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
    }, [isActive, timeLeft, playSound, workerReady, hasStarted, isCompleting]);

    // Görsel formatı oluştur
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="timer">
            <div className="timer-mode">
                <button
                    className={mode === 'pomodoro' ? 'active' : ''}
                    onClick={() => changeMode('pomodoro')}
                >
                    Pomodoro
                </button>
                <button
                    className={mode === 'shortBreak' ? 'active' : ''}
                    onClick={() => changeMode('shortBreak')}
                >
                    Kısa Mola
                </button>
                <button
                    className={mode === 'longBreak' ? 'active' : ''}
                    onClick={() => changeMode('longBreak')}
                >
                    Uzun Mola
                </button>
            </div>
            <div className="time-display">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div className="pomodoro-count">
                Tamamlanan Pomodoro: {pomodoroCount}
            </div>
        </div>
    );
}

export default Timer;