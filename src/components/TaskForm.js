import React, { useState } from 'react';

function TaskForm({ onAddTask }) {
    const [taskName, setTaskName] = useState('');
    const [duration, setDuration] = useState(25);

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
                <select
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                >
                    <option value={25}>25 (Standart)</option>
                    <option value={15}>15 (Kısa)</option>
                    <option value={45}>45 (Uzun)</option>
                </select>
            </div>

            <button type="submit" className="add-task-btn">Görevi Ekle</button>
        </form>
    );
}

export default TaskForm;