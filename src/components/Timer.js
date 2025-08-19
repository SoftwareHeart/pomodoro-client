import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import ConfirmModal from './ConfirmModal';

function Timer({
    duration,
    isActive,
    onComplete,
    resetFlag,
    onModeChange,
    currentMode,
    onAnonymousModeChange,
    isAuthenticated,
    onDurationChange
}) {
    // State değişkenleri
    const [timeLeft, setTimeLeft] = useState(duration * 60);
    const [workerReady, setWorkerReady] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const [mode, setMode] = useState(currentMode || 'pomodoro'); // 'pomodoro', 'shortBreak', 'longBreak'
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingMode, setPendingMode] = useState(null);

    // Pomodoro duration state (sadece pomodoro modu için)
    const [pomodoroDuration, setPomodoroDuration] = useState(duration);
    const [customDuration, setCustomDuration] = useState(false);

    // Çalışma süresi takibi
    const [startTime, setStartTime] = useState(null);
    const [actualWorkDuration, setActualWorkDuration] = useState(0);

    // Sabit değerler
    const SHORT_BREAK_DURATION = 5; // 5 dakika
    const LONG_BREAK_DURATION = 15; // 15 dakika
    const POMODOROS_UNTIL_LONG_BREAK = 4; // 4 pomodoro sonra uzun mola

    // Referanslar
    const workerRef = useRef(null);
    const previousIsActiveRef = useRef(isActive);

    // Context
    const { playSound, showVisualNotification, showBrowserNotification } = useNotification();



    const handleCustomDurationChange = (e) => {
        let value = Math.max(1, parseInt(e.target.value) || 1);
        value = Math.min(value, 120);
        setPomodoroDuration(value);
        if (onDurationChange) {
            onDurationChange(value);
        }
    };

    const incrementDuration = () => {
        const newValue = Math.min(pomodoroDuration + 1, 120);
        setPomodoroDuration(newValue);
        if (onDurationChange) {
            onDurationChange(newValue);
        }
    };

    const decrementDuration = () => {
        const newValue = Math.max(pomodoroDuration - 1, 1);
        setPomodoroDuration(newValue);
        if (onDurationChange) {
            onDurationChange(newValue);
        }
    };

    // Sync mode state with currentMode prop (for anonymous users)
    useEffect(() => {
        if (currentMode && mode !== currentMode) {
            setMode(currentMode);
        }
    }, [currentMode, mode]);

    // Sync pomodoroDuration with duration prop
    useEffect(() => {
        setPomodoroDuration(duration);
    }, [duration]);

    // Timer modunu değiştiren fonksiyon
    const changeMode = useCallback((newMode) => {
        setMode(newMode);

        // For anonymous users, notify parent component of mode change
        if (!isAuthenticated && onAnonymousModeChange) {
            onAnonymousModeChange(newMode);
            return;
        }

        let newDuration;
        switch (newMode) {
            case 'pomodoro':
                newDuration = pomodoroDuration;
                break;
            case 'shortBreak':
                newDuration = SHORT_BREAK_DURATION;
                break;
            case 'longBreak':
                newDuration = LONG_BREAK_DURATION;
                break;
            default:
                newDuration = pomodoroDuration;
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
    }, [pomodoroDuration, workerReady, onModeChange, isAuthenticated, onAnonymousModeChange]);

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

                // Gerçek çalışma süresini hesapla
                let actualMinutes = null;
                if (startTime && mode === 'pomodoro') {
                    actualMinutes = Math.round((Date.now() - startTime) / (1000 * 60));
                    setActualWorkDuration(actualMinutes);
                }

                if (mode === 'pomodoro') {
                    showVisualNotification('Pomodoro tamamlandı! Kısa mola zamanı.', 'success', 5000);
                    showBrowserNotification('Pomodoro Tamamlandı', 'Kısa mola zamanı!');

                    // Change to shortBreak mode
                    if (isAuthenticated) {
                        changeMode('shortBreak');
                    } else if (onAnonymousModeChange) {
                        onAnonymousModeChange('shortBreak');
                    }
                } else {
                    showVisualNotification('Mola bitti! Yeni bir pomodoro başlatın.', 'info', 5000);
                    showBrowserNotification('Mola Bitti', 'Yeni bir pomodoro başlatın!');

                    // Change to pomodoro mode
                    if (isAuthenticated) {
                        changeMode('pomodoro');
                    } else if (onAnonymousModeChange) {
                        onAnonymousModeChange('pomodoro');
                    }
                }

                onComplete(actualMinutes);
                setTimeout(() => {
                    setIsCompleting(false);
                }, 1000);
                break;

            default:
                console.log('Bilinmeyen mesaj tipi:', type);
        }
    }, [onComplete, playSound, showVisualNotification, showBrowserNotification, mode, changeMode, isAuthenticated, onAnonymousModeChange, startTime]);

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
            const newDuration = mode === 'pomodoro' ? pomodoroDuration :
                mode === 'shortBreak' ? SHORT_BREAK_DURATION :
                    LONG_BREAK_DURATION;

            workerRef.current.postMessage({
                command: 'reset',
                duration: newDuration * 60
            });
            setTimeLeft(newDuration * 60); // Süreyi güncelle
            setHasStarted(false);  // Sıfırlama yapıldığında başlama durumunu sıfırla
            setIsCompleting(false); // Tamamlanma durumunu da sıfırla
            setStartTime(null); // Start time'ı sıfırla
            setActualWorkDuration(0); // Gerçek çalışma süresini sıfırla
        }
    }, [resetFlag, pomodoroDuration, mode]); // Now depends on mode as well

    // Süre değiştiğinde timer'ı güncelle
    useEffect(() => {
        if (workerRef.current && workerReady) {
            const newDuration = mode === 'pomodoro' ? pomodoroDuration :
                mode === 'shortBreak' ? SHORT_BREAK_DURATION :
                    LONG_BREAK_DURATION;

            workerRef.current.postMessage({
                command: 'reset',
                duration: newDuration * 60
            });
            setTimeLeft(newDuration * 60);
        }
    }, [pomodoroDuration, workerReady, mode]);

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
                // Pomodoro modunda start time'ı kaydet
                if (mode === 'pomodoro') {
                    setStartTime(Date.now());
                }
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
    const totalSeconds = mode === 'pomodoro' ? pomodoroDuration * 60 :
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

            {/* Minimal Pomodoro Duration Selector - Sadece pomodoro modu için göster */}
            {mode === 'pomodoro' && (
                <div className="duration-selector-compact">
                    <div className="duration-quick-buttons">
                        {[15, 25, 45, 60].map((minutes) => (
                            <button
                                key={minutes}
                                className={`duration-quick-btn ${pomodoroDuration === minutes ? 'active' : ''}`}
                                onClick={() => {
                                    setPomodoroDuration(minutes);
                                    setCustomDuration(false);
                                    if (onDurationChange) {
                                        onDurationChange(minutes);
                                    }
                                }}
                                title={`${minutes} dakika`}
                            >
                                {minutes}dk
                            </button>
                        ))}
                        <button
                            className={`duration-quick-btn custom ${customDuration ? 'active' : ''}`}
                            onClick={() => setCustomDuration(!customDuration)}
                            title="Özel süre"
                        >
                            Özel
                        </button>
                    </div>

                    {customDuration && (
                        <div className="custom-duration-compact">
                            <button
                                type="button"
                                className="duration-btn-compact"
                                onClick={decrementDuration}
                                disabled={pomodoroDuration <= 1}
                            >
                                -
                            </button>
                            <input
                                type="number"
                                value={pomodoroDuration}
                                onChange={handleCustomDurationChange}
                                min="1"
                                max="120"
                                className="duration-input-compact"
                            />
                            <span className="duration-unit-compact">dk</span>
                            <button
                                type="button"
                                className="duration-btn-compact"
                                onClick={incrementDuration}
                                disabled={pomodoroDuration >= 120}
                            >
                                +
                            </button>
                        </div>
                    )}
                </div>
            )}
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