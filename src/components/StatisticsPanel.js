import React, { useState, useEffect, useMemo, useCallback } from 'react';
import apiService, { createAuthApiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoginPrompt from './LoginPrompt';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend,
    ReferenceLine,
    Area,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    AreaChart
} from 'recharts';
import { useTasks } from '../contexts/TasksContext';

function StatisticsPanel() {
    const [stats, setStats] = useState(null);
    const [weeklyStats, setWeeklyStats] = useState([]);
    const [monthlyStats, setMonthlyStats] = useState(null);
    const [monthlyDailySeries, setMonthlyDailySeries] = useState([]);
    const [allTimeStats, setAllTimeStats] = useState(null);
    const [allMonthlySeries, setAllMonthlySeries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState('week');
    const [activeTab, setActiveTab] = useState('overview');
    const [previousDayStats, setPreviousDayStats] = useState(null);
    const [isNewUser, setIsNewUser] = useState(false);
    const { tasks } = useTasks();
    const { currentUser, getAuthHeader, isAuthenticated } = useAuth();
    const statsService = useMemo(() => {
        return currentUser ? createAuthApiService(getAuthHeader) : apiService;
    }, [currentUser, getAuthHeader]);

    // userId'yi de bir memorized değer olarak tanımla
    const userId = useMemo(() => {
        return currentUser ? currentUser.id : "defaultUser";
    }, [currentUser]);

    // Trend hesaplama fonksiyonu - dakika bazında karşılaştırma
    const calculateTrend = useMemo(() => {
        // Seçili aralığın zaman serisine göre son iki nokta arasındaki yüzde değişimi
        const series = (() => {
            if (timeRange === 'week') return weeklyStats;
            if (timeRange === 'month') return monthlyDailySeries;
            return allMonthlySeries;
        })();

        if (!series || series.length < 2) {
            return { percentage: 0, isPositive: true };
        }

        const last = series[series.length - 1];
        const prev = series[series.length - 2];
        const prevMinutes = prev.dakika || 0;
        const lastMinutes = last.dakika || 0;
        if (prevMinutes === 0) {
            return { percentage: 0, isPositive: lastMinutes >= 0 };
        }
        const difference = lastMinutes - prevMinutes;
        const percentage = Math.round((difference / prevMinutes) * 100);
        return { percentage: Math.abs(percentage), isPositive: percentage >= 0 };
    }, [timeRange, weeklyStats, monthlyDailySeries, allMonthlySeries]);

    // En verimli günü bulma
    const mostProductiveDay = useMemo(() => {
        if (!weeklyStats || weeklyStats.length === 0 || isNewUser) {
            return { day: 'Pazartesi', averagePomodoros: 0 };
        }

        // Her gün için ortalama pomodoro sayısını hesapla
        let bestDay = weeklyStats[0];

        for (const day of weeklyStats) {
            if (day.tamamlanan > bestDay.tamamlanan) {
                bestDay = day;
            }
        }

        // Türkçe gün adını döndür
        const dayNameMap = {
            'Pzt': 'Pazartesi',
            'Sal': 'Salı',
            'Çar': 'Çarşamba',
            'Per': 'Perşembe',
            'Cum': 'Cuma',
            'Cmt': 'Cumartesi',
            'Paz': 'Pazar'
        };

        return {
            day: dayNameMap[bestDay.name] || bestDay.name,
            averagePomodoros: bestDay.tamamlanan
        };
    }, [weeklyStats, isNewUser]);

    // En uzun ve en kısa süreli görevleri bulma
    const taskDurationStats = useMemo(() => {
        if (!tasks || tasks.length === 0 || isNewUser) {
            return {
                shortestTask: { name: '-', duration: 0 },
                longestTask: { name: '-', duration: 0 },
                averageDuration: 0
            };
        }

        // Sadece tamamlanmış görevleri al
        const completedTasks = tasks.filter(task => task.isCompleted);

        if (completedTasks.length === 0) {
            return {
                shortestTask: { name: '-', duration: 0 },
                longestTask: { name: '-', duration: 0 },
                averageDuration: 0
            };
        }

        // En kısa ve en uzun görevleri bul
        let shortestTask = completedTasks[0];
        let longestTask = completedTasks[0];

        for (const task of completedTasks) {
            if (task.duration < shortestTask.duration) {
                shortestTask = task;
            }
            if (task.duration > longestTask.duration) {
                longestTask = task;
            }
        }

        // Ortalama süreyi hesapla
        const totalDuration = completedTasks.reduce((sum, task) => sum + task.duration, 0);
        const averageDuration = Math.round(totalDuration / completedTasks.length);

        return {
            shortestTask: { name: shortestTask.taskName, duration: shortestTask.duration },
            longestTask: { name: longestTask.taskName, duration: longestTask.duration },
            averageDuration
        };
    }, [tasks, isNewUser]);

    // Görev adı patternlerini analiz etme
    const taskPatterns = useMemo(() => {
        if (!tasks || tasks.length < 5 || isNewUser) {
            return { mostFrequent: 'Henüz yeterli veri yok' };
        }

        // Görev adlarından anahtar kelimeleri çıkar
        const taskNameWords = tasks
            .map(task => task.taskName.toLowerCase().split(/\s+/))
            .flat()
            .filter(word => word.length > 3); // 3 harften uzun kelimeleri al

        // Kelimelerin frekansını hesapla
        const wordFrequency = {};
        taskNameWords.forEach(word => {
            wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        });

        // En sık geçen kelimeyi bul
        let mostFrequentWord = '';
        let highestFrequency = 0;

        Object.entries(wordFrequency).forEach(([word, count]) => {
            if (count > highestFrequency) {
                mostFrequentWord = word;
                highestFrequency = count;
            }
        });

        // Eğer kelime bulunamazsa veya çok az görüldüyse
        if (mostFrequentWord === '' || highestFrequency < 2) {
            return { mostFrequent: 'Henüz belirgin bir patern yok' };
        }

        return { mostFrequent: mostFrequentWord };
    }, [tasks, isNewUser]);

    // Gelecek hedef önerisi
    const targetSuggestion = useMemo(() => {
        if (!stats || !weeklyStats || weeklyStats.length === 0 || isNewUser) {
            return 8; // Varsayılan hedef
        }

        // Son 7 günün ortalamasını bul
        const totalLastWeek = weeklyStats.reduce((sum, day) => sum + day.tamamlanan, 0);
        const avgLastWeek = Math.round(totalLastWeek / weeklyStats.length);

        // Ortalamanın biraz üstünde bir hedef öner
        return Math.max(8, avgLastWeek + 1);
    }, [stats, weeklyStats, isNewUser]);

    const pieData = useMemo(() => {
        if (!stats || isNewUser) return [];
        return [
            { name: 'Bugün', value: stats.completedToday },
            { name: 'Diğer Günler', value: Math.max(0, stats.totalCompletedSessions - stats.completedToday) }
        ];
    }, [stats, isNewUser]);

    const chartData = useMemo(() => {
        if (isNewUser) return [];
        if (timeRange === 'week') return weeklyStats || [];
        if (timeRange === 'month') return monthlyDailySeries || [];
        return allMonthlySeries || [];
    }, [timeRange, weeklyStats, monthlyDailySeries, allMonthlySeries, isNewUser]);

    const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];

    // Haftanın günleri sabit dizi
    const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    // chartData'yı haftanın günlerine göre sırala ve eksik günler için 0 tamamlanan ve 0 dakika koy (yalnızca hafta görünümünde)
    const weekChartData = useMemo(() => {
        if (timeRange !== 'week') return chartData;
        return weekDays.map(dayName =>
            chartData.find(day => day.name === dayName) || { name: dayName, tamamlanan: 0, dakika: 0 }
        );
    }, [chartData, timeRange]);

    const formatDateToLocal = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Seçili aralık için özet değerleri hesapla (erken return'lerden ÖNCE)
    const selectedRangeTotals = useMemo(() => {
        if (timeRange === 'week') {
            const completed = (weeklyStats || []).reduce((sum, d) => sum + (d.tamamlanan || 0), 0);
            const minutes = (weeklyStats || []).reduce((sum, d) => sum + (d.dakika || 0), 0);
            const avg = completed > 0 ? Math.round(minutes / completed) : 0;
            return { completed, minutes, avgDuration: avg, label: 'Bu Hafta' };
        }
        if (timeRange === 'month') {
            const completed = (monthlyDailySeries || []).reduce((sum, d) => sum + (d.tamamlanan || 0), 0);
            const minutes = (monthlyDailySeries || []).reduce((sum, d) => sum + (d.dakika || 0), 0);
            const avg = completed > 0 ? Math.round(minutes / completed) : 0;
            return { completed, minutes, avgDuration: avg, label: 'Bu Ay' };
        }
        const completed = allTimeStats?.totalPomodoros || 0;
        const minutes = allTimeStats?.totalMinutes || 0;
        const avg = completed > 0 ? Math.round(minutes / completed) : 0;
        return { completed, minutes, avgDuration: avg, label: 'Tümü' };
    }, [timeRange, weeklyStats, monthlyDailySeries, allTimeStats]);

    const fetchAllStats = useCallback(async () => {
        // If not authenticated, don't fetch stats
        if (!isAuthenticated()) {
            setLoading(false);
            return;
        }

        // Check if there are any completed tasks
        const hasCompletedTasks = tasks && tasks.some(task => task.isCompleted);
        if (!hasCompletedTasks) {
            setLoading(false);
            setStats(null);
            setWeeklyStats([]);
            return;
        }

        try {
            setLoading(true);

            // Tüm verileri paralel olarak çekelim
            const now = new Date();
            const [generalStats, weeklyData, monthlyData] = await Promise.all([
                statsService.getStatistics(userId),
                statsService.getWeeklyStats(userId),
                statsService.getMonthlyStats(now.getFullYear(), now.getMonth() + 1),
            ]);

            setStats(generalStats);
            setWeeklyStats(weeklyData);
            setMonthlyStats(monthlyData);
            setAllTimeStats({
                totalPomodoros: generalStats.totalCompletedSessions,
                totalMinutes: generalStats.totalMinutesWorked,
                averageSessionDuration: generalStats.averageSessionDuration
            });

            // Aylık günlük seri (grafikler ve trendler için)
            try {
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                const calendar = await statsService.getCalendarData(
                    formatDateToLocal(monthStart),
                    formatDateToLocal(monthEnd)
                );
                const dailySeries = (calendar?.data || []).map(d => ({
                    name: d.date.slice(8, 10),
                    tamamlanan: d.pomodoros,
                    dakika: d.minutes
                }));
                setMonthlyDailySeries(dailySeries);
            } catch (e) {
                console.warn('Aylık günlük seri alınamadı', e);
                setMonthlyDailySeries([]);
            }

            // Tüm zamanlar için aylık seri
            try {
                const sessions = await statsService.getSessions();
                const completed = (sessions || []).filter(s => s.isCompleted && s.endTime);
                const buckets = {};
                completed.forEach(s => {
                    const dt = new Date(s.endTime);
                    if (!isNaN(dt)) {
                        const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
                        if (!buckets[key]) buckets[key] = { name: key, tamamlanan: 0, dakika: 0 };
                        buckets[key].tamamlanan += 1;
                        buckets[key].dakika += s.duration || 0;
                    }
                });
                const monthlySeries = Object.values(buckets)
                    .sort((a, b) => (a.name < b.name ? -1 : 1));
                setAllMonthlySeries(monthlySeries);
            } catch (e) {
                console.warn('Tüm zamanlar aylık seri oluşturulamadı', e);
                setAllMonthlySeries([]);
            }

            // Yeni kullanıcı kontrolü
            if (generalStats.totalCompletedSessions === 0 &&
                (!tasks || tasks.length === 0)) {
                setIsNewUser(true);
            } else {
                setIsNewUser(false);
            }

            // Önceki gün verilerini bulalım
            if (weeklyData && weeklyData.length > 1) {
                const today = weeklyData[weeklyData.length - 1];
                const yesterday = weeklyData[weeklyData.length - 2];

                if (today && yesterday) {
                    setPreviousDayStats({
                        completedPomodoros: yesterday.tamamlanan,
                        totalMinutes: yesterday.dakika
                    });
                }
            }

            setError(null);
        } catch (error) {
            console.error("İstatistikler yüklenirken hata oluştu:", error);
            setError("İstatistikler yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    }, [statsService, userId, tasks, isAuthenticated]);

    useEffect(() => {
        fetchAllStats();
    }, [fetchAllStats]);

    // If user is not authenticated, show login prompt
    if (!isAuthenticated()) {
        return (
            <div className="statistics-panel modern">
                <LoginPrompt
                    message="İstatistiklerinizi Görüntüleyin"
                    actionText="Pomodoro istatistiklerinizi takip etmek ve ilerlemenizi görmek için giriş yapın veya kayıt olun."
                />
            </div>
        );
    }

    if (loading) return (
        <div className="statistics-panel loading">
            <div className="loader"></div>
            <p>İstatistikler yükleniyor...</p>
        </div>
    );

    if (error && !stats) return (
        <div className="statistics-panel error">
            <div className="error-icon">!</div>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Yeniden Dene</button>
        </div>
    );

    // Check if there are any completed tasks
    const hasCompletedTasks = tasks && tasks.some(task => task.isCompleted);
    if (!hasCompletedTasks) {
        return (
            <div className="statistics-panel modern new-user">
                <div className="welcome-container">
                    <div className="welcome-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                    <h2>İstatistikler İçin Görev Tamamlayın</h2>
                    <p>İstatistikleri görmek için en az bir görevi tamamlamanız gerekiyor. Görevlerinizi tamamladıktan sonra burada detaylı istatistiklerinizi görebileceksiniz.</p>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    // 1. Verimlilik hesaplama mantığını düzeltme
    const calculateEfficiency = () => {
        if (stats.completedToday === 0) return 0;

        // Günlük hedef 8 pomodoro üzerinden hesaplama
        return Math.min(100, Math.round((stats.completedToday / 8) * 100));
    };

    const calculateWeeklyProgress = () => {
        if (!weeklyStats || weeklyStats.length === 0) return 0;

        // Haftalık toplam tamamlanan pomodoro sayısı
        const weeklyCompleted = weeklyStats.reduce((sum, day) => sum + day.tamamlanan, 0);

        // Haftalık hedef: 8 pomodoro × 7 gün = 56 pomodoro
        const weeklyTarget = 56;

        return Math.min(100, Math.round((weeklyCompleted / weeklyTarget) * 100));
    };

    const calculateGoalProgress = () => {
        return Math.min(100, (stats.completedToday / 8) * 100);
    };

    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}s ${mins}dk` : `${mins}dk`;
    };



    return (
        <div className="statistics-panel">
            {loading ? (
                <div className="spinner-container">
                    <div className="spinner"></div>
                    <div className="spinner-text">İstatistikler yükleniyor...</div>
                </div>
            ) : error ? (
                <div className="error-message">
                    <p>{error}</p>
                </div>
            ) : isNewUser ? (
                <div className="new-user-message">
                    <h3>Hoş Geldiniz!</h3>
                    <p>İlk görevinizi ekleyerek başlayın.</p>
                </div>
            ) : (
                <div className="statistics-panel modern">
                    <div className="statistics-header">
                        <h2>İstatistikler</h2>
                        <div className="statistics-tabs">
                            <button
                                className={timeRange === 'week' ? 'active' : ''}
                                onClick={() => setTimeRange('week')}
                            >
                                Haftalık
                            </button>
                            <button
                                className={timeRange === 'month' ? 'active' : ''}
                                onClick={() => setTimeRange('month')}
                            >
                                Aylık
                            </button>
                            <button
                                className={timeRange === 'all' ? 'active' : ''}
                                onClick={() => setTimeRange('all')}
                            >
                                Tümü
                            </button>
                        </div>
                    </div>

                    <div className="statistics-nav-tabs">
                        <button
                            className={activeTab === 'overview' ? 'active' : ''}
                            onClick={() => setActiveTab('overview')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7"></rect>
                                <rect x="14" y="3" width="7" height="7"></rect>
                                <rect x="14" y="14" width="7" height="7"></rect>
                                <rect x="3" y="14" width="7" height="7"></rect>
                            </svg>
                            Genel Bakış
                        </button>
                        <button
                            className={activeTab === 'charts' ? 'active' : ''}
                            onClick={() => setActiveTab('charts')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="20" x2="18" y2="10"></line>
                                <line x1="12" y1="20" x2="12" y2="4"></line>
                                <line x1="6" y1="20" x2="6" y2="14"></line>
                            </svg>
                            Grafikler
                        </button>
                        <button
                            className={activeTab === 'trends' ? 'active' : ''}
                            onClick={() => setActiveTab('trends')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                <polyline points="17 6 23 6 23 12"></polyline>
                            </svg>
                            Trendler
                        </button>
                    </div>

                    {activeTab === 'overview' && (
                        <>
                            <div className="statistics-cards modern-grid">
                                <div className="stat-card highlight">
                                    <div className="stat-card-content">
                                        <div className="stat-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <polyline points="12 6 12 12 16 14"></polyline>
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="stat-value">{formatDuration(selectedRangeTotals.minutes)}</div>
                                            <div className="stat-label">{selectedRangeTotals.label} Çalışma</div>
                                        </div>
                                    </div>
                                    {chartData && chartData.length >= 2 && (
                                        <div className={`stat-trend ${calculateTrend.isPositive ? 'positive' : 'negative'}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                {calculateTrend.isPositive ? (
                                                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                                ) : (
                                                    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                                                )}
                                                {calculateTrend.isPositive ? (
                                                    <polyline points="17 6 23 6 23 12"></polyline>
                                                ) : (
                                                    <polyline points="17 18 23 18 23 12"></polyline>
                                                )}
                                            </svg>
                                            <span>%{calculateTrend.percentage} ({calculateTrend.isPositive ? "artış" : "azalış"})</span>
                                        </div>
                                    )}
                                </div>

                                <div className="stat-card">
                                    <div className="stat-card-content">
                                        <div className="stat-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="stat-value">{selectedRangeTotals.completed}</div>
                                            <div className="stat-label">{selectedRangeTotals.label} Tamamlanan</div>
                                            <div className="stat-progress">
                                                <div className="mini-progress">
                                                    <div
                                                        className="mini-progress-fill"
                                                        style={{ width: `${Math.min(100, ((timeRange === 'week' ? selectedRangeTotals.completed / 56 : timeRange === 'month' ? selectedRangeTotals.completed / 240 : 1) * 100))}%` }}
                                                    ></div>
                                                </div>
                                                <span className="mini-progress-text">
                                                    {timeRange === 'week'
                                                        ? `${Math.min(100, Math.round((selectedRangeTotals.completed / 56) * 100))}%`
                                                        : timeRange === 'month'
                                                            ? `${Math.min(100, Math.round((selectedRangeTotals.completed / 240) * 100))}%`
                                                            : `100%`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-card-content">
                                        <div className="stat-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                                <polyline points="17 6 23 6 23 12"></polyline>
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="stat-value">{selectedRangeTotals.completed}</div>
                                            <div className="stat-label">Seçili Aralık Pomodoro</div>
                                            <div className="stat-mini-text">Ortalama: {selectedRangeTotals.avgDuration} dk/pomodoro</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-card-content">
                                        <div className="stat-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                                <line x1="3" y1="10" x2="21" y2="10"></line>
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="stat-value">{formatDuration(allTimeStats.totalMinutes)}</div>
                                            <div className="stat-label">Toplam Çalışma (Tümü)</div>
                                            <div className="stat-mini-text">{selectedRangeTotals.label}: {selectedRangeTotals.minutes} dk</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="statistics-summary modern">
                                <div className="summary-item">
                                    <div className="summary-header">
                                        <span className="summary-label">Bugünün Verimliliği</span>
                                        <span className="summary-value">
                                            {calculateEfficiency()}%
                                        </span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${calculateEfficiency()}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="summary-item">
                                    <div className="summary-header">
                                        <span className="summary-label">{timeRange === 'week' ? 'Haftalık Hedef (56 Pomodoro)' : timeRange === 'month' ? 'Aylık Hedef (~240 Pomodoro)' : 'Genel Hedef'}</span>
                                        <span className="summary-value">
                                            {timeRange === 'week' ? `${selectedRangeTotals.completed}/56` : timeRange === 'month' ? `${selectedRangeTotals.completed}/240` : `${allTimeStats.totalPomodoros}`}
                                        </span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill accent"
                                            style={{
                                                width: `${Math.round(
                                                    timeRange === 'week'
                                                        ? Math.min(100, (selectedRangeTotals.completed / 56) * 100)
                                                        : timeRange === 'month'
                                                            ? Math.min(100, (selectedRangeTotals.completed / 240) * 100)
                                                            : 100
                                                )}%`
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'charts' && (
                        <>
                            {timeRange === 'week' && chartData.length > 0 ? (
                                <div>
                                    <div className="statistics-charts">
                                        {/* Modern Area Chart */}
                                        <ResponsiveContainer width="100%" height={260}>
                                            <AreaChart data={weekChartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                                                <defs>
                                                    <linearGradient id="colorPomodoro" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#40c463" stopOpacity={0.8} />
                                                        <stop offset="95%" stopColor="#40c463" stopOpacity={0.1} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis allowDecimals={false} />
                                                <Tooltip formatter={(value) => `${value} pomodoro`} />
                                                <Area type="monotone" dataKey="tamamlanan" name="Tamamlanan Pomodoro" stroke="#40c463" fill="url(#colorPomodoro)" strokeWidth={3} dot={{ r: 6, fill: '#40c463', strokeWidth: 0 }} activeDot={{ r: 8, fill: '#40c463', stroke: 'white', strokeWidth: 2 }} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="chart-summary">
                                        <div className="chart-stat-item">
                                            <span className="chart-stat-label">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                                </svg>
                                                En Verimli Gün
                                            </span>
                                            <span className="chart-stat-value">
                                                {weekChartData.reduce((max, day) => day.tamamlanan > max.tamamlanan ? day : max, weekChartData[0]).name}
                                                <small>({weekChartData.reduce((max, day) => day.tamamlanan > max.tamamlanan ? day : max, weekChartData[0]).tamamlanan} pomodoro)</small>
                                            </span>
                                        </div>
                                        <div className="chart-stat-item">
                                            <span className="chart-stat-label">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10"></circle>
                                                    <polyline points="12 6 12 12 16 14"></polyline>
                                                </svg>
                                                Hedef Üzeri Günler
                                            </span>
                                            <span className="chart-stat-value">
                                                {weekChartData.filter(day => day.tamamlanan >= 8).length} gün
                                            </span>
                                        </div>
                                        <div className="chart-stat-item">
                                            <span className="chart-stat-label">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                                    <polyline points="17 6 23 6 23 12"></polyline>
                                                </svg>
                                                Günlük Ortalama
                                            </span>
                                            <span className="chart-stat-value">
                                                {Math.round(weekChartData.reduce((sum, day) => sum + day.tamamlanan, 0) / weekChartData.length)} pomodoro
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : timeRange === 'month' && monthlyStats ? (
                                <div>
                                    <div className="statistics-charts">
                                        <ResponsiveContainer width="100%" height={260}>
                                            <BarChart data={[{ name: 'Bu Ay', tamamlanan: monthlyStats.totalPomodoros, dakika: monthlyStats.totalMinutes }]}
                                                margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis allowDecimals={false} />
                                                <Tooltip formatter={(value, name) => name === 'tamamlanan' ? `${value} pomodoro` : `${value} dk`} />
                                                <Bar dataKey="tamamlanan" name="Tamamlanan Pomodoro" fill="#40c463" />
                                                <Bar dataKey="dakika" name="Dakika" fill="#3498db" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="chart-summary">
                                        <div className="chart-stat-item">
                                            <span className="chart-stat-label">Toplam Pomodoro</span>
                                            <span className="chart-stat-value">{monthlyStats.totalPomodoros}</span>
                                        </div>
                                        <div className="chart-stat-item">
                                            <span className="chart-stat-label">Toplam Dakika</span>
                                            <span className="chart-stat-value">{monthlyStats.totalMinutes} dk</span>
                                        </div>
                                        <div className="chart-stat-item">
                                            <span className="chart-stat-label">Aktif Gün</span>
                                            <span className="chart-stat-value">{monthlyStats.activeDays} gün</span>
                                        </div>
                                    </div>
                                </div>
                            ) : timeRange === 'all' && allTimeStats ? (
                                <div>
                                    <div className="statistics-charts">
                                        <ResponsiveContainer width="100%" height={260}>
                                            <AreaChart data={allMonthlySeries} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                                                <defs>
                                                    <linearGradient id="colorAll" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#9b59b6" stopOpacity={0.8} />
                                                        <stop offset="95%" stopColor="#9b59b6" stopOpacity={0.1} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis allowDecimals={false} />
                                                <Tooltip formatter={(value, name) => name === 'tamamlanan' ? `${value} pomodoro` : `${value} dk`} />
                                                <Area type="monotone" dataKey="tamamlanan" name="Aylık Pomodoro" stroke="#9b59b6" fill="url(#colorAll)" strokeWidth={3} dot={{ r: 4, fill: '#9b59b6', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#9b59b6', stroke: 'white', strokeWidth: 2 }} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="chart-summary">
                                        <div className="chart-stat-item">
                                            <span className="chart-stat-label">Toplam Pomodoro</span>
                                            <span className="chart-stat-value">{allTimeStats.totalPomodoros}</span>
                                        </div>
                                        <div className="chart-stat-item">
                                            <span className="chart-stat-label">Toplam Dakika</span>
                                            <span className="chart-stat-value">{allTimeStats.totalMinutes} dk</span>
                                        </div>
                                        <div className="chart-stat-item">
                                            <span className="chart-stat-label">Oturum Ortalama Süre</span>
                                            <span className="chart-stat-value">{Math.round(allTimeStats.averageSessionDuration)} dk</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="empty-stats-message">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="20" x2="18" y2="10"></line>
                                        <line x1="12" y1="20" x2="12" y2="4"></line>
                                        <line x1="6" y1="20" x2="6" y2="14"></line>
                                    </svg>
                                    <h3>Henüz Grafik Verisi Yok</h3>
                                    <p>Grafikler, tamamlanan pomodorolarınızla birlikte oluşacaktır. İlk pomodoro görevinizi tamamladığınızda burada verilerinizi görebilirsiniz.</p>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'trends' && (
                        <>
                            {stats.totalCompletedSessions > 0 ? (
                                <div className="statistics-trends">
                                    <div className="trend-card">
                                        <div className="trend-header">
                                            <h3>Çalışma Süresi Trendi</h3>
                                        </div>
                                        <div className="trend-chart">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                                    <YAxis axisLine={false} tickLine={false} />
                                                    <Tooltip
                                                        formatter={(value, name) => [
                                                            `${value} dk`,
                                                            'Çalışma Süresi'
                                                        ]}
                                                        contentStyle={{
                                                            backgroundColor: 'var(--color-panel)',
                                                            borderRadius: '8px',
                                                            border: '1px solid var(--color-border)',
                                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                        }}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="dakika"
                                                        stroke={COLORS[1]}
                                                        strokeWidth={3}
                                                        dot={{ r: 4, fill: COLORS[1], strokeWidth: 0 }}
                                                        activeDot={{ r: 6, fill: COLORS[1], stroke: 'white', strokeWidth: 2 }}
                                                    />
                                                    {timeRange === 'week' && (
                                                        <ReferenceLine y={200} stroke="#e74c3c" strokeDasharray="3 3" label={{
                                                            value: "Hedef (200dk)",
                                                            position: 'right',
                                                            fill: "#e74c3c",
                                                            fontSize: 12
                                                        }} />
                                                    )}
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="trend-stats">
                                            <div className="trend-stat-item">
                                                <span className="trend-stat-label">{timeRange === 'week' ? 'Haftalık Toplam' : timeRange === 'month' ? 'Aylık Toplam' : 'Aylık Ortalama'}</span>
                                                <span className="trend-stat-value">
                                                    {timeRange === 'week'
                                                        ? weeklyStats.reduce((sum, day) => sum + day.dakika, 0)
                                                        : timeRange === 'month'
                                                            ? monthlyDailySeries.reduce((sum, day) => sum + day.dakika, 0)
                                                            : Math.round((allMonthlySeries.reduce((sum, m) => sum + m.dakika, 0) / Math.max(1, allMonthlySeries.length)))} dk
                                                </span>
                                            </div>
                                            <div className="trend-stat-item">
                                                <span className="trend-stat-label">Günlük Ortalama</span>
                                                <span className="trend-stat-value">
                                                    {timeRange === 'week'
                                                        ? Math.round(weeklyStats.reduce((sum, day) => sum + day.dakika, 0) / Math.max(1, weeklyStats.length))
                                                        : timeRange === 'month'
                                                            ? Math.round(monthlyDailySeries.reduce((sum, day) => sum + day.dakika, 0) / Math.max(1, monthlyDailySeries.length))
                                                            : Math.round((allMonthlySeries.reduce((sum, m) => sum + m.dakika, 0) / Math.max(1, allMonthlySeries.length)) / 30)} dk
                                                </span>
                                            </div>
                                            <div className="trend-stat-item">
                                                <span className="trend-stat-label">En Uzun Çalışma</span>
                                                <span className="trend-stat-value">
                                                    {(() => {
                                                        const series = timeRange === 'week' ? weeklyStats : timeRange === 'month' ? monthlyDailySeries : allMonthlySeries;
                                                        if (!series || series.length === 0) return 0;
                                                        const maxVal = Math.max(...series.map(d => d.dakika || 0));
                                                        const maxItem = series.find(d => (d.dakika || 0) === maxVal);
                                                        return (
                                                            <>
                                                                {maxVal} dk
                                                                <span className="trend-stat-day">({maxItem?.name || ''})</span>
                                                            </>
                                                        );
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {timeRange === 'week' && (
                                        <div className="trend-card">
                                            <div className="trend-header">
                                                <h3>Haftalık Hedef İlerleme</h3>
                                            </div>
                                            <div className="goal-progress">
                                                <div className="goal-details">
                                                    <div className="goal-info">
                                                        <span className="goal-label">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <circle cx="12" cy="12" r="10"></circle>
                                                                <polyline points="12 6 12 12 16 14"></polyline>
                                                            </svg>
                                                            Haftalık Hedef
                                                        </span>
                                                        <span className="goal-value">
                                                            1400 dk
                                                            <small>(56 pomodoro)</small>
                                                        </span>
                                                    </div>
                                                    <div className="goal-info">
                                                        <span className="goal-label">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                                            </svg>
                                                            Tamamlanan
                                                        </span>
                                                        <span className="goal-value">
                                                            {weeklyStats.reduce((sum, day) => sum + day.dakika, 0)} dk
                                                            <small>({Math.round(weeklyStats.reduce((sum, day) => sum + day.dakika, 0) / 25)} pomodoro)</small>
                                                        </span>
                                                    </div>
                                                    <div className="goal-info">
                                                        <span className="goal-label">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                                                <polyline points="17 6 23 6 23 12"></polyline>
                                                            </svg>
                                                            Kalan
                                                        </span>
                                                        <span className="goal-value">
                                                            {Math.max(0, 1400 - weeklyStats.reduce((sum, day) => sum + day.dakika, 0))} dk
                                                            <small>({Math.round(Math.max(0, 1400 - weeklyStats.reduce((sum, day) => sum + day.dakika, 0)) / 25)} pomodoro)</small>
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="goal-progress-bar">
                                                    <div
                                                        className="goal-progress-fill"
                                                        style={{
                                                            width: `${Math.min(100, (weeklyStats.reduce((sum, day) => sum + day.dakika, 0) / 1400) * 100)}%`
                                                        }}
                                                    />
                                                    <div className="goal-progress-text">
                                                        {Math.round((weeklyStats.reduce((sum, day) => sum + day.dakika, 0) / 1400) * 100)}%
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="trend-insight">
                                                <div className="trend-insight-header">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                                        <polyline points="17 6 23 6 23 12"></polyline>
                                                    </svg>
                                                    <h4>İlerleme Trendi</h4>
                                                </div>
                                                <div className="trend-insight-content">
                                                    <p>
                                                        Son 2 haftada pomodoro tamamlama sayınız {calculateTrend.isPositive ? 'artıyor' : 'azalıyor'}.
                                                        {calculateTrend.isPositive
                                                            ? ' Bu tempoyla devam ederseniz, hedeflerinize daha hızlı ulaşabilirsiniz.'
                                                            : ' Daha fazla pomodoro tamamlamak için molaları daha etkili kullanmayı deneyebilirsiniz.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="empty-stats-message">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                        <polyline points="17 6 23 6 23 12"></polyline>
                                    </svg>
                                    <h3>Henüz Trend Verisi Yok</h3>
                                    <p>Trendleri görebilmek için birkaç pomodoro tamamlamanız gerekiyor. Biraz daha kullanımdan sonra burada kişiselleştirilmiş verimlilik önerilerinizi göreceksiniz.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )
            }
        </div >
    );
}

export default StatisticsPanel;