import React, { useState, useRef, useEffect, useMemo } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';
import ConfirmModal from './ConfirmModal';
import LoginPrompt from './LoginPrompt';
import { useAuth } from '../contexts/AuthContext';
import TaskForm from './TaskForm';

function TaskList({ tasks, onSelectTask, onDeleteTask, onCompleteTask, onAddTask, activeTaskId, loading }) {
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        taskId: null,
        taskName: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('active'); // default to active
    const [showSearch, setShowSearch] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [expandedTaskIds, setExpandedTaskIds] = useState(new Set());
    const [showTopShadow, setShowTopShadow] = useState(false);
    const [showBottomShadow, setShowBottomShadow] = useState(true);

    const scrollbarRef = useRef(null);
    const { isAuthenticated } = useAuth();

    // Scroll olayını izleme fonksiyonu
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        setShowTopShadow(scrollTop > 10);
        setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 10);
    };

    // Mouse wheel scroll handler - ek güvence için
    const handleWheel = (e) => {
        // PerfectScrollbar'ın kendi wheel handling'ini kullanması için
        // Bu sadece ek bir güvence, genellikle PerfectScrollbar otomatik yapar
        e.stopPropagation();
    };

    // Görev listesi değiştiğinde alt gölgeyi kontrol et
    useEffect(() => {
        // İçerik boyutları güncellendiğinde bottom shadow kontrolü
        if (scrollbarRef.current) {
            const scrollElement = scrollbarRef.current._container;
            if (scrollElement) {
                const { scrollTop, scrollHeight, clientHeight } = scrollElement;
                setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 10);
            }
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

    // Görevleri ada göre grupla ve özet kayıt üret
    const groupedTasks = useMemo(() => {
        const groups = new Map();
        (tasks || []).forEach(t => {
            if (!t || !t.taskName) return;
            if (!groups.has(t.taskName)) groups.set(t.taskName, []);
            groups.get(t.taskName).push(t);
        });

        const aggregated = [];
        groups.forEach((list, name) => {
            const sorted = [...list].sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
            const latest = sorted[0];
            const totalMinutesSpent = list
                .filter(x => x.isCompleted)
                .reduce((sum, x) => sum + (x.duration || 0), 0);
            const hasAnyCompleted = list.some(x => x.isCompleted);
            const allCompleted = list.every(x => x.isCompleted);

            aggregated.push({
                // temsilci kayıt
                id: latest.id,
                taskName: name,
                duration: latest.duration,
                startTime: latest.startTime,
                endTime: latest.endTime,
                isCompleted: allCompleted, // tüm alt görevler tamamlandıysa true
                // özet alanlar
                _latest: latest,
                _items: list,
                totalMinutesSpent,
                hasAnyCompleted // en az bir tamamlanmışsa true
            });
        });

        // Tamamlanmamışlar üstte, sonra tarihe göre sırala
        aggregated.sort((a, b) => {
            if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
            return new Date(b.startTime) - new Date(a.startTime);
        });

        return aggregated;
    }, [tasks]);

    // Gösterim için filtre uygula
    const filteredTasks = groupedTasks.filter(task => {
        if (filter === 'active' && task.isCompleted) return false;
        if (filter === 'completed' && !task.isCompleted) return false;
        if (searchTerm.trim() === '') return true;
        return task.taskName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Arama kutusu değişimi
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };
    const toggleTaskDetails = (taskKey) => {
        setExpandedTaskIds(prev => {
            const next = new Set(prev);
            if (next.has(taskKey)) next.delete(taskKey); else next.add(taskKey);
            return next;
        });
    };

    const handleAddTaskLocal = async (newTask) => {
        try {
            await (onAddTask && onAddTask(newTask));
            setShowForm(false);
        } catch (e) {
            // ignore, TasksContext handles errors
        }
    };


    // Filtreleme değişimi
    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
    };

    // Kullanıcı giriş yapmamışsa login prompt göster (fill variant)
    if (!isAuthenticated()) {
        return (
            <div className="task-list-container">
                <div className="task-list">
                    <div className="task-list-header">
                        <h2>Görevler</h2>
                    </div>
                    <LoginPrompt
                        message="Görevlerinizi Görüntüleyin"
                        actionText="Görevlerinizi görüntülemek, düzenlemek ve yeni görevler eklemek için giriş yapın veya kayıt olun."
                        variant="fill"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="task-list-container">
            <div className="task-list">
                <div className="task-list-header">
                    <h2>Görevler</h2>
                    <div className="task-header-actions">
                        <button
                            className="icon-btn"
                            title="Görev Ara"
                            onClick={() => setShowSearch(prev => !prev)}
                            aria-label="Görev Ara"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </button>
                        <button
                            className="icon-btn primary"
                            title="Yeni Görev"
                            onClick={() => setShowForm(true)}
                            aria-label="Yeni Görev"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>
                        <span className="task-count">{filteredTasks.length}/{groupedTasks.length}</span>
                    </div>
                </div>

                {/* Always show filters */}
                <div className="task-list-toolbar compact">
                    {showSearch && (
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
                    )}
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

                {showForm && (
                    <TaskForm
                        onAddTask={handleAddTaskLocal}
                        isOpen={true}
                        onRequestClose={() => setShowForm(false)}
                        hideToggle={true}
                    />
                )}

                {loading ? (
                    <div className="spinner-container">
                        <div className="spinner"></div>
                        <div className="spinner-text">Görevler yükleniyor...</div>
                    </div>
                ) : filteredTasks.length === 0 ? (
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
                    <div
                        className="task-list-scroll-container"
                        onWheel={handleWheel}
                    >
                        {/* Gölge efektleri */}
                        {showTopShadow && <div className="scroll-shadow top"></div>}
                        {showBottomShadow && <div className="scroll-shadow bottom"></div>}

                        {/* Perfect Scrollbar kullanımı */}
                        <PerfectScrollbar
                            ref={scrollbarRef}
                            options={{
                                wheelSpeed: 2,
                                wheelPropagation: true,
                                minScrollbarLength: 20,
                                swipeEasing: true,
                                suppressScrollX: true,
                                useBothWheelAxes: false,
                                scrollingThreshold: 1000
                            }}
                            onScrollY={handleScroll}
                            className="task-scrollbar-container"
                        >
                            <ul className="task-list-items">
                                {filteredTasks.map(task => (
                                    <li
                                        key={task.taskName}
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
                                            <div className="task-secondary-row">
                                                <button
                                                    className="details-btn"
                                                    onClick={(e) => { e.stopPropagation(); toggleTaskDetails(task.taskName); }}
                                                    aria-expanded={expandedTaskIds.has(task.taskName)}
                                                    aria-label="Görev Detayları"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expandedTaskIds.has(task.taskName) ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform var(--transition-normal)' }}>
                                                        <polyline points="6 9 12 15 18 9"></polyline>
                                                    </svg>
                                                    Detaylar
                                                </button>
                                                {typeof task.totalMinutesSpent === 'number' && (
                                                    <span className="task-spent-chip" title="Bu görev adında tamamlanan tüm pomodoro seanslarının toplam süresi">
                                                        {task.totalMinutesSpent} dk
                                                    </span>
                                                )}
                                            </div>
                                            {expandedTaskIds.has(task.taskName) && (
                                                <div className="task-details">
                                                    <div className="detail-row">
                                                        <span className="detail-label">Eklenme</span>
                                                        <span className="detail-value">{formatRelativeDate(task.startTime)}</span>
                                                    </div>
                                                    {task.isCompleted && task.endTime && (
                                                        <div className="detail-row">
                                                            <span className="detail-label">Tamamlanma</span>
                                                            <span className="detail-value">{formatRelativeDate(task.endTime)}</span>
                                                        </div>
                                                    )}
                                                    {typeof task.totalMinutesSpent === 'number' && (
                                                        <div className="detail-row">
                                                            <span className="detail-label">Toplam Pomodoro Süresi</span>
                                                            <span className="detail-value">{task.totalMinutesSpent} dk</span>
                                                        </div>
                                                    )}
                                                    {Array.isArray(task._items) && (
                                                        <div className="detail-row">
                                                            <span className="detail-label">Pomodoro Seansları</span>
                                                            <span className="detail-value">{task._items.length} seans</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="task-actions">
                                            {!task.isCompleted && (
                                                <button
                                                    className="complete-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onCompleteTask && onCompleteTask(task.taskName);
                                                    }}
                                                    aria-label="Görevi Tamamla"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                    </svg>
                                                </button>
                                            )}
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
                        </PerfectScrollbar>
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
