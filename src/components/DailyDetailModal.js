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
        if (!dateTime) return '';
        return new Date(dateTime).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        });
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
                            <div className="daily-summary">
                                <div className="summary-card">
                                    <div className="summary-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <polyline points="12 6 12 12 16 14"></polyline>
                                        </svg>
                                    </div>
                                    <div className="summary-info">
                                        <span className="summary-value">{dailyData.totalPomodoros}</span>
                                        <span className="summary-label">Pomodoro</span>
                                    </div>
                                </div>

                                <div className="summary-card">
                                    <div className="summary-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <polyline points="12 6 12 12 16 14"></polyline>
                                        </svg>
                                    </div>
                                    <div className="summary-info">
                                        <span className="summary-value">{Math.round(dailyData.totalMinutes / 60 * 10) / 10}s</span>
                                        <span className="summary-label">Toplam Süre</span>
                                    </div>
                                </div>

                                <div className="summary-card">
                                    <div className="summary-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                                </div>
                            </div>

                            {dailyData.tasks && dailyData.tasks.length > 0 ? (
                                <div className="tasks-breakdown">
                                    <h3>Görev Dağılımı</h3>
                                    <div className="task-list">
                                        {dailyData.tasks.map((task, index) => (
                                            <div key={index} className="task-item">
                                                <div className="task-info">
                                                    <div className="task-name">{task.taskName}</div>
                                                    <div className="task-meta">
                                                        <span className="task-pomodoros">
                                                            {task.pomodoros} pomodoro
                                                        </span>
                                                        <span className="task-duration">
                                                            {Math.round(task.minutes / 60 * 10) / 10} saat
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="task-progress">
                                                    <div className="progress-bar">
                                                        <div
                                                            className="progress-fill"
                                                            style={{
                                                                width: `${(task.pomodoros / dailyData.totalPomodoros) * 100}%`
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span className="progress-percent">
                                                        {Math.round((task.pomodoros / dailyData.totalPomodoros) * 100)}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            {dailyData.sessions && dailyData.sessions.length > 0 ? (
                                <div className="sessions-timeline">
                                    <h3>Oturum Zaman Çizelgesi</h3>
                                    <div className="timeline">
                                        {dailyData.sessions.map((session, index) => (
                                            <div key={session.id} className="timeline-item">
                                                <div className="timeline-marker"></div>
                                                <div className="timeline-content">
                                                    <div className="session-header">
                                                        <span className="session-task">{session.taskName}</span>
                                                        <span className="session-duration">{session.duration} dk</span>
                                                    </div>
                                                    <div className="session-time">
                                                        {formatTime(session.startTime)} - {formatTime(session.endTime)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="no-sessions">
                                    <div className="no-sessions-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="12" y1="8" x2="12" y2="12"></line>
                                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                        </svg>
                                    </div>
                                    <h3>Bu Günde Pomodoro Yok</h3>
                                    <p>Bu tarihte henüz pomodoro oturumu tamamlanmamış.</p>
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