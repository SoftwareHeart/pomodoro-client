import React from 'react';

function PomodoroControls({ isActive, onStart, onPause, onReset }) {
    return (
        <div className="pomodoro-controls">
            {!isActive ? (
                <button className="start-btn" onClick={onStart}>Başlat</button>
            ) : (
                <button className="pause-btn" onClick={onPause}>Duraklat</button>
            )}
            <button className="reset-btn" onClick={onReset}>Sıfırla</button>
        </div>
    );
}

export default PomodoroControls;