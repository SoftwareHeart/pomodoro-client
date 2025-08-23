// src/components/CalendarView.js - Modern Redesign
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createAuthApiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import DailyDetailModal from './DailyDetailModal';

function CalendarView({ onDateSelect }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarData, setCalendarData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [showDailyDetail, setShowDailyDetail] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const { getAuthHeader, isAuthenticated } = useAuth();

    const authApiService = useMemo(() => {
        return createAuthApiService(getAuthHeader);
    }, [getAuthHeader]);

    // Türkçe ay ve gün isimleri
    const monthNames = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

    const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

    // Tarih formatları
    const formatDateToLocal = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const parseLocalDate = (dateString) => {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    // Ayın günlerini hesapla
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();

        // Ayın ilk günü
        const firstDay = new Date(year, month, 1);
        // Ayın son günü
        const lastDay = new Date(year, month + 1, 0);

        // Pazartesi = 1, Pazar = 0 olacak şekilde ayarla
        const getWeekday = (date) => {
            const day = date.getDay();
            return day === 0 ? 6 : day - 1;
        };

        const days = [];

        // Önceki ayın günleri
        const prevMonth = new Date(year, month - 1, 0);
        const firstWeekday = getWeekday(firstDay);

        for (let i = firstWeekday - 1; i >= 0; i--) {
            const day = prevMonth.getDate() - i;
            days.push({
                date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), day),
                isCurrentMonth: false,
                day: day
            });
        }

        // Bu ayın günleri
        for (let day = 1; day <= lastDay.getDate(); day++) {
            days.push({
                date: new Date(year, month, day),
                isCurrentMonth: true,
                day: day
            });
        }

        // Sonraki ayın günleri (42 gün olacak şekilde)
        const remainingDays = 42 - days.length;
        for (let day = 1; day <= remainingDays; day++) {
            days.push({
                date: new Date(year, month + 1, day),
                isCurrentMonth: false,
                day: day
            });
        }

        return days;
    };

    // Calendar verilerini getir
    const fetchCalendarData = useCallback(async () => {
        if (!isAuthenticated()) return;

        try {
            setLoading(true);
            setError(null);

            // Ayın ilk ve son günlerini hesapla
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();

            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0); // Son gün

            // API'nin beklediği format (YYYY-MM-DD)
            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];

            const response = await authApiService.getCalendarData(startDateStr, endDateStr);

            // API response'unu calendar format'ına dönüştür
            const calendarData = {};
            if (response && response.data) {
                response.data.forEach(dayData => {
                    calendarData[dayData.date] = {
                        pomodoros: dayData.pomodoros,
                        minutes: dayData.minutes,
                        hours: dayData.hours,
                        sessions: dayData.sessions
                    };
                });
            }

            setCalendarData(calendarData);
        } catch (error) {
            console.error('Calendar data fetch error:', error);
            setError('Takvim verileri yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    }, [currentDate, authApiService, isAuthenticated]);

    useEffect(() => {
        fetchCalendarData();
    }, [fetchCalendarData]);

    // Navigasyon fonksiyonları
    const changeMonth = (direction) => {
        if (isTransitioning) return;

        setIsTransitioning(true);

        setTimeout(() => {
            setCurrentDate(prev => {
                const newDate = new Date(prev);
                newDate.setMonth(prev.getMonth() + direction);
                return newDate;
            });
            setIsTransitioning(false);
        }, 150);
    };

    const goToToday = () => {
        if (isTransitioning) return;

        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentDate(new Date());
            setIsTransitioning(false);
        }, 150);
    };

    // Gün tıklama işlemi
    const handleDayClick = (date, dayData) => {
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        // Gelecek tarihler için tıklama devre dışı
        if (date > today) return;

        // Eğer onDateSelect prop'u varsa onu kullan
        if (onDateSelect) {
            if (dayData && dayData.pomodoros > 0) {
                onDateSelect(date);
            }
        } else {
            // Eski davranış (modal açma)
            if (dayData && dayData.pomodoros > 0) {
                setSelectedDate(date);
                setShowDailyDetail(true);
            }
        }
    };

    // Modal kapatma
    const handleCloseModal = () => {
        setShowDailyDetail(false);
        setSelectedDate(null);
    };

    // Günün durumunu belirle
    const getDayStatus = (dayInfo, dayData) => {
        const today = new Date();
        const isToday = dayInfo.date.toDateString() === today.toDateString();
        const isFuture = dayInfo.date > today;
        const hasData = dayData && dayData.pomodoros > 0;

        return {
            isToday,
            isFuture,
            hasData,
            isCurrentMonth: dayInfo.isCurrentMonth
        };
    };

    // Pomodoro göstergesi render
    const renderPomodoroIndicator = (dayData) => {
        if (!dayData || dayData.pomodoros === 0) return null;

        if (dayData.pomodoros <= 4) {
            // Nokta gösterimi (1-4 pomodoro)
            return (
                <div className="pomodoro-indicator">
                    <div className="pomodoro-dots">
                        {Array.from({ length: dayData.pomodoros }, (_, i) => (
                            <div key={i} className="pomodoro-dot" />
                        ))}
                    </div>
                </div>
            );
        } else {
            // Sayı gösterimi (5+ pomodoro)
            return (
                <div className="pomodoro-indicator">
                    <div className="pomodoro-count">
                        {dayData.pomodoros}
                    </div>
                </div>
            );
        }
    };

    const days = getDaysInMonth(currentDate);
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    if (!isAuthenticated()) {
        return (
            <div className="calendar-view">
                <div className="calendar-loading">
                    <p>Takvimi görüntülemek için giriş yapın</p>
                </div>
            </div>
        );
    }

    return (
        <div className="calendar-view">
            {/* Calendar Header */}
            <div className="calendar-header">
                <div className="calendar-title">
                    <h2 className="calendar-month-year">
                        {monthNames[currentMonth]} {currentYear}
                    </h2>
                </div>

                <div className="calendar-navigation">
                    <button
                        className="calendar-nav-btn"
                        onClick={() => changeMonth(-1)}
                        disabled={isTransitioning}
                        aria-label="Önceki ay"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>

                    <button
                        className="calendar-nav-btn today-btn"
                        onClick={goToToday}
                        disabled={isTransitioning}
                    >
                        Bugün
                    </button>

                    <button
                        className="calendar-nav-btn"
                        onClick={() => changeMonth(1)}
                        disabled={isTransitioning}
                        aria-label="Sonraki ay"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="calendar-loading">
                    <div className="spinner"></div>
                    <p>Takvim verileri yükleniyor...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="calendar-error">
                    <p>{error}</p>
                    <button
                        className="calendar-error-retry"
                        onClick={fetchCalendarData}
                    >
                        Tekrar Dene
                    </button>
                </div>
            )}

            {/* Calendar Grid */}
            {!loading && !error && (
                <>
                    <div className={`calendar-grid ${isTransitioning ? 'calendar-transition' : ''}`}>
                        {/* Day Headers */}
                        {dayNames.map(dayName => (
                            <div key={dayName} className="calendar-day-header">
                                {dayName}
                            </div>
                        ))}

                        {/* Calendar Days */}
                        {days.map((dayInfo, index) => {
                            const dateString = formatDateToLocal(dayInfo.date);
                            const dayData = calendarData[dateString];
                            const status = getDayStatus(dayInfo, dayData);

                            const className = [
                                'calendar-day',
                                !status.isCurrentMonth && 'other-month',
                                status.isToday && 'today',
                                status.isFuture && 'future-day',
                                status.hasData && 'has-data'
                            ].filter(Boolean).join(' ');

                            return (
                                <div
                                    key={`${dayInfo.date.getFullYear()}-${dayInfo.date.getMonth()}-${dayInfo.day}`}
                                    className={className}
                                    onClick={() => handleDayClick(dayInfo.date, dayData)}
                                    title={status.hasData ? `${dayData.pomodoros} Pomodoro tamamlandı` : ''}
                                >
                                    <span className="day-number">
                                        {dayInfo.day}
                                    </span>
                                    {renderPomodoroIndicator(dayData)}
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="calendar-legend">
                        <div className="legend-item">
                            <div className="legend-no-data"></div>
                            <span>Pomodoro yok</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-dot"></div>
                            <span>Pomodoro var</span>
                        </div>
                    </div>
                </>
            )}

            {/* Daily Detail Modal - sadece onDateSelect yokken göster */}
            {!onDateSelect && (
                <DailyDetailModal
                    isOpen={showDailyDetail}
                    onClose={handleCloseModal}
                    selectedDate={selectedDate}
                />
            )}
        </div>
    );
}

export default CalendarView;