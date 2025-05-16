// src/components/TaskForm.js dosyasını güncellemek için
import React, { useState } from 'react';

function TaskForm({ onAddTask }) {
    const [taskName, setTaskName] = useState('');
    const [duration, setDuration] = useState(25);
    const [customDuration, setCustomDuration] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!taskName.trim()) return;

        onAddTask({
            taskName,
            duration,
            userId: "defaultUser" // Backend'de oluşturduğumuz kullanıcı ID'si
        });

        // Formu sıfırla
        setTaskName('');
        setDuration(25);
        setCustomDuration(false);
    };

    const handleDurationChange = (e) => {
        const value = e.target.value;
        if (value === "custom") {
            setCustomDuration(true);
            setDuration(25); // Varsayılan değer
        } else {
            setDuration(Number(value));
            setCustomDuration(false);
        }
    };

    const handleCustomDurationChange = (e) => {
        // Boş girişi, sıfırı ve negatif değerleri engelle
        let value = Math.max(1, parseInt(e.target.value) || 1);
        // Maksimum süreyi 120 dakika ile sınırla
        value = Math.min(value, 120);
        setDuration(value);
    };

    return (
        <form className="task-form" onSubmit={handleSubmit}>
            <div className="form-group">
                <label htmlFor="taskName">Görev Adı:</label>
                <input
                    type="text"
                    id="taskName"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    required
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

            <button type="submit" className="add-task-btn">Görevi Ekle</button>
        </form>
    );
}

export default TaskForm;