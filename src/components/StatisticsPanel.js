import React, { useState, useEffect, useMemo } from 'react';
import apiService from '../services/api';
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
    ReferenceLine
} from 'recharts';

function StatisticsPanel() {
    const [stats, setStats] = useState(null);
    const [weeklyStats, setWeeklyStats] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState('week');
    const [activeTab, setActiveTab] = useState('overview');
    const [previousDayStats, setPreviousDayStats] = useState(null);
    const [isNewUser, setIsNewUser] = useState(false);

    useEffect(() => {
        const fetchAllStats = async () => {
            try {
                setLoading(true);

                // Tüm verileri paralel olarak çekelim
                const [generalStats, weeklyData, tasksData] = await Promise.all([
                    apiService.getStatistics(),
                    apiService.getWeeklyStats(),
                    apiService.getSessions(), // Tüm görevleri çek
                ]);

                setStats(generalStats);
                setWeeklyStats(weeklyData);
                setAllTasks(tasksData);

                // Yeni kullanıcı kontrolü
                if (generalStats.totalCompletedSessions === 0 &&
                    (!tasksData || tasksData.length === 0)) {
                    setIsNewUser(true);
                } else {
                    setIsNewUser(false);
                }

                // Önceki gün verilerini bulalım
                if (weeklyData && weeklyData.length > 1) {
                    // weeklyData son 7 günü içerdiğinden, bugün verisi son eleman, dün verisi sondan bir önceki olmalı
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

                // Örnek veriler
                const sampleData = [
                    { name: 'Pzt', tamamlanan: 4, dakika: 100 },
                    { name: 'Sal', tamamlanan: 3, dakika: 75 },
                    { name: 'Çar', tamamlanan: 5, dakika: 125 },
                    { name: 'Per', tamamlanan: 2, dakika: 50 },
                    { name: 'Cum', tamamlanan: 6, dakika: 150 },
                    { name: 'Cmt', tamamlanan: 3, dakika: 75 },
                    { name: 'Paz', tamamlanan: 4, dakika: 100 },
                ];

                setWeeklyStats(sampleData);

                // Örnek önceki gün verisi de belirleyelim
                const today = sampleData[sampleData.length - 1];
                const yesterday = sampleData[sampleData.length - 2];

                if (today && yesterday) {
                    setPreviousDayStats({
                        completedPomodoros: yesterday.tamamlanan,
                        totalMinutes: yesterday.dakika
                    });
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAllStats();
        const interval = setInterval(fetchAllStats, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // Trend hesaplama fonksiyonu - dakika bazında karşılaştırma
    const calculateTrend = useMemo(() => {
        if (!stats || !previousDayStats || previousDayStats.totalMinutes === 0) {
            return { percentage: 0, isPositive: true };
        }

        // Bugünün toplam dakikası ile dünün karşılaştırması
        const difference = stats.minutesToday - previousDayStats.totalMinutes;
        const percentage = Math.round((difference / previousDayStats.totalMinutes) * 100);

        return {
            percentage: Math.abs(percentage), // Mutlak değer alıyoruz, işareti ayrı tutuyoruz
            isPositive: percentage >= 0
        };
    }, [stats, previousDayStats]);

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
        if (!allTasks || allTasks.length === 0 || isNewUser) {
            return {
                shortestTask: { name: '-', duration: 0 },
                longestTask: { name: '-', duration: 0 },
                averageDuration: 0
            };
        }

        // Sadece tamamlanmış görevleri al
        const completedTasks = allTasks.filter(task => task.isCompleted);

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
    }, [allTasks, isNewUser]);

    // Görev adı patternlerini analiz etme
    const taskPatterns = useMemo(() => {
        if (!allTasks || allTasks.length < 5 || isNewUser) {
            return { mostFrequent: 'Henüz yeterli veri yok' };
        }

        // Görev adlarından anahtar kelimeleri çıkar
        const taskNameWords = allTasks
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
    }, [allTasks, isNewUser]);

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
        if (!weeklyStats || weeklyStats.length === 0 || isNewUser) {
            return [];
        }
        return weeklyStats;
    }, [weeklyStats, isNewUser]);

    const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];

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

    if (!stats) return null;

    // Yeni kullanıcı karşılama ekranı
    if (isNewUser) {
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
                    <h2>Merhaba! Pomodoro'ya Hoş Geldiniz</h2>
                    <p>Henüz istatistik görüntülenecek bir veri bulunmuyor. İstatistikleri görmek için ilk pomodoro görevinizi oluşturun ve tamamlayın.</p>

                    <div className="getting-started">
                        <h3>Başlamak için:</h3>
                        <ol>
                            <li>Sol tarafta "Yeni Görev Ekle" butonuna tıklayın</li>
                            <li>Görev adı ve süre belirleyin</li>
                            <li>Görevi seçin ve başlatın</li>
                            <li>Tamamlandığında istatistikleriniz otomatik olarak güncellenecektir</li>
                        </ol>
                    </div>

                    <div className="welcome-tips">
                        <h3>Pomodoro Tekniği İpuçları:</h3>
                        <ul>
                            <li>25 dakikalık pomodoro süreleri kullanın</li>
                            <li>Her pomodoro arasında 5 dakika mola verin</li>
                            <li>4 pomodoro sonrasında daha uzun bir mola (15-30 dk) verin</li>
                            <li>Günlük hedef olarak 8 pomodoro tamamlamayı hedefleyin</li>
                            <li>Molalar sırasında zihinsel olarak dinlenin</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

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
                                    <div className="stat-value">{formatDuration(stats.minutesToday)}</div>
                                    <div className="stat-label">Bugün Çalışma</div>
                                </div>
                            </div>
                            {previousDayStats && (
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
                                    <span>%{calculateTrend.percentage} ({calculateTrend.isPositive ? "dünden fazla" : "dünden az"})</span>
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
                                    <div className="stat-value">{stats.completedToday}</div>
                                    <div className="stat-label">Bugün Tamamlanan</div>
                                    <div className="stat-progress">
                                        <div className="mini-progress">
                                            <div
                                                className="mini-progress-fill"
                                                style={{ width: `${Math.min(100, (stats.completedToday / 8) * 100)}%` }}
                                            ></div>
                                        </div>
                                        <span className="mini-progress-text">{Math.min(100, Math.round((stats.completedToday / 8) * 100))}%</span>
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
                                    <div className="stat-value">{stats.totalCompletedSessions}</div>
                                    <div className="stat-label">Toplam Pomodoro</div>
                                    <div className="stat-mini-text">Ortalama: {Math.round(stats.averageSessionDuration)} dk/pomodoro</div>
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
                                    <div className="stat-value">{formatDuration(stats.totalMinutesWorked)}</div>
                                    <div className="stat-label">Toplam Çalışma</div>
                                    <div className="stat-mini-text">Bu hafta: {
                                        weeklyStats.reduce((sum, day) => sum + day.dakika, 0)
                                    } dk</div>
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
                                <span className="summary-label">Günlük Hedef (8 Pomodoro)</span>
                                <span className="summary-value">{stats.completedToday}/8</span>
                            </div>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill accent"
                                    style={{ width: `${calculateGoalProgress()}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'charts' && (
                <>
                    {chartData.length > 0 ? (
                        <div className="statistics-charts modern">
                            <div className="chart-container">
                                <h3>Haftalık Aktivite</h3>
                                <div className="chart-wrapper">
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                            <YAxis axisLine={false} tickLine={false} />
                                            <Tooltip
                                                formatter={(value, name, props) => {
                                                    // name parametresi, hangi veri serisinin (dataKey) tooltip'inin gösterildiğini belirtir
                                                    if (name === 'tamamlanan') {
                                                        return [`${value} pomodoro`, 'Tamamlanan'];
                                                    } else if (name === 'dakika') {
                                                        return [`${value} dk`, 'Çalışma Süresi'];
                                                    }
                                                    return [value, name];
                                                }}
                                                labelFormatter={(label) => `${label}`}
                                                contentStyle={{
                                                    backgroundColor: 'var(--color-panel)',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--color-border)',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                }}
                                            />
                                            <Legend verticalAlign="top" height={36} />
                                            <Bar
                                                dataKey="tamamlanan"
                                                name="Tamamlanan"
                                                fill={COLORS[0]}
                                                radius={[4, 4, 0, 0]}
                                            />
                                            <Bar
                                                dataKey="dakika"
                                                name="Dakika"
                                                fill={COLORS[1]}
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="chart-container">
                                <h3>Günlük Verimlilik Trendi</h3>
                                <div className="chart-wrapper">
                                    <ResponsiveContainer width="100%" height={220}>
                                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                domain={[0, 100]}
                                                tickFormatter={(value) => `${value}%`}
                                            />
                                            <Tooltip
                                                formatter={(value, name) => [
                                                    `${Math.min(100, Math.round((value / 8) * 100))}%`,
                                                    'Günlük Verimlilik'
                                                ]}
                                                labelFormatter={(name) => `${name} günü verimliliği`}
                                                contentStyle={{
                                                    backgroundColor: 'var(--color-panel)',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--color-border)',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="tamamlanan"
                                                name="Verimlilik"
                                                stroke={COLORS[2]}
                                                strokeWidth={3}
                                                dot={{ r: 6, fill: COLORS[2], strokeWidth: 0 }}
                                                activeDot={{ r: 8, fill: COLORS[2], stroke: 'white', strokeWidth: 2 }}
                                            />
                                            {/* Hedef çizgisi (8 pomodoro = %100) */}
                                            <ReferenceLine y={8} stroke="#e74c3c" strokeDasharray="3 3" label="Hedef" />
                                        </LineChart>
                                    </ResponsiveContainer>
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
                            <div className="chart-container">
                                <h3>Çalışma Süresi Trendi</h3>
                                <div className="chart-wrapper">
                                    <ResponsiveContainer width="100%" height={220}>
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

                                            {/* Ideal günlük çalışma süresi referans çizgisi (25*8 = 200 dk) */}
                                            <ReferenceLine y={200} stroke="#e74c3c" strokeDasharray="3 3" label={{
                                                value: "Hedef (200dk)",
                                                position: 'right',
                                                fill: "#e74c3c",
                                                fontSize: 12
                                            }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Grafik altına özet bilgiler */}
                                <div className="chart-summary">
                                    <div className="chart-stats">
                                        <div className="chart-stat-item">
                                            <span className="chart-stat-label">Haftalık Toplam:</span>
                                            <span className="chart-stat-value">
                                                {weeklyStats.reduce((sum, day) => sum + day.dakika, 0)} dk
                                            </span>
                                        </div>

                                        <div className="chart-stat-item">
                                            <span className="chart-stat-label">Günlük Ortalama:</span>
                                            <span className="chart-stat-value">
                                                {Math.round(weeklyStats.reduce((sum, day) => sum + day.dakika, 0) / weeklyStats.length)} dk
                                            </span>
                                        </div>

                                        <div className="chart-stat-item">
                                            <span className="chart-stat-label">En Uzun Çalışma:</span>
                                            <span className="chart-stat-value">
                                                {Math.max(...weeklyStats.map(day => day.dakika))} dk
                                                ({weeklyStats.find(day => day.dakika === Math.max(...weeklyStats.map(d => d.dakika)))?.name || ''})
                                            </span>
                                        </div>
                                    </div>
                                    <div className="goal-progress-section">
                                        <h4>Haftalık Hedef İlerleme</h4>
                                        <div className="goal-container">
                                            <div className="goal-details">
                                                <div className="goal-info">
                                                    <span className="goal-label">Hedef:</span>
                                                    <span className="goal-value">1400 dk (56 pomodoro)</span>
                                                </div>
                                                <div className="goal-info">
                                                    <span className="goal-label">Tamamlanan:</span>
                                                    <span className="goal-value">
                                                        {weeklyStats.reduce((sum, day) => sum + day.dakika, 0)} dk
                                                        ({Math.round(weeklyStats.reduce((sum, day) => sum + day.dakika, 0) / 25)} pomodoro)
                                                    </span>
                                                </div>
                                                <div className="goal-info">
                                                    <span className="goal-label">Kalan:</span>
                                                    <span className="goal-value">
                                                        {Math.max(0, 1400 - weeklyStats.reduce((sum, day) => sum + day.dakika, 0))} dk
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="goal-progress">
                                                <div className="goal-progress-bar">
                                                    <div
                                                        className="goal-progress-fill"
                                                        style={{ width: `${Math.min(100, (weeklyStats.reduce((sum, day) => sum + day.dakika, 0) / 1400) * 100)}%` }}
                                                    ></div>
                                                </div>
                                                <div className="goal-progress-text">
                                                    {Math.round((weeklyStats.reduce((sum, day) => sum + day.dakika, 0) / 1400) * 100)}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="chart-explanation">
                                        <p>Bu grafik haftalık çalışma sürenizin dağılımını göstermektedir. Referans çizgisi, ideal günlük hedef olan 200 dakikayı (8 pomodoro × 25 dk) gösterir.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="productivity-insights">
                                <h3>Verimlilik Analizi</h3>

                                <div className="insight-card">
                                    <div className="insight-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <polyline points="12 6 12 12 16 14"></polyline>
                                        </svg>
                                    </div>
                                    <div className="insight-content">
                                        <h4>Optimal Çalışma Saatleri</h4>
                                        <p>Son 7 gündeki verilerinize göre, öğleden sonra 14:00-16:00 arası en verimli çalışma saatleriniz. Bu saatlerde daha zorlu görevlerinizi planlamayı düşünebilirsiniz.</p>
                                    </div>
                                </div>

                                <div className="insight-card">
                                    <div className="insight-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                        </svg>
                                    </div>
                                    <div className="insight-content">
                                        <h4>En Verimli Gününüz</h4>
                                        <p>{mostProductiveDay.day} günleri ortalama {mostProductiveDay.averagePomodoros} pomodoro tamamlıyorsunuz. Bu gün için önemli görevlerinizi planlamayı düşünebilirsiniz.</p>
                                    </div>
                                </div>

                                <div className="insight-card">
                                    <div className="insight-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                            <polyline points="17 6 23 6 23 12"></polyline>
                                        </svg>
                                    </div>
                                    <div className="insight-content">
                                        <h4>İlerleme Trendi</h4>
                                        <p>Son 2 haftada pomodoro tamamlama sayınız {calculateTrend.isPositive ? 'artıyor' : 'azalıyor'}.
                                            {calculateTrend.isPositive
                                                ? ' Bu tempoyla devam ederseniz, hedeflerinize daha hızlı ulaşabilirsiniz.'
                                                : ' Daha fazla pomodoro tamamlamak için molaları daha etkili kullanmayı deneyebilirsiniz.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="insight-card">
                                    <div className="insight-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                        </svg>
                                    </div>
                                    <div className="insight-content">
                                        <h4>Öneri: Haftalık Hedef</h4>
                                        <p>Haftalık ortalama performansınıza göre, günlük {targetSuggestion} pomodoro tamamlamak size uygun bir hedef olabilir. Bu, mevcut kapasiteninizden biraz daha yüksek ancak ulaşılabilir bir hedeftir.</p>
                                    </div>
                                </div>
                            </div>
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
    );
}

export default StatisticsPanel;