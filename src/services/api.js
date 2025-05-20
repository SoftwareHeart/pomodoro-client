// src/services/api.js
import axios from 'axios';

// Docker geliştirme ortamında HTTP kullanıyoruz
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:7023/api';

// Default API servisini oluştur - yetkilendirme gerektirmeyen çağrılar için
const apiService = {
    // Tüm Pomodoro oturumlarını getir
    getSessions: async () => {
        try {
            console.log('Fetching sessions from:', `${API_URL}/Pomodoro`);
            const response = await axios.get(`${API_URL}/Pomodoro`);
            console.log('Sessions response:', response.data);
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
            console.log('Fetching stats from:', `${API_URL}/Pomodoro/statistics?userId=${userId}`);
            const response = await axios.get(`${API_URL}/Pomodoro/statistics?userId=${userId}`);
            console.log('Stats response:', response.data);
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
                console.log('Fetching sessions from:', `${API_URL}/Pomodoro`);
                const response = await axiosInstance.get(`/Pomodoro`);
                console.log('Sessions response:', response.data);
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
                console.log('Fetching stats from:', `${API_URL}/Pomodoro/statistics?userId=${userId}`);
                const response = await axiosInstance.get(`/Pomodoro/statistics?userId=${userId}`);
                console.log('Stats response:', response.data);
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
        }
    };
};

// Varsayılan API servisini export et
export default apiService;