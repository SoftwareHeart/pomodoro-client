import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Link } from 'react-router-dom';

function TaskForm({ onAddTask, isOpen, onRequestClose, hideToggle }) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [taskName, setTaskName] = useState('');
    const [duration, setDuration] = useState(25);
    const [customDuration, setCustomDuration] = useState(false);
    const { isAuthenticated } = useAuth();
    const { showVisualNotification } = useNotification();

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!taskName.trim()) return;

        onAddTask && onAddTask({
            taskName,
            duration,
            userId: "defaultUser"
        });

        // Formu sıfırla
        setTaskName('');
        setDuration(25);
        setCustomDuration(false);
        requestClose();
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

        setIsFormOpen(!open);
    };

    // Controlled/uncontrolled open
    const open = useMemo(() => (typeof isOpen === 'boolean' ? isOpen : isFormOpen), [isOpen, isFormOpen]);
    const requestClose = () => {
        if (typeof onRequestClose === 'function') {
            onRequestClose();
        } else {
            setIsFormOpen(false);
        }
    };

    const durationPresets = [
        { value: 25, label: "25 dk", description: "Standart Pomodoro" },
        { value: 15, label: "15 dk", description: "Kısa Görev" },
        { value: 45, label: "45 dk", description: "Uzun Görev" },
        { value: "custom", label: "Özel", description: "Özel süre belirle" }
    ];

    // Modal backdrop click handler
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            requestClose();
        }
    };

    // ESC key handler
    React.useEffect(() => {
        const handleEscKey = (e) => {
            if (e.key === 'Escape' && open) {
                requestClose();
            }
        };

        if (open) {
            document.addEventListener('keydown', handleEscKey);
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
            document.body.style.overflow = 'unset';
        };
    }, [open]);

    return (
        <>
            {!hideToggle && (
                <button
                    className="task-form-trigger-btn"
                    onClick={toggleForm}
                    title="Yeni Görev Ekle"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    <span>Yeni Görev</span>
                </button>
            )}

            {open && (
                <div className="task-form-modal-backdrop" onClick={handleBackdropClick}>
                    <div className="task-form-modal">
                        <div className="task-form-modal-header">
                            <h2>Yeni Görev Ekle</h2>
                            <button className="modal-close-btn" onClick={requestClose} aria-label="Kapat">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="task-form-modal-content">
                            <div className="form-group">
                                <label htmlFor="taskName">Görev Adı</label>
                                <input
                                    type="text"
                                    id="taskName"
                                    value={taskName}
                                    onChange={(e) => setTaskName(e.target.value)}
                                    required
                                    placeholder="Görev adını girin..."
                                    autoFocus
                                    className="task-name-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Süre Seçimi</label>

                                {!customDuration ? (
                                    <div className="duration-presets">
                                        {durationPresets.map((preset) => (
                                            <button
                                                key={preset.value}
                                                type="button"
                                                className={`duration-preset ${duration === preset.value ? 'active' : ''}`}
                                                onClick={() => handleDurationChange(preset.value)}
                                            >
                                                <span className="duration-label">{preset.label}</span>
                                                <span className="duration-description">{preset.description}</span>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
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

                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={requestClose}>
                                    İptal
                                </button>
                                <button type="submit" className="add-task-btn">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                    Görevi Ekle
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default TaskForm;