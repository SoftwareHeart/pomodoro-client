import React from 'react';
import { useNotification } from '../contexts/NotificationContext';

function PomodoroControls({ isActive, onStart, onPause, onReset }) {
    const { playSound } = useNotification();

    // Sadece ses çalma işlevini kullanalım, bildirimleri App.js'e bırakalım
    const handleStart = () => {
        playSound('click');
        onStart();
    };

    const handlePause = () => {
        playSound('click');
        onPause();
    };

    const handleReset = () => {
        playSound('click');
        onReset();
    };

    return (
        <div className="pomodoro-controls">
            {!isActive ? (
                <button className="start-btn" onClick={handleStart}>Başlat</button>
            ) : (
                <button className="pause-btn" onClick={handlePause}>Duraklat</button>
            )}
            <button className="reset-btn" onClick={handleReset}>Sıfırla</button>
        </div>
    );
}

export default PomodoroControls;