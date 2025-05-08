import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

function StatisticsPanel() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    if (loading) return <div className="statistics-loading">İstatistikler yükleniyor...</div>;
    if (error) return <div className="statistics-error">{error}</div>;
    if (!stats) return null;

    return (
        <div className="statistics-panel">
            <h2>İstatistikler</h2>
            <div className="statistics-grid">
                <div className="stat-item">
                    <div className="stat-value">{stats.totalCompletedSessions}</div>
                    <div className="stat-label">Tamamlanan Pomodoro</div>
                </div>
                <div className="stat-item">
                    <div className="stat-value">{stats.totalMinutesWorked}</div>
                    <div className="stat-label">Toplam Çalışma (dk)</div>
                </div>
                <div className="stat-item">
                    <div className="stat-value">{stats.completedToday}</div>
                    <div className="stat-label">Bugün Tamamlanan</div>
                </div>
                <div className="stat-item">
                    <div className="stat-value">{stats.minutesToday}</div>
                    <div className="stat-label">Bugün Çalışılan (dk)</div>
                </div>
                <div className="stat-item">
                    <div className="stat-value">{Math.round(stats.averageSessionDuration)}</div>
                    <div className="stat-label">Ortalama Süre (dk)</div>
                </div>
            </div>
        </div>
    );
}

export default StatisticsPanel;