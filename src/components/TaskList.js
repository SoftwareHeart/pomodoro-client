import React, { useState, useRef, useEffect, useMemo } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';
import ConfirmModal from './ConfirmModal';
import LoginPrompt from './LoginPrompt';
import { useAuth } from '../contexts/AuthContext';
// TaskForm modal kaldırıldı; hızlı ekleme satırı kullanılıyor

function TaskList({ tasks, onSelectTask, onDeleteTask, onCompleteTask, onAddTask, activeTaskId, isTimerActive, activeStartAt, loading }) {
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        taskId: null,
        taskName: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('active'); // default to active
    const [showSearch, setShowSearch] = useState(false);
    // Modal form kaldırıldı
    const [expandedTaskIds, setExpandedTaskIds] = useState(new Set());
    const [quickTaskName, setQuickTaskName] = useState('');
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [showTopShadow, setShowTopShadow] = useState(false);
    const [showBottomShadow, setShowBottomShadow] = useState(true);

    const scrollbarRef = useRef(null);
    const quickAddInputRef = useRef(null);
    const { isAuthenticated } = useAuth();

    // Canlı süre göstergesi ve saniyelik tetikleyici kaldırıldı

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

    // Görevleri tekil olarak listele: Tamamlanmamışlar üstte, sonra tarihe göre sırala
    const normalizedTasks = useMemo(() => {
        return [...(tasks || [])].sort((a, b) => {
            if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
            return new Date(b.startTime) - new Date(a.startTime);
        });
    }, [tasks]);

    // Gösterim için filtre uygula
    const filteredTasks = normalizedTasks.filter(task => {
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
        } catch (e) {
            // ignore, TasksContext handles errors
        }
    };

    const handleQuickAdd = async (e) => {
        e.preventDefault();
        const name = quickTaskName.trim();
        if (!name) return;
        try {
            await (onAddTask && onAddTask({ taskName: name, duration: 1, userId: 'defaultUser' }));
            setQuickTaskName('');
            setShowQuickAdd(false);
        } catch (e) { }
    };

    useEffect(() => {
        if (showQuickAdd && quickAddInputRef.current) {
            quickAddInputRef.current.focus();
        }
    }, [showQuickAdd]);


    // Filtreleme değişimi
    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
    };

    // Bir görev için harcanan dakika (tamamlanmışsa)
    const getMinutesSpent = (task) => {
        if (!task) return null;
        if (task.isCompleted) {
            if (typeof task.duration === 'number') return task.duration;
            if (task.startTime && task.endTime) {
                const diff = new Date(task.endTime) - new Date(task.startTime);
                return Math.max(0, Math.round(diff / (1000 * 60)));
            }
        }
        return null;
    };

    // Süre formatlayıcı (ss:dd veya ss:dd:SS)
    const formatDuration = (totalSeconds) => {
        const seconds = Math.max(0, Math.floor(totalSeconds));
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        const mm = String(m).padStart(2, '0');
        const ss = String(s).padStart(2, '0');
        if (h > 0) {
            const hh = String(h).padStart(2, '0');
            return `${hh}:${mm}:${ss}`;
        }
        return `${mm}:${ss}`;
    };

    // Canlı süre hesaplama kaldırıldı

    const isSameLocalDate = (dateString, referenceDate = new Date()) => {
        if (!dateString) return false;
        const d = new Date(dateString);
        return d.getFullYear() === referenceDate.getFullYear() &&
            d.getMonth() === referenceDate.getMonth() &&
            d.getDate() === referenceDate.getDate();
    };

    // Bugün toplam (saniye) - aynı taskName için tamamlanan seanslar (canlı süre eklenmez)
    const getTodayTotalSecondsForTaskName = (taskName) => {
        if (!taskName) return 0;
        let totalSec = 0;
        (tasks || []).forEach(t => {
            if (t && t.taskName === taskName && isSameLocalDate(t.startTime)) {
                if (t.isCompleted) {
                    if (typeof t.duration === 'number') totalSec += t.duration * 60;
                    else if (t.startTime && t.endTime) totalSec += Math.max(0, Math.floor((new Date(t.endTime) - new Date(t.startTime)) / 1000));
                }
            }
        });
        return totalSec;
    };

    // Tüm zamanlar toplam (dakika) - aynı taskName için tamamlanan seanslar
    const getAllTimeTotalMinutesForTaskName = (taskName) => {
        if (!taskName) return 0;
        let totalMin = 0;
        (tasks || []).forEach(t => {
            if (t && t.taskName === taskName && t.isCompleted) {
                if (typeof t.duration === 'number') totalMin += t.duration;
                else if (t.startTime && t.endTime) totalMin += Math.max(0, Math.round((new Date(t.endTime) - new Date(t.startTime)) / (1000 * 60)));
            }
        });
        return totalMin;
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
                            onClick={() => setShowQuickAdd(true)}
                            aria-label="Yeni Görev"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>
                        <span className="task-count">{filteredTasks.length}/{(tasks || []).length}</span>
                    </div>
                </div>

                {/* Hızlı görev ekleme ve filtreler */}
                <div className="task-list-toolbar compact">
                    {showQuickAdd && (
                        <form className="quick-add" onSubmit={handleQuickAdd}>
                            <input
                                type="text"
                                className="quick-add-input"
                                placeholder="Hızlı görev ekle..."
                                value={quickTaskName}
                                onChange={(e) => setQuickTaskName(e.target.value)}
                                ref={quickAddInputRef}
                                aria-label="Hızlı görev ekle"
                            />
                            <button className="quick-add-btn" type="submit" disabled={!quickTaskName.trim()}>
                                Ekle
                            </button>
                        </form>
                    )}
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
                        {/* Boş durumda artık inline quick-add yok; üstteki + ile açılıyor */}
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
                                            <div className="task-secondary-row">
                                                <button
                                                    className="details-btn"
                                                    onClick={(e) => { e.stopPropagation(); toggleTaskDetails(task.id); }}
                                                    aria-expanded={expandedTaskIds.has(task.id)}
                                                    aria-label="Görev Detayları"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expandedTaskIds.has(task.id) ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform var(--transition-normal)' }}>
                                                        <polyline points="6 9 12 15 18 9"></polyline>
                                                    </svg>
                                                    Detaylar
                                                </button>
                                                {task.isCompleted ? (
                                                    <span className="task-spent-chip" title="Toplam çalışma süresi">
                                                        Toplam: {getAllTimeTotalMinutesForTaskName(task.taskName)} dk
                                                    </span>
                                                ) : (
                                                    <span className="task-spent-chip" title="Bugünkü toplam çalışma">
                                                        Bugün: {formatDuration(getTodayTotalSecondsForTaskName(task.taskName))}
                                                    </span>
                                                )}
                                            </div>
                                            {expandedTaskIds.has(task.id) && (
                                                <div className="task-details compact">
                                                    <div className="detail-chips">
                                                        <span className="chip" title="Eklenme">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <circle cx="12" cy="12" r="10"></circle>
                                                                <polyline points="12 6 12 12 16 14"></polyline>
                                                            </svg>
                                                            {formatRelativeDate(task.startTime)}
                                                        </span>
                                                        {task.isCompleted && task.endTime && (
                                                            <span className="chip" title="Tamamlanma">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                                </svg>
                                                                {formatRelativeDate(task.endTime)}
                                                            </span>
                                                        )}
                                                        {getMinutesSpent(task) !== null && (
                                                            <span className="chip" title="Harcanan Süre">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <circle cx="12" cy="12" r="10"></circle>
                                                                </svg>
                                                                {getMinutesSpent(task)} dk
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="detail-chips">
                                                        <span className="chip" title="Tüm zamanlar toplam">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <circle cx="12" cy="12" r="10"></circle>
                                                            </svg>
                                                            Toplam: {getAllTimeTotalMinutesForTaskName(task.taskName)} dk
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="task-actions">
                                            {!task.isCompleted && (
                                                <button
                                                    className="complete-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onCompleteTask && onCompleteTask(task.id);
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
