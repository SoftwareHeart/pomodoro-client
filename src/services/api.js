import axios from 'axios';

// API'nızın URL'sini buraya yazın
// Buradaki port numarasını kendi API'nizin çalıştığı port ile değiştirin 
const API_URL = 'https://localhost:7023/api';

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
    }


};

export default apiService;