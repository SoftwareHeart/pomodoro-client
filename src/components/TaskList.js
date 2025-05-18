import React, { useState } from 'react';
import ConfirmModal from './ConfirmModal';

function TaskList({ tasks, onSelectTask, onDeleteTask, activeTaskId }) {
    // Onay modalı için state
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        taskId: null,
        taskName: ''
    });

    // Silme düğmesine tıklandığında
    const handleDeleteClick = (e, taskId, taskName) => {
        e.stopPropagation(); // Tıklama olayının görev seçimine yayılmasını engelle

        // Modal'ı aç
        setConfirmModal({
            isOpen: true,
            taskId: taskId,
            taskName: taskName
        });
    };

    // Silme işlemini onayla
    const confirmDelete = () => {
        // Silme işlemini gerçekleştir
        onDeleteTask(confirmModal.taskId);

        // Modal'ı kapat
        setConfirmModal({
            isOpen: false,
            taskId: null,
            taskName: ''
        });
    };

    // Modal'ı kapat
    const closeModal = () => {
        setConfirmModal({
            isOpen: false,
            taskId: null,
            taskName: ''
        });
    };

    return (
        <div className="task-list">
            <div className="task-list-header">
                <h2>Görevler</h2>
                <span className="task-count">{tasks.length}</span>
            </div>

            {tasks.length === 0 ? (
                <div className="empty-tasks">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                    <h3>Henüz görev yok</h3>
                    <p>Yeni bir görev ekleyerek başlayın</p>
                </div>
            ) : (
                <ul>
                    {tasks.map(task => (
                        <li
                            key={task.id}
                            className={task.id === activeTaskId ? 'active' : ''}
                            onClick={() => onSelectTask(task.id)}
                        >
                            <div className="task-info">
                                <span className="task-name">{task.taskName}</span>
                                <div className="task-meta">
                                    <span className="task-duration">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <polyline points="12 6 12 12 16 14"></polyline>
                                        </svg>
                                        {task.duration} dk
                                    </span>
                                    {task.isCompleted && (
                                        <span className="completed-badge">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                            </svg>
                                            Tamamlandı
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="task-actions">
                                <button
                                    className="delete-btn"
                                    onClick={(e) => handleDeleteClick(e, task.id, task.taskName)}
                                    aria-label="Görevi Sil"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* Onay Modalı */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title="Görevi Sil"
                message={`"${confirmModal.taskName}" görevini silmek istediğinize emin misiniz?`}
                confirmButtonText="Evet, Sil"
                cancelButtonText="İptal"
                onConfirm={confirmDelete}
                onCancel={closeModal}
            />
        </div>
    );
}

export default TaskList;