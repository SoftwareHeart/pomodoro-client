import React, { createContext, useContext, useState, useCallback } from 'react';
import apiService from '../services/api';

const TasksContext = createContext();

export function TasksProvider({ children }) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true);
            const sessions = await apiService.getSessions();
            setTasks(sessions);
            setError(null);
        } catch (error) {
            console.error("Görevler yüklenirken hata oluştu:", error);
            setError("Görevler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    }, []);

    const addTask = useCallback(async (newTask) => {
        try {
            const addedTask = await apiService.createSession(newTask);
            setTasks(prev => [...prev, addedTask]);
            return addedTask;
        } catch (error) {
            console.error("Görev eklenirken hata oluştu:", error);
            setError("Görev eklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
            throw error;
        }
    }, []);

    const deleteTask = useCallback(async (taskId) => {
        try {
            await apiService.deleteSession(taskId);
            setTasks(prev => prev.filter(task => task.id !== taskId));
            await fetchTasks(); // İstatistikleri güncelle
        } catch (error) {
            console.error("Görev silinirken hata oluştu:", error);
            setError("Görev silinirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
            throw error;
        }
    }, [fetchTasks]);

    const completeTask = useCallback(async (taskId) => {
        try {
            await apiService.completeSession(taskId);
            await fetchTasks(); // İstatistikleri güncelle
        } catch (error) {
            console.error("Görev tamamlanırken hata oluştu:", error);
            setError("Görev tamamlanırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
            throw error;
        }
    }, [fetchTasks]);

    const value = {
        tasks,
        loading,
        error,
        fetchTasks,
        addTask,
        deleteTask,
        completeTask
    };

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