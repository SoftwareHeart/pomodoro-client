import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Link } from 'react-router-dom';

function TaskForm({ onAddTask, isOpen, onRequestClose, hideToggle }) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [taskName, setTaskName] = useState('');
    const { isAuthenticated } = useAuth();
    const { showVisualNotification } = useNotification();

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!taskName.trim()) return;

        onAddTask && onAddTask({
            taskName,
            duration: 1, // Placeholder değer - gerçek süre pomodoro tamamlandığında belirlenir
            userId: "defaultUser"
        });

        // Formu sıfırla
        setTaskName('');
        requestClose();
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