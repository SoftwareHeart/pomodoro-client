import React, { useState } from 'react';

function TaskForm({ onAddTask }) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [taskName, setTaskName] = useState('');
    const [duration, setDuration] = useState(25);
    const [customDuration, setCustomDuration] = useState(false);

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
        // Başarılı ekleme sonrası formu kapat (opsiyonel)
        // setIsFormOpen(false);
    };

    const handleDurationChange = (e) => {
        const value = e.target.value;
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

    const toggleForm = () => {
        setIsFormOpen(!isFormOpen);
    };

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

                    <form className="task-form" onSubmit={handleSubmit}>
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
                            <label htmlFor="duration">Süre (dakika):</label>
                            {!customDuration ? (
                                <select
                                    id="duration"
                                    value={duration}
                                    onChange={handleDurationChange}
                                >
                                    <option value={25}>25 (Standart)</option>
                                    <option value={15}>15 (Kısa)</option>
                                    <option value={45}>45 (Uzun)</option>
                                    <option value="custom">Özel Süre...</option>
                                </select>
                            ) : (
                                <div className="custom-duration-container">
                                    <input
                                        type="number"
                                        id="customDuration"
                                        value={duration}
                                        onChange={handleCustomDurationChange}
                                        min="1"
                                        max="120"
                                    />
                                    <button
                                        type="button"
                                        className="back-to-select-btn"
                                        onClick={() => setCustomDuration(false)}
                                    >
                                        ↩
                                    </button>
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