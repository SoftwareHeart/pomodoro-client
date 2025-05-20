import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Link } from 'react-router-dom';

function TaskForm({ onAddTask }) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [taskName, setTaskName] = useState('');
    const [duration, setDuration] = useState(25);
    const [customDuration, setCustomDuration] = useState(false);
    const { isAuthenticated } = useAuth();
    const { showVisualNotification } = useNotification();

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!taskName.trim()) return;

        onAddTask({
            taskName,
            duration,
            userId: "defaultUser"
        });

        // Formu sıfırla
        setTaskName('');
        setDuration(25);
        setCustomDuration(false);
    };

    const handleDurationChange = (value) => {
        if (value === "custom") {
            setCustomDuration(true);
            setDuration(25);
        } else {
            setDuration(Number(value));
            setCustomDuration(false);
        }
    };

    const handleCustomDurationChange = (e) => {
        let value = Math.max(1, parseInt(e.target.value) || 1);
        value = Math.min(value, 120);
        setDuration(value);
    };

    const incrementDuration = () => {
        setDuration(prev => Math.min(prev + 1, 120));
    };

    const decrementDuration = () => {
        setDuration(prev => Math.max(prev - 1, 1));
    };

    const toggleForm = () => {
        // If not authenticated, show notification and don't open form
        if (!isAuthenticated()) {
            showVisualNotification(
                'Görev eklemek için giriş yapmalısınız',
                'warning',
                4000,
                () => {
                    // Callback when notification is clicked - redirect to login
                    window.location.href = '/login';
                }
            );
            return;
        }

        setIsFormOpen(!isFormOpen);
    };

    const durationPresets = [
        { value: 25, label: "25 dk", description: "Standart Pomodoro" },
        { value: 15, label: "15 dk", description: "Kısa Görev" },
        { value: 45, label: "45 dk", description: "Uzun Görev" },
        { value: "custom", label: "Özel", description: "Özel süre belirle" }
    ];

    return (
        <div className="task-form-container">
            {!isFormOpen ? (
                <button className="add-task-toggle-btn" onClick={toggleForm}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Yeni Görev Ekle
                </button>
            ) : (
                <div className="task-form-wrapper">
                    <div className="task-form-header">
                        <h3>Yeni Görev Ekle</h3>
                        <button className="close-form-btn" onClick={toggleForm}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="taskName">Görev Adı:</label>
                            <input
                                type="text"
                                id="taskName"
                                value={taskName}
                                onChange={(e) => setTaskName(e.target.value)}
                                required
                                placeholder="Görev adını girin..."
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label>Süre Seçimi:</label>
                            <div className="duration-presets">
                                {durationPresets.map((preset) => (
                                    <button
                                        key={preset.value}
                                        type="button"
                                        className={`duration-preset ${duration === preset.value ? 'active' : ''} ${customDuration && preset.value === 'custom' ? 'active' : ''}`}
                                        onClick={() => handleDurationChange(preset.value)}
                                    >
                                        <span className="duration-label">{preset.label}</span>
                                        <span className="duration-description">{preset.description}</span>
                                    </button>
                                ))}
                            </div>

                            {customDuration && (
                                <div className="custom-duration-container">
                                    <div className="custom-duration-header">
                                        <h4>Özel Süre Belirle</h4>
                                        <button
                                            type="button"
                                            className="back-to-select-btn"
                                            onClick={() => setCustomDuration(false)}
                                            title="Geri Dön"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M19 12H5M12 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="custom-duration-input">
                                        <button
                                            type="button"
                                            className="duration-control-btn"
                                            onClick={decrementDuration}
                                            disabled={duration <= 1}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                            </svg>
                                        </button>
                                        <div className="duration-display">
                                            <input
                                                type="number"
                                                id="customDuration"
                                                value={duration}
                                                onChange={handleCustomDurationChange}
                                                min="1"
                                                max="120"
                                            />
                                            <span className="duration-unit">dakika</span>
                                        </div>
                                        <button
                                            type="button"
                                            className="duration-control-btn"
                                            onClick={incrementDuration}
                                            disabled={duration >= 120}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="duration-slider">
                                        <input
                                            type="range"
                                            min="1"
                                            max="120"
                                            value={duration}
                                            onChange={(e) => setDuration(Number(e.target.value))}
                                            className="duration-range"
                                        />
                                        <div className="duration-marks">
                                            <span>1 dk</span>
                                            <span>30 dk</span>
                                            <span>60 dk</span>
                                            <span>90 dk</span>
                                            <span>120 dk</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="form-actions">
                            <button type="button" className="cancel-btn" onClick={toggleForm}>İptal</button>
                            <button type="submit" className="add-task-btn">Görevi Ekle</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default TaskForm;