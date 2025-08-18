// src/components/CalendarView.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createAuthApiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import DailyDetailModal from './DailyDetailModal';

function CalendarView() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarData, setCalendarData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [showDailyDetail, setShowDailyDetail] = useState(false);
    const { getAuthHeader, isAuthenticated } = useAuth();

    const authApiService = useMemo(() => {
        return createAuthApiService(getAuthHeader);
    }, [getAuthHeader]);

    // Ay ve yıl
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Türkçe ay isimleri
    const monthNames = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

    // Türkçe gün isimleri
    const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

    // Tarihi yerel saat dilimine göre string'e çevir (timezone kayması olmadan)
    const formatDateToLocal = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // String tarihi yerel tarih objesine çevir (timezone kayması olmadan)
    const parseLocalDate = (dateString) => {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    // Ayın günlerini hesapla
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        // Pazartesi = 1, Salı = 2, ..., Pazar = 0
        // Türkiye'de hafta pazartesi başlar
        let firstDayOfWeek = firstDay.getDay();
        firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Pazar = 6, Pazartesi = 0

        return { daysInMonth, firstDayOfWeek };
    };

    // Ay değişikliklerinde calendar data'yı temizle
    useEffect(() => {
        setCalendarData({}); // Calendar data'yı temizle
        fetchCalendarData();
    }, [currentMonth, currentYear]);

    // fetchCalendarData'yı useCallback ile sarmalayalım dependency sorununu çözmek için
    const fetchCalendarData = useCallback(async () => {
        if (!isAuthenticated()) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Mevcut ayın başı ve sonu + önceki ay ve sonraki ay (yerel saat diliminde)
            const startDate = new Date(currentYear, currentMonth - 1, 1); // Önceki ayın başı
            const endDate = new Date(currentYear, currentMonth + 2, 0); // Sonraki ayın sonu

            // Backend'den takvim verilerini al
            const calendarResponse = await authApiService.getCalendarData(
                formatDateToLocal(startDate),
                formatDateToLocal(endDate)
            );

            // Veriyi günlere göre organize et
            const dataByDate = {};

            if (calendarResponse && calendarResponse.data) {
                calendarResponse.data.forEach(dayData => {
                    // Tarih string'ini doğrudan kullan (timezone kayması olmadan)
                    dataByDate[dayData.date] = {
                        pomodoros: dayData.pomodoros,
                        minutes: dayData.minutes,
                        sessions: dayData.sessions || [],
                        date: parseLocalDate(dayData.date) // Yerel tarih objesi oluştur
                    };
                });
            }

            setCalendarData(dataByDate);
            setError(null);
        } catch (error) {
            console.error('Takvim verileri alınırken hata:', error);
            setError('Takvim verileri yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    }, [currentYear, currentMonth, authApiService, isAuthenticated]);

    // Önceki ay
    const goToPreviousMonth = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() - 1);
            return newDate;
        });
        setCalendarData({}); // Takvim verisini temizle
    };

    // Sonraki ay
    const goToNextMonth = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + 1);
            return newDate;
        });
        setCalendarData({}); // Takvim verisini temizle
    };

    // Bugüne git
    const goToToday = () => {
        setCurrentDate(new Date());
        setCalendarData({}); // Takvim verisini temizle
    };

    // Günlük detay modal'ını aç
    const handleDayClick = (date, dayData) => {
        const today = new Date();
        // Sadece tarih kısmını karşılaştır (saat farklarını göz ardı et)
        today.setHours(23, 59, 59, 999);

        // Gelecek tarihler için tıklama devre dışı
        if (date > today) {
            return;
        }

        // Sadece pomodoro verisi olan günler için detay göster
        if (dayData && dayData.pomodoros > 0) {
            setSelectedDate(date);
            setShowDailyDetail(true);
        }
    };

    // Modal'ı kapat
    const handleCloseModal = () => {
        setShowDailyDetail(false);
        setSelectedDate(null);
    };

    // Pomodoro sayısına göre renk yoğunluğu
    const getPomodoroIntensity = (count) => {
        if (count === 0) return 'intensity-0';
        if (count <= 2) return 'intensity-1';
        if (count <= 4) return 'intensity-2';
        if (count <= 6) return 'intensity-3';
        if (count <= 8) return 'intensity-4';
        return 'intensity-5';
    };

    // Takvim günlerini oluştur
    const renderCalendarDays = () => {
        const { daysInMonth, firstDayOfWeek } = getDaysInMonth(currentDate);
        const days = [];
        const today = new Date();
        // Bugünün tarih kısmını al (saat farklarını göz ardı et)
        const todayDateString = formatDateToLocal(today);

        // Önceki ayın boş günleri
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(
                <div key={`empty-${i}`} className="calendar-day empty"></div>
            );
        }

        // Bu ayın günleri - currentMonth ve currentYear kullan
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dateString = formatDateToLocal(date); // Yerel format kullan
            const dayData = calendarData[dateString] || { pomodoros: 0, minutes: 0 };
            const isToday = dateString === todayDateString; // String karşılaştırması
            const isFuture = dateString > todayDateString; // String karşılaştırması

            days.push(
                <div
                    key={`${currentYear}-${currentMonth}-${day}`} // Unique key with year and month
                    className={`calendar-day ${getPomodoroIntensity(dayData.pomodoros)} ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''} ${dayData.pomodoros > 0 && !isFuture ? 'clickable' : ''}`}
                    title={`${day} ${monthNames[currentMonth]} ${currentYear}\n${dayData.pomodoros} Pomodoro\n${dayData.minutes} dakika${dayData.pomodoros > 0 ? '\n\nDetayları görmek için tıklayın' : ''}`}
                    onClick={() => handleDayClick(date, dayData)}
                >
                    <span className="day-number">{day}</span>
                    {dayData.pomodoros > 0 && (
                        <span className="pomodoro-count">{dayData.pomodoros}</span>
                    )}
                </div>
            );
        }

        return days;
    };

    // İstatistikler
    const monthStats = useMemo(() => {
        const { daysInMonth } = getDaysInMonth(currentDate);
        let totalPomodoros = 0;
        let totalMinutes = 0;
        let activeDays = 0;

        // Sadece mevcut ayın günlerini say
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dateString = formatDateToLocal(date); // Yerel format kullan
            const dayData = calendarData[dateString];

            if (dayData && dayData.pomodoros > 0) {
                totalPomodoros += dayData.pomodoros;
                totalMinutes += dayData.minutes;
                activeDays++;
            }
        }

        return {
            totalPomodoros,
            totalMinutes,
            activeDays,
            averagePerDay: activeDays > 0 ? Math.round(totalPomodoros / activeDays) : 0
        };
    }, [calendarData, currentMonth, currentYear]);

    if (!isAuthenticated()) {
        return (
            <div className="calendar-container">
                <div className="calendar-not-authenticated">
                    <div className="calendar-auth-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </div>
                    <h3>🗓️ Aktivite Takviminizi Keşfedin</h3>
                    <p>GitHub tarzı aktivite takvimi ile günlük pomodoro geçmişinizi görsel olarak takip edin. Hangi günlerde ne kadar verimli olduğunuzu kolayca görün!</p>
                    
                    <div className="calendar-features">
                        <div className="calendar-feature">
                            <span className="calendar-feature-icon">📊</span>
                            <span>Günlük aktivite yoğunluğu</span>
                        </div>
                        <div className="calendar-feature">
                            <span className="calendar-feature-icon">🎯</span>
                            <span>Detaylı oturum bilgileri</span>
                        </div>
                        <div className="calendar-feature">
                            <span className="calendar-feature-icon">📈</span>
                            <span>Aylık performans özeti</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <div className="calendar-navigation">
                    <button
                        className="calendar-nav-btn"
                        onClick={goToPreviousMonth}
                        title="Önceki Ay"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>

                    <div className="calendar-title">
                        <h2>{monthNames[currentMonth]} {currentYear}</h2>
                        <button
                            className="today-btn"
                            onClick={goToToday}
                            title="Bugüne Git"
                        >
                            Bugün
                        </button>
                    </div>

                    <button
                        className="calendar-nav-btn"
                        onClick={goToNextMonth}
                        title="Sonraki Ay"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                </div>

                <div className="calendar-stats">
                    <div className="stat-item">
                        <span className="stat-value">{monthStats.totalPomodoros}</span>
                        <span className="stat-label">Toplam Pomodoro</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{Math.round(monthStats.totalMinutes / 60)}s</span>
                        <span className="stat-label">Toplam Süre</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{monthStats.activeDays}</span>
                        <span className="stat-label">Aktif Gün</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{monthStats.averagePerDay}</span>
                        <span className="stat-label">Günlük Ortalama</span>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="calendar-loading">
                    <div className="calendar-spinner"></div>
                    <p>Takvim yükleniyor...</p>
                </div>
            ) : error ? (
                <div className="calendar-error">
                    <p>{error}</p>
                    <button onClick={fetchCalendarData}>Tekrar Dene</button>
                </div>
            ) : (
                <>
                    <div className="calendar-grid">
                        <div className="calendar-weekdays">
                            {dayNames.map(day => (
                                <div key={day} className="weekday">{day}</div>
                            ))}
                        </div>

                        <div className="calendar-days">
                            {renderCalendarDays()}
                        </div>
                    </div>

                    <div className="calendar-legend">
                        <span className="legend-label">Az</span>
                        <div className="legend-colors">
                            <div className="legend-color intensity-0" title="0 Pomodoro"></div>
                            <div className="legend-color intensity-1" title="1-2 Pomodoro"></div>
                            <div className="legend-color intensity-2" title="3-4 Pomodoro"></div>
                            <div className="legend-color intensity-3" title="5-6 Pomodoro"></div>
                            <div className="legend-color intensity-4" title="7-8 Pomodoro"></div>
                            <div className="legend-color intensity-5" title="9+ Pomodoro"></div>
                        </div>
                        <span className="legend-label">Çok</span>
                    </div>
                </>
            )}

            {/* Günlük Detay Modal */}
            <DailyDetailModal
                isOpen={showDailyDetail}
                onClose={handleCloseModal}
                selectedDate={selectedDate}
            />
        </div>
    );
}

export default CalendarView;