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
    const isWorkerRunningRef = useRef(false);

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

    // Eski hızlı buton/toggle kaldırıldı, slider ile kontrol ediliyor

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
            if (isWorkerRunningRef.current) {
                isWorkerRunningRef.current = false;
            }
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
        isWorkerRunningRef.current = false;

        // Temizlik fonksiyonu
        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
            isWorkerRunningRef.current = false;
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
            isWorkerRunningRef.current = false;
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
            isWorkerRunningRef.current = false;
        }
    }, [pomodoroDuration, workerReady, mode]);

    // İsActive değişimlerini yönet (yalnızca durum geçişlerinde tetikle)
    useEffect(() => {
        if (!workerRef.current || !workerReady) return;

        const wasActive = previousIsActiveRef.current;

        // Aktif hale geçişte başlat
        if (isActive && !wasActive && !isCompleting) {
            if (!hasStarted) {
                playSound('start');
                setHasStarted(true);
                if (mode === 'pomodoro') {
                    setStartTime(Date.now());
                }
            }

            workerRef.current.postMessage({
                command: 'start',
                duration: timeLeft
            });
            isWorkerRunningRef.current = true;
        }

        // Pasife geçişte duraklat
        if (!isActive && wasActive) {
            workerRef.current.postMessage({
                command: 'pause'
            });
            isWorkerRunningRef.current = false;
        }

        // Bir sonraki efekt çalışması için mevcut durumu sakla
        previousIsActiveRef.current = isActive;
    }, [isActive, workerReady, isCompleting, hasStarted, playSound, mode, timeLeft]);

    // Worker hazır olduğunda ve zamanlayıcı zaten aktifse başlatmayı garanti altına al
    useEffect(() => {
        if (!workerRef.current || !workerReady) return;
        if (isActive && !isCompleting && !isWorkerRunningRef.current) {
            if (!hasStarted) {
                playSound('start');
                setHasStarted(true);
                if (mode === 'pomodoro') {
                    setStartTime(Date.now());
                }
            }
            workerRef.current.postMessage({
                command: 'start',
                duration: timeLeft
            });
            isWorkerRunningRef.current = true;
        }
    }, [workerReady, isActive, isCompleting, hasStarted, playSound, mode, timeLeft]);

    // Görsel formatı oluştur
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const totalSeconds = mode === 'pomodoro' ? pomodoroDuration * 60 :
        mode === 'shortBreak' ? SHORT_BREAK_DURATION * 60 :
            LONG_BREAK_DURATION * 60;
    const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

    // Slider konum yüzdesi (1-120 dk aralığı)
    const minMinutes = 1;
    const maxMinutes = 120;
    const sliderPercent = ((pomodoroDuration - minMinutes) / (maxMinutes - minMinutes)) * 100;



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

            {/* Modern Pomodoro Süre Seçici - sadece pomodoro modunda */}
            {mode === 'pomodoro' && (
                <div className="duration-selector-modern">
                    <div className="duration-header">
                        <span className="duration-label">Süre</span>
                        <span
                            className="duration-bubble"
                            style={{ left: `calc(${sliderPercent}% - 22px)` }}
                            aria-live="polite"
                        >
                            {pomodoroDuration}dk
                        </span>
                    </div>
                    <input
                        type="range"
                        min={minMinutes}
                        max={maxMinutes}
                        step={1}
                        value={pomodoroDuration}
                        onChange={handleCustomDurationChange}
                        className="duration-range"
                        style={{
                            background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${sliderPercent}%, var(--color-border) ${sliderPercent}%, var(--color-border) 100%)`
                        }}
                        aria-label="Pomodoro süresini dakika olarak ayarlayın"
                    />
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