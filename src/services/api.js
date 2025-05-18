import axios from 'axios';

// API'nın URL'sini Docker ortamı için ayarlayın
// const API_URL = '/api';

const API_URL = 'http://localhost:7023/api';

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

    // src/services/api.js içine ekleyin
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

export default apiService;