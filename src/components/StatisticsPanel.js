// src/components/StatisticsPanel.js
import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { createAuthApiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoginPrompt from './LoginPrompt';

function StatisticsPanel() {
    const [activeTab, setActiveTab] = useState('overview');
    const [statistics, setStatistics] = useState(null);
    const [weeklyStats, setWeeklyStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { getAuthHeader, isAuthenticated } = useAuth();

    const authApiService = useMemo(() => {
        return createAuthApiService(getAuthHeader);
    }, [getAuthHeader]);

    useEffect(() => {
        if (isAuthenticated()) {
            fetchStatistics();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const fetchStatistics = async () => {
        try {
            setLoading(true);
            const [statsResponse, weeklyResponse] = await Promise.all([
                authApiService.getStatistics(),
                authApiService.getWeeklyStats()
            ]);

            setStatistics(statsResponse);
            setWeeklyStats(weeklyResponse || []);
            setError(null);
        } catch (error) {
            console.error('İstatistikler yüklenirken hata:', error);
            setError('İstatistikler yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };



    // If user is not authenticated, show login prompt (fill variant to occupy container)
    if (!isAuthenticated()) {
        return (
            <div className="statistics-panel modern">
                <LoginPrompt
                    message="İstatistiklerinizi Görüntüleyin"
                    actionText="Pomodoro istatistiklerinizi takip etmek ve ilerlemenizi görmek için giriş yapın veya kayıt olun."
                    variant="fill"
                />

                {/* Örnek istatistik önizlemesi */}
                <div className="statistics-preview">
                    <div className="preview-header">
                        <h3>🎯 Neler Kazanacaksınız?</h3>
                    </div>
                    <div className="preview-features">
                        <div className="preview-feature">
                            <div className="preview-icon">📈</div>
                            <div className="preview-content">
                                <h4>Günlük Performans</h4>
                                <p>Her günkü pomodoro sayınızı ve toplam odaklanma sürenizi görün</p>
                            </div>
                        </div>
                        <div className="preview-feature">
                            <div className="preview-icon">📅</div>
                            <div className="preview-content">
                                <h4>Haftalık Trendler</h4>
                                <p>7 günlük performans grafiklerinizi analiz edin</p>
                            </div>
                        </div>
                        <div className="preview-feature">
                            <div className="preview-icon">🏆</div>
                            <div className="preview-content">
                                <h4>Hedef Takibi</h4>
                                <p>Günlük hedeflerinize ne kadar yaklaştığınızı görün</p>
                            </div>
                        </div>
                        <div className="preview-feature">
                            <div className="preview-icon">🎨</div>
                            <div className="preview-content">
                                <h4>Görsel Raporlar</h4>
                                <p>Renkli grafikler ve anlaşılır istatistikler</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="statistics-panel loading">
                <div className="loader"></div>
                <p>İstatistikler yükleniyor...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="statistics-panel error">
                <div className="error-icon">!</div>
                <p>{error}</p>
                <button onClick={fetchStatistics}>Tekrar Dene</button>
            </div>
        );
    }

    // İstatistikler henüz yüklenmemişse loading göster
    if (!statistics) {
        return (
            <div className="statistics-panel loading">
                <div className="loader"></div>
                <p>İstatistikler yükleniyor...</p>
            </div>
        );
    }

    // Yeni kullanıcı kontrolü
    const isNewUser = !statistics || (
        statistics.totalPomodoros === 0 &&
        statistics.totalMinutes === 0 &&
        statistics.completedTasks === 0
    );

    if (isNewUser) {
        return (
            <div className="statistics-panel new-user">
                <div className="welcome-container">
                    <div className="welcome-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    </div>
                    <h2>🎉 Hoş Geldiniz!</h2>
                    <p>
                        Pomodoro yolculuğunuza başlamaya hazırsınız! İlk pomodoro seansınızı tamamladıktan sonra
                        burada detaylı istatistiklerinizi görebileceksiniz.
                    </p>

                    <div className="getting-started">
                        <h3>🚀 Nasıl Başlarım?</h3>
                        <ol>
                            <li><strong>Pomodoro Süresini Ayarlayın:</strong> Timer alanında 25 dakika (varsayılan) veya özel bir süre seçin</li>
                            <li><strong>Görev Ekleyin (İsteğe Bağlı):</strong> Sağ taraftaki "Yeni Görev Ekle" butonuna tıklayarak odaklanacağınız görevi belirleyin</li>
                            <li><strong>Başlatın:</strong> Timer'ı başlatın ve odaklanın</li>
                            <li><strong>Mola Verin:</strong> Süre dolduğunda kısa bir mola alın</li>
                            <li><strong>Tekrarlayın:</strong> Bu döngüyü devam ettirin</li>
                        </ol>
                    </div>

                    <div className="welcome-tips">
                        <h3>💡 İpuçları</h3>
                        <ul>
                            <li>Her 4 pomodoro sonrası 15-30 dakika uzun mola alın</li>
                            <li>Mola sırasında telefon ve bilgisayardan uzak durun</li>
                            <li>Günlük hedeflerinizi belirleyin ve takip edin</li>
                            <li>İstatistiklerinizi düzenli olarak gözden geçirin</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    // Mevcut istatistik gösterimi devam ediyor...
    const chartData = weeklyStats.map(stat => ({
        day: stat.day || new Date(stat.date).toLocaleDateString('tr-TR', { weekday: 'short' }),
        pomodoros: stat.pomodoros || 0,
        minutes: Math.round((stat.minutes || 0) / 60 * 10) / 10,
        hours: stat.hours || 0
    }));

    const pieData = [
        { name: 'Başarılı Seanslar', value: statistics.completedTasks, color: '#2ecc71' },
        { name: 'Yarıda Kalan', value: Math.max(0, statistics.totalTasks - statistics.completedTasks), color: '#e74c3c' }
    ];

    return (
        <div className="statistics-panel-redesigned">
            <div className="stats-hero-section">
                <div className="stats-hero-content">
                    <h1 className="stats-title">📈 Pomodoro İstatistikleriniz</h1>
                    <p className="stats-subtitle">Odaklanma yolculuğunuzdaki ilerlemenizi takip edin</p>
                </div>
                <div className="stats-refresh">
                    <button onClick={fetchStatistics} className="refresh-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 4 23 10 17 10"></polyline>
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                        </svg>
                        Yenile
                    </button>
                </div>
            </div>

            <div className="stats-navigation">
                <button
                    className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <path d="M9 9h6v6h-6z"></path>
                    </svg>
                    Genel Bakış
                </button>
                <button
                    className={`nav-btn ${activeTab === 'performance' ? 'active' : ''}`}
                    onClick={() => setActiveTab('performance')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                        <polyline points="17 6 23 6 23 12"></polyline>
                    </svg>
                    Performans
                </button>
                <button
                    className={`nav-btn ${activeTab === 'insights' ? 'active' : ''}`}
                    onClick={() => setActiveTab('insights')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2 2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V12a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                    Analiz
                </button>
            </div>

            {activeTab === 'overview' && (
                <div className="stats-overview">
                    <div className="overview-grid">
                        <div className="metric-card primary">
                            <div className="metric-header">
                                <h3>🎯 Toplam Pomodoro</h3>
                                <span className="metric-badge">Tüm Zamanlar</span>
                            </div>
                            <div className="metric-value-section">
                                <div className="metric-main-value">{statistics.totalPomodoros}</div>
                                <p className="metric-description">Başarıyla tamamladığınız odaklanma seansları</p>
                            </div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-header">
                                <h3>⏱️ Toplam Çalışma Süresi</h3>
                                <span className="metric-badge secondary">Dakika</span>
                            </div>
                            <div className="metric-value-section">
                                <div className="metric-main-value">{Math.round(statistics.totalMinutes / 60)}<span className="metric-unit">s</span></div>
                                <p className="metric-description">Kesintisiz odaklanma süreniz</p>
                            </div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-header">
                                <h3>📈 Günlük Ortalama</h3>
                                <span className="metric-badge success">Per Gün</span>
                            </div>
                            <div className="metric-value-section">
                                <div className="metric-main-value">{statistics.averagePerDay || 0}<span className="metric-unit">🍅</span></div>
                                <p className="metric-description">Her gün ortalama pomodoro sayınız</p>
                            </div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-header">
                                <h3>🔥 Başarı Oranı</h3>
                                <span className="metric-badge warning">Yüzde</span>
                            </div>
                            <div className="metric-value-section">
                                <div className="metric-main-value">
                                    {statistics.totalTasks > 0 ? Math.round((statistics.completedTasks / statistics.totalTasks) * 100) : 0}<span className="metric-unit">%</span>
                                </div>
                                <p className="metric-description">Tamamlanan seansların oranı</p>
                            </div>
                        </div>
                    </div>

                    <div className="insights-section">
                        <h3>💡 Kişisel İçgörüler</h3>
                        <div className="insights-grid">
                            <div className="insight-card">
                                <div className="insight-icon">🏆</div>
                                <div className="insight-content">
                                    <h4>En İyi Performans</h4>
                                    <p>Şimdiye kadar {statistics.totalPomodoros} pomodoro tamamladınız. Harika bir ilerleme!</p>
                                </div>
                            </div>
                            <div className="insight-card">
                                <div className="insight-icon">🎯</div>
                                <div className="insight-content">
                                    <h4>Odaklanma Hedefi</h4>
                                    <p>Günde {Math.max(1, Math.round((statistics.averagePerDay || 0) + 1))} pomodoro hedeflemeyi deneyin.</p>
                                </div>
                            </div>
                            <div className="insight-card">
                                <div className="insight-icon">⏰</div>
                                <div className="insight-content">
                                    <h4>Süre Analizi</h4>
                                    <p>Ortalama {Math.round(statistics.totalMinutes / Math.max(1, statistics.totalPomodoros))} dakika çalışıyorsunuz.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'performance' && (
                <div className="stats-performance">
                    <div className="performance-charts">
                        <div className="chart-card">
                            <div className="chart-header">
                                <h3>📊 Haftalık Performans</h3>
                                <p>Son 7 günlük pomodoro sayınız</p>
                            </div>
                            <div className="chart-wrapper">
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--color-foreground-rgb), 0.1)" />
                                        <XAxis
                                            dataKey="day"
                                            stroke="var(--color-foreground)"
                                            fontSize={12}
                                        />
                                        <YAxis
                                            stroke="var(--color-foreground)"
                                            fontSize={12}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--color-panel)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: 'var(--border-radius-md)',
                                                color: 'var(--color-foreground)'
                                            }}
                                        />
                                        <Bar
                                            dataKey="pomodoros"
                                            fill="var(--color-primary)"
                                            name="Pomodoro Sayısı"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="chart-card">
                            <div className="chart-header">
                                <h3>📈 Trend Analizi</h3>
                                <p>Performansınızdaki değişim</p>
                            </div>
                            <div className="chart-wrapper">
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--color-foreground-rgb), 0.1)" />
                                        <XAxis
                                            dataKey="day"
                                            stroke="var(--color-foreground)"
                                            fontSize={12}
                                        />
                                        <YAxis
                                            stroke="var(--color-foreground)"
                                            fontSize={12}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--color-panel)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: 'var(--border-radius-md)',
                                                color: 'var(--color-foreground)'
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="pomodoros"
                                            stroke="var(--color-accent)"
                                            strokeWidth={3}
                                            dot={{ fill: 'var(--color-accent)', strokeWidth: 2, r: 6 }}
                                            name="Pomodoro Trendi"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'insights' && (
                <div className="stats-insights">
                    <div className="insights-header">
                        <h3>🔍 Detaylı Analiz</h3>
                        <p>Çalışma alışkanlıklarınız hakkında derin görüşler</p>
                    </div>

                    <div className="analysis-grid">
                        <div className="analysis-card streak">
                            <div className="analysis-header">
                                <div className="analysis-icon">🔥</div>
                                <h4>Süreklilik Analizi</h4>
                            </div>
                            <div className="analysis-content">
                                <div className="analysis-metric">
                                    <span className="metric-number">{statistics.totalPomodoros > 0 ? Math.ceil(statistics.totalPomodoros / 7) : 0}</span>
                                    <span className="metric-label">Haftalık Ortalama</span>
                                </div>
                                <p>Düzenli çalışma alışkanlığınız gelişiyor!</p>
                            </div>
                        </div>

                        <div className="analysis-card efficiency">
                            <div className="analysis-header">
                                <div className="analysis-icon">⚡</div>
                                <h4>Verimlilik Skoru</h4>
                            </div>
                            <div className="analysis-content">
                                <div className="analysis-metric">
                                    <span className="metric-number">
                                        {statistics.totalTasks > 0 ? Math.round((statistics.completedTasks / statistics.totalTasks) * 100) : 0}
                                    </span>
                                    <span className="metric-label">% Başarı</span>
                                </div>
                                <p>Tamamlama oranınız {statistics.completedTasks > statistics.totalTasks * 0.8 ? 'mükemmel!' : 'gelişiyor!'}</p>
                            </div>
                        </div>

                        <div className="analysis-card focus">
                            <div className="analysis-header">
                                <div className="analysis-icon">🎯</div>
                                <h4>Odaklanma Kalitesi</h4>
                            </div>
                            <div className="analysis-content">
                                <div className="analysis-metric">
                                    <span className="metric-number">
                                        {statistics.totalPomodoros > 0 ? Math.round(statistics.totalMinutes / statistics.totalPomodoros) : 0}
                                    </span>
                                    <span className="metric-label">dk/seans</span>
                                </div>
                                <p>Ortalama seans süreniz ideal seviyede</p>
                            </div>
                        </div>

                        <div className="analysis-card recommendations">
                            <div className="analysis-header">
                                <div className="analysis-icon">💡</div>
                                <h4>Öneriler</h4>
                            </div>
                            <div className="analysis-content">
                                <ul className="recommendations-list">
                                    <li>Günlük {Math.max(4, Math.round((statistics.averagePerDay || 0) + 2))} pomodoro hedefleyin</li>
                                    <li>Molalarınızı ihmal etmeyin</li>
                                    <li>Tutarlılığınızı koruyun</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StatisticsPanel;