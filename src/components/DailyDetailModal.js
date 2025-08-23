// src/components/DailyDetailModal.js
import React, { useState, useEffect, useMemo } from 'react';
import { createAuthApiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function DailyDetailModal({ isOpen, onClose, selectedDate }) {
    const [dailyData, setDailyData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { getAuthHeader } = useAuth();
    const authApiService = useMemo(() => {
        return createAuthApiService(getAuthHeader);
    }, [getAuthHeader]);

    // Tarih formatlama
    const formatDate = (date) => {
        if (!date) return '';
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return new Date(date).toLocaleDateString('tr-TR', options);
    };

    const formatTime = (dateTime) => {
        if (!dateTime) return 'Bilinmiyor';

        try {
            const date = new Date(dateTime);
            // Invalid date kontrolü
            if (isNaN(date.getTime())) {
                console.warn('Invalid date:', dateTime);
                return 'Geçersiz tarih';
            }

            return date.toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Date formatting error:', error, dateTime);
            return 'Tarih hatası';
        }
    };

    // Günlük verileri getir
    const fetchDailyData = async () => {
        if (!selectedDate) return;

        try {
            setLoading(true);
            setError(null);

            // Yerel tarih string'i oluştur
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;

            const response = await authApiService.getDailyDetail(dateString);
            setDailyData(response);
        } catch (error) {
            console.error('Günlük detay alınırken hata:', error);
            setError('Günlük detay yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && selectedDate) {
            fetchDailyData();
        }
    }, [isOpen, selectedDate]);

    // Modal kapatma
    const handleClose = () => {
        setDailyData(null);
        setError(null);
        onClose();
    };

    // ESC tuşu ile kapatma
    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === 'Escape') {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="daily-detail-overlay" onClick={handleClose}>
            <div className="daily-detail-modal" onClick={e => e.stopPropagation()}>
                <div className="daily-detail-header">
                    <div className="daily-detail-title">
                        <div className="daily-detail-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                                <path d="m9 16 2 2 4-4"></path>
                            </svg>
                        </div>
                        <div>
                            <h2>Günlük Detay</h2>
                            <p>{formatDate(selectedDate)}</p>
                        </div>
                    </div>
                    <button className="daily-detail-close" onClick={handleClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="daily-detail-content">
                    {loading ? (
                        <div className="daily-detail-loading">
                            <div className="spinner"></div>
                            <p>Günlük veriler yükleniyor...</p>
                        </div>
                    ) : error ? (
                        <div className="daily-detail-error">
                            <p>{error}</p>
                            <button onClick={fetchDailyData}>Tekrar Dene</button>
                        </div>
                    ) : dailyData ? (
                        <>
                            {/* Özet kartları */}
                            <div className="daily-summary">
                                <div className="summary-card primary">
                                    <div className="summary-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <polyline points="12 6 12 12 16 14"></polyline>
                                        </svg>
                                    </div>
                                    <div className="summary-info">
                                        <span className="summary-value">{dailyData.totalPomodoros}</span>
                                        <span className="summary-label">Pomodoro Seansı</span>
                                    </div>
                                    <div className="summary-trend">
                                        {dailyData.totalPomodoros > 0 && (
                                            <span className="trend-indicator positive">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="22 12 18 8 14 12 8 6 2 12"></polyline>
                                                    <polyline points="16 8 22 8 22 14"></polyline>
                                                </svg>
                                                Aktif
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="summary-card success">
                                    <div className="summary-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="3"></circle>
                                            <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"></path>
                                        </svg>
                                    </div>
                                    <div className="summary-info">
                                        <span className="summary-value">
                                            {dailyData.totalMinutes >= 60
                                                ? `${Math.floor(dailyData.totalMinutes / 60)}s ${dailyData.totalMinutes % 60}dk`
                                                : `${dailyData.totalMinutes}dk`
                                            }
                                        </span>
                                        <span className="summary-label">Toplam Odaklanma</span>
                                    </div>
                                    <div className="summary-trend">
                                        <span className="trend-detail">
                                            Ortalama: {Math.round((dailyData.totalMinutes / (dailyData.totalPomodoros || 1)) * 10) / 10}dk
                                        </span>
                                    </div>
                                </div>

                                <div className="summary-card info">
                                    <div className="summary-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <line x1="16" y1="13" x2="8" y2="13"></line>
                                            <line x1="16" y1="17" x2="8" y2="17"></line>
                                            <polyline points="10 9 9 9 8 9"></polyline>
                                        </svg>
                                    </div>
                                    <div className="summary-info">
                                        <span className="summary-value">{dailyData.tasks?.length || 0}</span>
                                        <span className="summary-label">Farklı Görev</span>
                                    </div>
                                    <div className="summary-trend">
                                        <span className="trend-detail">
                                            {dailyData.tasks?.length > 0
                                                ? `En çok: ${dailyData.tasks[0]?.taskName?.substring(0, 10)}...`
                                                : 'Görev yok'
                                            }
                                        </span>
                                    </div>
                                </div>

                                <div className="summary-card accent">
                                    <div className="summary-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                                        </svg>
                                    </div>
                                    <div className="summary-info">
                                        <span className="summary-value">
                                            {dailyData.totalPomodoros > 0
                                                ? Math.round((dailyData.totalMinutes / dailyData.totalPomodoros) * 100) / 100
                                                : 0
                                            }
                                        </span>
                                        <span className="summary-label">Verimlilik Skoru</span>
                                    </div>
                                    <div className="summary-trend">
                                        <span className="trend-detail">
                                            {dailyData.totalPomodoros >= 8 ? 'Mükemmel!' :
                                                dailyData.totalPomodoros >= 4 ? 'İyi!' :
                                                    dailyData.totalPomodoros >= 2 ? 'Orta' : 'Başlangıç'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {dailyData.tasks && dailyData.tasks.length > 0 ? (
                                <div className="tasks-breakdown">
                                    <div className="section-header">
                                        <h3>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M9 11H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h11l5-5V9a2 2 0 0 0-2-2h-3"></path>
                                                <path d="M9 7V4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"></path>
                                                <circle cx="9" cy="9" r="2"></circle>
                                            </svg>
                                            Görev Dağılımı
                                        </h3>
                                        <span className="section-subtitle">
                                            {dailyData.tasks.length} farklı görevde çalışıldı
                                        </span>
                                    </div>
                                    <div className="task-list enhanced">
                                        {dailyData.tasks.map((task, index) => (
                                            <div key={index} className="task-item enhanced">
                                                <div className="task-header">
                                                    <div className="task-icon">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="3"></circle>
                                                            <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"></path>
                                                        </svg>
                                                    </div>
                                                    <div className="task-info">
                                                        <div className="task-name">{task.taskName}</div>
                                                        <div className="task-meta">
                                                            <span className="task-stat pomodoros">
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <circle cx="12" cy="12" r="10"></circle>
                                                                    <polyline points="12 6 12 12 16 14"></polyline>
                                                                </svg>
                                                                {task.pomodoros} pomodoro
                                                            </span>
                                                            <span className="task-stat duration">
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <circle cx="12" cy="12" r="3"></circle>
                                                                    <path d="M12 1v6M12 17v6"></path>
                                                                </svg>
                                                                {task.minutes >= 60
                                                                    ? `${Math.floor(task.minutes / 60)}s ${task.minutes % 60}dk`
                                                                    : `${task.minutes}dk`
                                                                }
                                                            </span>
                                                            <span className="task-stat percentage">
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                                                                </svg>
                                                                {Math.round((task.pomodoros / dailyData.totalPomodoros) * 100)}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="task-progress">
                                                    <div className="progress-bar">
                                                        <div
                                                            className="progress-fill"
                                                            style={{
                                                                width: `${(task.pomodoros / dailyData.totalPomodoros) * 100}%`,
                                                                background: `linear-gradient(90deg, 
                                                                    hsl(${120 + (index * 60) % 360}, 70%, 60%), 
                                                                    hsl(${120 + (index * 60) % 360}, 70%, 70%)
                                                                )`
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            {dailyData.sessions && dailyData.sessions.length > 0 ? (
                                <div className="sessions-timeline">
                                    <div className="section-header">
                                        <h3>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                            </svg>
                                            Oturum Zaman Çizelgesi
                                        </h3>
                                        <span className="section-subtitle">
                                            {dailyData.sessions.length} oturum tamamlandı
                                        </span>
                                    </div>
                                    <div className="timeline enhanced">
                                        {dailyData.sessions.map((session, index) => (
                                            <div key={session.id || index} className="timeline-item enhanced">
                                                <div className="timeline-marker">
                                                    <div className="marker-dot">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="10"></circle>
                                                            <polyline points="12 6 12 12 16 14"></polyline>
                                                        </svg>
                                                    </div>
                                                    {index < dailyData.sessions.length - 1 && (
                                                        <div className="marker-line"></div>
                                                    )}
                                                </div>
                                                <div className="timeline-content">
                                                    <div className="session-card">
                                                        <div className="session-header">
                                                            <div className="session-info">
                                                                <div className="session-task">
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <circle cx="12" cy="12" r="3"></circle>
                                                                        <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"></path>
                                                                    </svg>
                                                                    {session.taskName}
                                                                </div>
                                                                <div className="session-badges">
                                                                    <span className="session-duration">
                                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                            <circle cx="12" cy="12" r="10"></circle>
                                                                        </svg>
                                                                        {session.duration}dk
                                                                    </span>
                                                                    <span className="session-status completed">
                                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                                                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                                                        </svg>
                                                                        Tamamlandı
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="session-time">
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <circle cx="12" cy="12" r="10"></circle>
                                                                <polyline points="12 6 12 12 16 14"></polyline>
                                                            </svg>
                                                            <span className="time-range">
                                                                {formatTime(session.startTime)} - {formatTime(session.endTime)}
                                                            </span>
                                                            <span className="session-index">#{index + 1}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="no-sessions enhanced">
                                    <div className="no-sessions-content">
                                        <div className="no-sessions-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                            </svg>
                                        </div>
                                        <div className="no-sessions-text">
                                            <h3>Bu Günde Pomodoro Yok</h3>
                                            <p>Bu tarihte henüz pomodoro oturumu tamamlanmamış.</p>
                                            <div className="no-sessions-suggestion">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                                                </svg>
                                                Yeni bir pomodoro başlatarak günü verimli geçirin!
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="no-data">
                            <p>Bu tarih için veri bulunamadı.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DailyDetailModal;