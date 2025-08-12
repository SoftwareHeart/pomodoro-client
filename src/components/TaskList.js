import React, { useState, useRef, useEffect, useMemo } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';
import ConfirmModal from './ConfirmModal';
import LoginPrompt from './LoginPrompt';
import { useAuth } from '../contexts/AuthContext';

function TaskList({ tasks, onSelectTask, onDeleteTask, onCompleteTask, activeTaskId, loading }) {
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        taskId: null,
        taskName: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed'
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
            const hasAnyActive = list.some(x => !x.isCompleted);
            aggregated.push({
                // temsilci kayıt
                id: latest.id,
                taskName: name,
                duration: latest.duration,
                startTime: latest.startTime,
                endTime: latest.endTime,
                isCompleted: !hasAnyActive && list.length > 0, // tümü tamamlandıysa true
                // özet alanlar
                _latest: latest,
                _items: list,
                totalMinutesSpent
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

    // Filtreleme değişimi
    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
    };

    // Kullanıcı giriş yapmamışsa login prompt göster
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
                    <span className="task-count">{filteredTasks.length}/{groupedTasks.length}</span>
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
                    <div className="task-list-scroll-container">
                        {/* Gölge efektleri */}
                        {showTopShadow && <div className="scroll-shadow top"></div>}
                        {showBottomShadow && <div className="scroll-shadow bottom"></div>}

                        {/* Perfect Scrollbar kullanımı */}
                        <PerfectScrollbar
                            ref={scrollbarRef}
                            options={{
                                wheelSpeed: 2,
                                wheelPropagation: true, // Bu değeri true olarak değiştirin
                                minScrollbarLength: 20,
                                swipeEasing: true
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

                                            <div className="task-meta">
                                                <span className="task-duration">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="12" cy="12" r="10"></circle>
                                                        <polyline points="12 6 12 12 16 14"></polyline>
                                                    </svg>
                                                    {task.duration} dk
                                                </span>
                                                {task.totalMinutesSpent != null && (
                                                    <span className="task-spent" title="Bu görev adında tamamlanan tüm oturumların toplamı">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M3 12h18"></path>
                                                        </svg>
                                                        {task.totalMinutesSpent} dk harcandı
                                                    </span>
                                                )}
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