// src/components/StatisticsPanel.js
import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { createAuthApiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoginPrompt from './LoginPrompt';

function StatisticsPanel() {
    const [activeTab, setActiveTab] = useState('daily');
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
                                <p>Her günkü pomodoro sayınızı ve odaklanma sürenizi görün</p>
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
                            <li><strong>Görev Ekleyin:</strong> Sağ taraftaki "Yeni Görev Ekle" butonuna tıklayın</li>
                            <li><strong>Süre Belirleyin:</strong> 25 dakika (varsayılan) veya özel bir süre seçin</li>
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
        day: new Date(stat.date).toLocaleDateString('tr-TR', { weekday: 'short' }),
        pomodoros: stat.pomodoros,
        minutes: Math.round(stat.minutes / 60 * 10) / 10
    }));

    const pieData = [
        { name: 'Tamamlanan', value: statistics.completedTasks, color: '#2ecc71' },
        { name: 'Devam Eden', value: Math.max(0, statistics.totalTasks - statistics.completedTasks), color: '#e74c3c' }
    ];

    return (
        <div className="statistics-panel modern">
            <div className="statistics-header">
                <h2>📊 İstatistikler</h2>
                <div className="statistics-tabs">
                    <button
                        className={activeTab === 'daily' ? 'active' : ''}
                        onClick={() => setActiveTab('daily')}
                    >
                        Günlük
                    </button>
                    <button
                        className={activeTab === 'weekly' ? 'active' : ''}
                        onClick={() => setActiveTab('weekly')}
                    >
                        Haftalık
                    </button>
                    <button
                        className={activeTab === 'trends' ? 'active' : ''}
                        onClick={() => setActiveTab('trends')}
                    >
                        Trendler
                    </button>
                </div>
            </div>

            {activeTab === 'daily' && (
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
                                    <div className="stat-value">{statistics.totalPomodoros}</div>
                                    <div className="stat-label">Toplam Pomodoro</div>
                                </div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-card-content">
                                <div className="stat-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                </div>
                                <div>
                                    <div className="stat-value">{Math.round(statistics.totalMinutes / 60)}s</div>
                                    <div className="stat-label">Toplam Süre</div>
                                </div>
                            </div>
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
                                    <div className="stat-value">{statistics.completedTasks}</div>
                                    <div className="stat-label">Tamamlanan Görev</div>
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
                                    <div className="stat-value">{statistics.averagePerDay || 0}</div>
                                    <div className="stat-label">Günlük Ortalama</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {pieData[0].value > 0 && (
                        <div className="chart-container">
                            <div className="chart-header">
                                <div className="chart-title">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                                        <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                                    </svg>
                                    <h3>Görev Dağılımı</h3>
                                </div>
                            </div>
                            <div className="chart-wrapper">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'weekly' && (
                <div className="chart-container">
                    <div className="chart-header">
                        <div className="chart-title">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                <polyline points="17 6 23 6 23 12"></polyline>
                            </svg>
                            <h3>Haftalık Performans</h3>
                        </div>
                    </div>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="pomodoros" fill="#e74c3c" name="Pomodoro" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {activeTab === 'trends' && (
                <div className="chart-container">
                    <div className="chart-header">
                        <div className="chart-title">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                <polyline points="17 6 23 6 23 12"></polyline>
                            </svg>
                            <h3>Haftalık Trend</h3>
                        </div>
                    </div>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="pomodoros"
                                    stroke="#e74c3c"
                                    strokeWidth={3}
                                    dot={{ fill: '#e74c3c', strokeWidth: 2, r: 6 }}
                                    name="Pomodoro"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StatisticsPanel;