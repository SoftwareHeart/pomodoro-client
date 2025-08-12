// src/contexts/TasksContext.js
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import apiService, { createAuthApiService } from '../services/api';
import { useAuth } from './AuthContext';

const TasksContext = createContext();

export function TasksProvider({ children }) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { getAuthHeader, currentUser } = useAuth();

    // Kimlik doğrulama ile API servisi (memoized değer)
    const authApiService = useMemo(() => {
        return createAuthApiService(getAuthHeader);
    }, [getAuthHeader]);

    // Görevleri getir
    const fetchTasks = useCallback(async () => {
        if (!currentUser) {
            setTasks([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const sessions = await authApiService.getSessions();
            setTasks(sessions);
            setError(null);
        } catch (error) {
            console.error("Görevler yüklenirken hata oluştu:", error);
            setError("Görevler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    }, [currentUser, authApiService]);

    // Görev ekle
    const addTask = useCallback(async (newTask) => {
        try {
            // Eğer kullanıcı giriş yapmışsa, kendi ID'sini kullan
            const taskToAdd = { ...newTask };
            if (currentUser) {
                taskToAdd.userId = currentUser.id;
            }

            const addedTask = await authApiService.createSession(taskToAdd);
            setTasks(prev => [...prev, addedTask]);
            return addedTask;
        } catch (error) {
            console.error("Görev eklenirken hata oluştu:", error);
            setError("Görev eklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
            throw error;
        }
    }, [authApiService, currentUser]);

    // Görev sil
    const deleteTask = useCallback(async (taskId) => {
        try {
            await authApiService.deleteSession(taskId);
            setTasks(prev => prev.filter(task => task.id !== taskId));

            // İstatistikleri güncelle
            // fetchTasks'ı doğrudan çağırmak döngüye neden olabilir
            // Bu nedenle deleteTask başarılı olduktan sonra otomatik yenileme olmasını istiyorsak
            // bir bayrağı güncellemeyi düşünebiliriz
            // Şimdilik bu kısmı kaldırıyoruz:
            // await fetchTasks();
        } catch (error) {
            console.error("Görev silinirken hata oluştu:", error);
            setError("Görev silinirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
            throw error;
        }
    }, [authApiService]);

    // Görev tamamla
    const completeTask = useCallback(async (taskId) => {
        try {
            await authApiService.completeSession(taskId);

            // Tamamlanan görevi doğrudan güncelleyelim
            setTasks(prev => prev.map(task =>
                task.id === taskId
                    ? { ...task, isCompleted: true, endTime: new Date().toISOString() }
                    : task
            ));

            // İstatistikleri güncellemek için fetchTasks yerine,
            // kullanıcı istatistikleri ekranına geçtiğinde yenileme yapılabilir
        } catch (error) {
            console.error("Görev tamamlanırken hata oluştu:", error);
            setError("Görev tamamlanırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
            throw error;
        }
    }, [authApiService]);

    // Timer tamamlandığında istatistiklere işlenecek arka plan oturumu oluştur
    // Not: tasks state'ini kirletmemek için yeni oluşturulan ve tamamlanan oturumu listeye eklemiyoruz
    const recordPomodoroForTask = useCallback(async (taskName, duration) => {
        try {
            const newSession = await authApiService.createSession({ taskName, duration });
            await authApiService.completeSession(newSession.id);
            return true;
        } catch (error) {
            console.error("Arka plan pomodoro kaydı oluşturulurken hata oluştu:", error);
            throw error;
        }
    }, [authApiService]);

    // Context için sağlanacak değerler
    const value = useMemo(() => ({
        tasks,
        loading,
        error,
        fetchTasks,
        addTask,
        deleteTask,
        completeTask,
        recordPomodoroForTask
    }), [tasks, loading, error, fetchTasks, addTask, deleteTask, completeTask, recordPomodoroForTask]);

    return (
        <TasksContext.Provider value={value}>
            {children}
        </TasksContext.Provider>
    );
}

export function useTasks() {
    const context = useContext(TasksContext);
    if (!context) {
        throw new Error('useTasks must be used within a TasksProvider');
    }
    return context;
}