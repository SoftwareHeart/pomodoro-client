import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import ConfirmModal from './ConfirmModal';

function Timer({ duration, isActive, onComplete, resetFlag, onModeChange }) {
    // State değişkenleri
    const [timeLeft, setTimeLeft] = useState(duration * 60);
    const [workerReady, setWorkerReady] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const [mode, setMode] = useState('pomodoro'); // 'pomodoro', 'shortBreak', 'longBreak'
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingMode, setPendingMode] = useState(null);

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
            workerRef.current.postMessage({
                command: 'pause'
            });
        }
        setHasStarted(false);
        if (onModeChange) onModeChange();
    }, [duration, workerReady, onModeChange]);

    // Mod butonuna tıklama fonksiyonu
    const handleModeButtonClick = (newMode) => {
        if (isActive) {
            setPendingMode(newMode);
            setShowConfirmModal(true);
        } else {
            changeMode(newMode);
        }
    };

    // Modal onay fonksiyonu
    const handleConfirmModeChange = () => {
        setShowConfirmModal(false);
        if (pendingMode) {
            changeMode(pendingMode);
        }
    };

    // Modal iptal fonksiyonu
    const handleCancelModeChange = () => {
        setShowConfirmModal(false);
        setPendingMode(null);
    };

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
                    showVisualNotification('Pomodoro tamamlandı! Kısa mola zamanı.', 'success', 5000);
                    showBrowserNotification('Pomodoro Tamamlandı', 'Kısa mola zamanı!');
                    changeMode('shortBreak');
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
    }, [onComplete, playSound, showVisualNotification, showBrowserNotification, mode, changeMode]);

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
            const newDuration = mode === 'pomodoro' ? duration :
                mode === 'shortBreak' ? SHORT_BREAK_DURATION :
                    LONG_BREAK_DURATION;

            workerRef.current.postMessage({
                command: 'reset',
                duration: newDuration * 60
            });
            setTimeLeft(newDuration * 60); // Süreyi güncelle
            setHasStarted(false);  // Sıfırlama yapıldığında başlama durumunu sıfırla
            setIsCompleting(false); // Tamamlanma durumunu da sıfırla
        }
    }, [resetFlag]); // Sadece resetFlag değiştiğinde çalışsın

    // Süre değiştiğinde timer'ı güncelle
    useEffect(() => {
        if (workerRef.current && workerReady) {
            const newDuration = mode === 'pomodoro' ? duration :
                mode === 'shortBreak' ? SHORT_BREAK_DURATION :
                    LONG_BREAK_DURATION;

            workerRef.current.postMessage({
                command: 'reset',
                duration: newDuration * 60
            });
            setTimeLeft(newDuration * 60);
        }
    }, [duration, workerReady, mode]);

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
    const totalSeconds = mode === 'pomodoro' ? duration * 60 :
        mode === 'shortBreak' ? SHORT_BREAK_DURATION * 60 :
            LONG_BREAK_DURATION * 60;
    const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

    return (
        <div className="timer">
            <div className="timer-mode">
                <button
                    className={mode === 'pomodoro' ? 'active' : ''}
                    onClick={() => handleModeButtonClick('pomodoro')}
                >
                    Pomodoro
                </button>
                <button
                    className={mode === 'shortBreak' ? 'active' : ''}
                    onClick={() => handleModeButtonClick('shortBreak')}
                >
                    Kısa Mola
                </button>
                <button
                    className={mode === 'longBreak' ? 'active' : ''}
                    onClick={() => handleModeButtonClick('longBreak')}
                >
                    Uzun Mola
                </button>
            </div>
            <div className="timer-container">
                <div
                    className="timer-circle"
                    style={{ '--progress': `${progress}%` }}
                />
                <div className="time-display">
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
            </div>
            <ConfirmModal
                isOpen={showConfirmModal}
                title="Mod Değiştirilsin mi?"
                message="Zamanlayıcı çalışıyor. Mod değiştirmek istiyor musunuz? Zamanlayıcı sıfırlanacak ve duraklatılacak."
                confirmButtonText="Evet, değiştir"
                cancelButtonText="Hayır"
                onConfirm={handleConfirmModeChange}
                onCancel={handleCancelModeChange}
            />
        </div>
    );
}

export default Timer;