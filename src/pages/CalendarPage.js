// src/pages/CalendarPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createAuthApiService } from '../services/api';
import Header from '../components/Header';
import CalendarView from '../components/CalendarView';
import DailyDetailModal from '../components/DailyDetailModal';
import LoginPrompt from '../components/LoginPrompt';

function CalendarPage() {
    const { isAuthenticated, getAuthHeader } = useAuth();
    const [selectedDate, setSelectedDate] = useState(null);
    const [isDailyDetailOpen, setIsDailyDetailOpen] = useState(false);
    const [monthlyStats, setMonthlyStats] = useState({ totalPomodoros: 0, streak: 0 });

    const authApiService = useMemo(() => {
        return createAuthApiService(getAuthHeader);
    }, [getAuthHeader]);

    // Aylık istatistikleri getir
    useEffect(() => {
        const fetchMonthlyStats = async () => {
            if (!isAuthenticated()) return;

            try {
                const now = new Date();
                const year = now.getFullYear();
                const month = now.getMonth();

                // Bu ayın ilk ve son günleri
                const startDate = new Date(year, month, 1);
                const endDate = new Date(year, month + 1, 0);

                const startDateStr = startDate.toISOString().split('T')[0];
                const endDateStr = endDate.toISOString().split('T')[0];

                const response = await authApiService.getCalendarData(startDateStr, endDateStr);

                // Bu ay toplam pomodoro sayısını hesapla
                const totalPomodoros = response.summary ? response.summary.totalPomodoros : 0;

                // Basit streak hesaplama (son 7 gün içinde aktif günler)
                const today = new Date();
                let streak = 0;

                if (response && response.data) {
                    for (let i = 0; i < 7; i++) {
                        const checkDate = new Date(today);
                        checkDate.setDate(today.getDate() - i);
                        const dateString = checkDate.toISOString().split('T')[0];

                        const dayData = response.data.find(d => d.date === dateString);

                        if (dayData && dayData.pomodoros > 0) {
                            streak++;
                        } else if (i === 0) {
                            // Bugün hiç pomodoro yoksa streak devam ediyor
                            continue;
                        } else {
                            break;
                        }
                    }
                }

                setMonthlyStats({ totalPomodoros, streak });
            } catch (error) {
                console.error('Monthly stats fetch error:', error);
            }
        };

        fetchMonthlyStats();
    }, [isAuthenticated, authApiService]);

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setIsDailyDetailOpen(true);
    };

    const handleCloseDailyDetail = () => {
        setIsDailyDetailOpen(false);
        setSelectedDate(null);
    };

    if (!isAuthenticated()) {
        return (
            <div className="calendar-page">
                <Header />
                <div className="calendar-page-content">
                    <div className="calendar-page-header">
                        <h1>Pomodoro Takvimi</h1>
                        <p>Günlük pomodoro aktivitelerinizi takip edin</p>
                    </div>
                    <LoginPrompt
                        message="Takvim Görünümü"
                        actionText="Pomodoro geçmişinizi ve günlük aktivitelerinizi görüntülemek için giriş yapın."
                        variant="full"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="calendar-page">
            <Header />
            <div className="calendar-page-content">
                <div className="calendar-page-header">
                    <div className="header-content">
                        <div className="header-text">
                            <h1>
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                Pomodoro Takvimi
                            </h1>
                            <p>Günlük pomodoro aktivitelerinizi takip edin ve verimlilik trendlerinizi görün</p>
                        </div>
                        <div className="header-stats">
                            <div className="stat-card">
                                <div className="stat-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                </div>
                                <div className="stat-info">
                                    <span className="stat-label">Bu Ay</span>
                                    <span className="stat-value">{monthlyStats.totalPomodoros}</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                                    </svg>
                                </div>
                                <div className="stat-info">
                                    <span className="stat-label">Seri</span>
                                    <span className="stat-value">{monthlyStats.streak}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="calendar-page-main">
                    <div className="calendar-container">
                        <CalendarView onDateSelect={handleDateSelect} />
                    </div>
                </div>

                {/* Günlük detay modalı */}
                <DailyDetailModal
                    isOpen={isDailyDetailOpen}
                    onClose={handleCloseDailyDetail}
                    selectedDate={selectedDate}
                />
            </div>
        </div>
    );
}

export default CalendarPage;
