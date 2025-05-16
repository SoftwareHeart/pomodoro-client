import React, { useState, useEffect, useMemo } from 'react';
import apiService from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function StatisticsPanel() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState('week'); // week, month, all

    // İstatistikleri getir
    useEffect(() => {
        const fetchStatistics = async () => {
            try {
                setLoading(true);
                const data = await apiService.getStatistics();
                setStats(data);
                setError(null);
            } catch (error) {
                console.error("İstatistikler yüklenirken hata oluştu:", error);
                setError("İstatistikler yüklenirken bir hata oluştu.");
            } finally {
                setLoading(false);
            }
        };

        fetchStatistics();

        // Her 5 dakikada bir güncelle
        const interval = setInterval(fetchStatistics, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    // Pasta grafik için sahte veriler (gerçek API'den gelecek şekilde değiştirilebilir)
    const pieData = useMemo(() => {
        if (!stats) return [];
        return [
            { name: 'Bugün', value: stats.completedToday },
            { name: 'Diğer Günler', value: stats.totalCompletedSessions - stats.completedToday }
        ];
    }, [stats]);

    // Çizgi grafik için sahte veriler (gerçek API'den gelecek şekilde değiştirilebilir)
    const lineData = useMemo(() => {
        // Pratik için örnek veri
        return [
            { name: 'Pzt', tamamlanan: 4, dakika: 100 },
            { name: 'Sal', tamamlanan: 3, dakika: 75 },
            { name: 'Çar', tamamlanan: 5, dakika: 125 },
            { name: 'Per', tamamlanan: 2, dakika: 50 },
            { name: 'Cum', tamamlanan: 6, dakika: 150 },
            { name: 'Cmt', tamamlanan: 3, dakika: 75 },
            { name: 'Paz', tamamlanan: 4, dakika: 100 },
        ];
    }, []);

    // Grafik renkleri
    const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];

    if (loading) return <div className="statistics-loading">İstatistikler yükleniyor...</div>;
    if (error) return <div className="statistics-error">{error}</div>;
    if (!stats) return null;

    return (
        <div className="statistics-panel">
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

            <div className="statistics-cards">
                <div className="stat-card highlight">
                    <div className="stat-value">{stats.totalMinutesWorked}</div>
                    <div className="stat-label">Toplam Çalışma</div>
                    <div className="stat-unit">dakika</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.totalCompletedSessions}</div>
                    <div className="stat-label">Tamamlanan Pomodoro</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{Math.round(stats.averageSessionDuration)}</div>
                    <div className="stat-label">Ortalama Süre</div>
                    <div className="stat-unit">dakika/oturum</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.completedToday}</div>
                    <div className="stat-label">Bugün Tamamlanan</div>
                </div>
            </div>

            <div className="statistics-charts">
                <div className="chart-container">
                    <h3>Haftalık Aktivite</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={lineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip
                                formatter={(value, name) => [
                                    value,
                                    name === 'tamamlanan' ? 'Tamamlanan' : 'Dakika'
                                ]}
                            />
                            <Line
                                type="monotone"
                                dataKey="tamamlanan"
                                stroke="#e74c3c"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="dakika"
                                stroke="#3498db"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-container pie-chart">
                    <h3>Bugünkü İlerleme</h3>
                    <div className="pie-container">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`${value} pomodoro`, 'Tamamlanan']} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="statistics-summary">
                <div className="summary-item">
                    <span className="summary-label">Bugünün Verimliliği:</span>
                    <span className="summary-value">
                        {stats.totalCompletedSessions > 0
                            ? `${Math.round((stats.completedToday / stats.totalCompletedSessions) * 100)}%`
                            : '0%'}
                    </span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Hedef İlerleme:</span>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${Math.min(100, (stats.completedToday / 8) * 100)}%` }}
                        ></div>
                    </div>
                    <span className="progress-text">{stats.completedToday}/8 pomodoro</span>
                </div>
            </div>
        </div>
    );
}

export default StatisticsPanel;