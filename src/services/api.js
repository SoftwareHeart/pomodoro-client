// src/services/api.js
import axios from 'axios';

const API_URL = 'https://localhost:7023/api';

// Default API servisini oluştur - yetkilendirme gerektirmeyen çağrılar için
const apiService = {
    // Tüm Pomodoro oturumlarını getir
    getSessions: async () => {
        try {
            const response = await axios.get(`${API_URL}/Pomodoro`);
            return response.data;
        } catch (error) {
            console.error('Error fetching sessions:', error);
            throw error;
        }
    },

    // Belirli bir Pomodoro oturumunu getir
    getSession: async (id) => {
        try {
            const response = await axios.get(`${API_URL}/Pomodoro/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching session ${id}:`, error);
            throw error;
        }
    },

    // Yeni bir Pomodoro oturumu oluştur
    createSession: async (session) => {
        try {
            const response = await axios.post(`${API_URL}/Pomodoro`, session);
            return response.data;
        } catch (error) {
            console.error('Error creating session:', error);
            throw error;
        }
    },

    // Bir Pomodoro oturumunu tamamla
    completeSession: async (id) => {
        try {
            await axios.put(`${API_URL}/Pomodoro/${id}/complete`);
            return true;
        } catch (error) {
            console.error(`Error completing session ${id}:`, error);
            throw error;
        }
    },

    // Bir Pomodoro oturumunu sil
    deleteSession: async (id) => {
        try {
            await axios.delete(`${API_URL}/Pomodoro/${id}`);
            return true;
        } catch (error) {
            console.error(`Error deleting session ${id}:`, error);
            throw error;
        }
    },

    // İstatistikleri getir
    getStatistics: async (userId = "defaultUser") => {
        try {
            const response = await axios.get(`${API_URL}/Pomodoro/statistics?userId=${userId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching statistics:', error);
            throw error;
        }
    },

    // Haftalık istatistikleri getir
    getWeeklyStats: async (userId = "defaultUser") => {
        try {
            const response = await axios.get(`${API_URL}/Pomodoro/weekly-stats?userId=${userId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching weekly stats:', error);
            throw error;
        }
    }
};

// Kimlik doğrulama ile API servisi oluşturan fonksiyon
export const createAuthApiService = (getAuthHeader) => {
    // Axios instance oluştur
    const axiosInstance = axios.create({
        baseURL: API_URL,
    });

    // İstek interceptor'ı ekle
    axiosInstance.interceptors.request.use(
        (config) => {
            // Her istekte Authorization header'ını ekle
            const headers = getAuthHeader();
            if (headers.Authorization) {
                config.headers.Authorization = headers.Authorization;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    return {
        // Tüm Pomodoro oturumlarını getir (yetkilendirilmiş)
        getSessions: async () => {
            try {
                const response = await axiosInstance.get(`/Pomodoro`);
                return response.data;
            } catch (error) {
                console.error('Error fetching sessions:', error);
                throw error;
            }
        },

        // Belirli bir Pomodoro oturumunu getir (yetkilendirilmiş)
        getSession: async (id) => {
            try {
                const response = await axiosInstance.get(`/Pomodoro/${id}`);
                return response.data;
            } catch (error) {
                console.error(`Error fetching session ${id}:`, error);
                throw error;
            }
        },

        // Yeni bir Pomodoro oturumu oluştur (yetkilendirilmiş)
        createSession: async (session) => {
            try {
                const response = await axiosInstance.post(`/Pomodoro`, session);
                return response.data;
            } catch (error) {
                console.error('Error creating session:', error);
                throw error;
            }
        },

        // Bir Pomodoro oturumunu tamamla (yetkilendirilmiş)
        completeSession: async (id) => {
            try {
                await axiosInstance.put(`/Pomodoro/${id}/complete`);
                return true;
            } catch (error) {
                console.error(`Error completing session ${id}:`, error);
                throw error;
            }
        },

        // Bir Pomodoro oturumunu sil (yetkilendirilmiş)
        deleteSession: async (id) => {
            try {
                await axiosInstance.delete(`/Pomodoro/${id}`);
                return true;
            } catch (error) {
                console.error(`Error deleting session ${id}:`, error);
                throw error;
            }
        },

        // İstatistikleri getir (yetkilendirilmiş)
        getStatistics: async (userId = "defaultUser") => {
            try {
                const response = await axiosInstance.get(`/Pomodoro/statistics?userId=${userId}`);
                return response.data;
            } catch (error) {
                console.error('Error fetching statistics:', error);
                throw error;
            }
        },

        // Haftalık istatistikleri getir (yetkilendirilmiş)
        getWeeklyStats: async (userId = "defaultUser") => {
            try {
                const response = await axiosInstance.get(`/Pomodoro/weekly-stats?userId=${userId}`);
                return response.data;
            } catch (error) {
                console.error('Error fetching weekly stats:', error);
                throw error;
            }
        },

        // Kullanıcı profili bilgilerini getir
        getUserProfile: async () => {
            try {
                const response = await axiosInstance.get(`/User/profile`);
                return response.data;
            } catch (error) {
                console.error('Error fetching user profile:', error);
                throw error;
            }
        },

        // Takvim verileri getir
        getCalendarData: async (startDate = null, endDate = null) => {
            try {
                let url = `/Pomodoro/calendar-data`;
                const params = new URLSearchParams();

                if (startDate) {
                    params.append('startDate', startDate);
                }
                if (endDate) {
                    params.append('endDate', endDate);
                }

                if (params.toString()) {
                    url += `?${params.toString()}`;
                }

                const response = await axiosInstance.get(url);
                return response.data;
            } catch (error) {
                console.error('Error fetching calendar data:', error);
                throw error;
            }
        },

        // Aylık istatistikleri getir
        getMonthlyStats: async (year, month) => {
            try {
                const response = await axiosInstance.get(`/Pomodoro/monthly-stats?year=${year}&month=${month}`);
                return response.data;
            } catch (error) {
                console.error('Error fetching monthly stats:', error);
                throw error;
            }
        },

        // Günlük detayları getir
        getDailyDetail: async (date) => {
            try {
                const dateString = date instanceof Date ? date.toISOString().split('T')[0] : date;
                const response = await axiosInstance.get(`/Pomodoro/daily-detail?date=${dateString}`);
                return response.data;
            } catch (error) {
                console.error('Error fetching daily detail:', error);
                throw error;
            }
        }
    };
};

// Varsayılan API servisini export et
export default apiService;