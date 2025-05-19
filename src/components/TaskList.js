import React, { useState, useRef, useEffect } from 'react';
import ConfirmModal from './ConfirmModal';

function TaskList({ tasks, onSelectTask, onDeleteTask, activeTaskId }) {
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        taskId: null,
        taskName: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed'
    const [isScrollable, setIsScrollable] = useState(false);

    const listRef = useRef(null);

    // Liste kaydırılabilir mi kontrolü
    useEffect(() => {
        if (listRef.current) {
            console.log('Scroll height:', listRef.current.scrollHeight);
            console.log('Client height:', listRef.current.clientHeight);
            setIsScrollable(listRef.current.scrollHeight > listRef.current.clientHeight);
        }
    }, [tasks, filter, searchTerm]);

    // Silme düğmesine tıklandığında
    const handleDeleteClick = (e, taskId, taskName) => {
        e.stopPropagation();
        setConfirmModal({
            isOpen: true,
            taskId: taskId,
            taskName: taskName
        });
    };

    // Silme işlemini onayla
    const confirmDelete = () => {
        onDeleteTask(confirmModal.taskId);
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

    // Tarih-saat biçimlendiricisi
    const formatDateTime = (dateTime) => {
        if (!dateTime) return "---";

        const date = new Date(dateTime);

        // Türkçe tarih formatı
        const options = {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };

        return date.toLocaleDateString('tr-TR', options);
    };

    // Kısa tarih biçimlendiricisi (bugün, dün, vs)
    const formatRelativeDate = (dateTime) => {
        if (!dateTime) return "";

        const date = new Date(dateTime);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0 && date.getDate() === now.getDate()) {
            return `Bugün ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }

        if (diffDays === 1 || (diffDays === 0 && date.getDate() !== now.getDate())) {
            return `Dün ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }

        if (diffDays < 7) {
            return `${diffDays} gün önce`;
        }

        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    };

    // Görevleri filtrele ve sırala
    const filteredTasks = tasks
        .filter(task => {
            // Önce filtre uygula
            if (filter === 'active' && task.isCompleted) return false;
            if (filter === 'completed' && !task.isCompleted) return false;

            // Sonra arama terimi uygula
            if (searchTerm.trim() === '') return true;
            return task.taskName.toLowerCase().includes(searchTerm.toLowerCase());
        })
        .sort((a, b) => {
            // Önce tamamlanmamış görevleri göster
            if (a.isCompleted !== b.isCompleted) {
                return a.isCompleted ? 1 : -1;
            }

            // Sonra tarih sıralaması (en yeni eklenenler üstte)
            return new Date(b.startTime) - new Date(a.startTime);
        });

    // Arama kutusu değişimi
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Filtreleme değişimi
    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
    };

    return (
        <div className="task-list-container">
            <div className="task-list">
                <div className="task-list-header">
                    <h2>Görevler</h2>
                    <span className="task-count">{filteredTasks.length}/{tasks.length}</span>
                </div>

                <div className="task-list-toolbar">
                    <div className="search-container">
                        <input
                            type="text"
                            className="task-search"
                            placeholder="Görev ara..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                        {searchTerm && (
                            <button
                                className="clear-search"
                                onClick={() => setSearchTerm('')}
                                aria-label="Aramayı Temizle"
                            >
                                &times;
                            </button>
                        )}
                    </div>

                    <div className="task-filters">
                        <button
                            className={filter === 'all' ? 'active' : ''}
                            onClick={() => handleFilterChange('all')}
                        >
                            Tümü
                        </button>
                        <button
                            className={filter === 'active' ? 'active' : ''}
                            onClick={() => handleFilterChange('active')}
                        >
                            Aktif
                        </button>
                        <button
                            className={filter === 'completed' ? 'active' : ''}
                            onClick={() => handleFilterChange('completed')}
                        >
                            Tamamlanan
                        </button>
                    </div>
                </div>

                {filteredTasks.length === 0 ? (
                    <div className="empty-tasks">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="8" y1="6" x2="21" y2="6"></line>
                            <line x1="8" y1="12" x2="21" y2="12"></line>
                            <line x1="8" y1="18" x2="21" y2="18"></line>
                            <line x1="3" y1="6" x2="3.01" y2="6"></line>
                            <line x1="3" y1="12" x2="3.01" y2="12"></line>
                            <line x1="3" y1="18" x2="3.01" y2="18"></line>
                        </svg>
                        <h3>Görev Bulunamadı</h3>
                        <p>
                            {searchTerm ?
                                "Arama kriterlerine uygun görev bulunamadı." :
                                filter !== 'all' ?
                                    `${filter === 'active' ? 'Aktif' : 'Tamamlanan'} görev bulunamadı.` :
                                    "Henüz görev eklenmemiş."}
                        </p>
                    </div>
                ) : (
                    <div className="task-list-scroll-container">
                        {isScrollable && <div className="scroll-shadow top"></div>}
                        <ul ref={listRef} className="task-list-items">
                            {filteredTasks.map(task => (
                                <li
                                    key={task.id}
                                    className={`task-item ${task.id === activeTaskId ? 'active' : ''} ${task.isCompleted ? 'completed' : ''}`}
                                    onClick={() => onSelectTask(task.id)}
                                >
                                    <div className="task-info">
                                        <div className="task-header">
                                            <span className="task-name">{task.taskName}</span>
                                            {task.isCompleted && (
                                                <span className="completed-badge">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                                    </svg>
                                                    Tamamlandı
                                                </span>
                                            )}
                                        </div>

                                        <div className="task-meta">
                                            <span className="task-duration">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10"></circle>
                                                    <polyline points="12 6 12 12 16 14"></polyline>
                                                </svg>
                                                {task.duration} dk
                                            </span>
                                        </div>

                                        <div className="task-dates">
                                            <div className="date-item">
                                                <span className="date-label">Eklenme:</span>
                                                <div className="date-info">
                                                    <span className="date-relative">{formatRelativeDate(task.startTime)}</span>
                                                    <span className="date-full" title={formatDateTime(task.startTime)}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <circle cx="12" cy="12" r="10"></circle>
                                                            <polyline points="12 6 12 12 16 14"></polyline>
                                                        </svg>
                                                    </span>
                                                </div>
                                            </div>

                                            {task.isCompleted && task.endTime && (
                                                <div className="date-item">
                                                    <span className="date-label">Tamamlanma:</span>
                                                    <div className="date-info">
                                                        <span className="date-relative">{formatRelativeDate(task.endTime)}</span>
                                                        <span className="date-full" title={formatDateTime(task.endTime)}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                                            </svg>
                                                        </span>
                                                    </div>
                                                </div>
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
                        {isScrollable && <div className="scroll-shadow bottom"></div>}
                    </div>
                )}
            </div>

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