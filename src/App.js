import React, { useState, useEffect } from 'react';
import './App.css';
import Timer from './components/Timer';
import PomodoroControls from './components/PomodoroControls';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import apiService from './services/api';

function App() {
  const [tasks, setTasks] = useState([]);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resetFlag, setResetFlag] = useState(0);
  // Sayfa yüklendiğinde görevleri getir
  useEffect(() => {
    const fetchTasks = async () => {
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
    };

    fetchTasks();
  }, []);

  // Yeni görev ekleme
  const handleAddTask = async (newTask) => {
    try {
      const addedTask = await apiService.createSession(newTask);
      setTasks(prev => [...prev, addedTask]);

      // Eğer henüz aktif görev seçilmediyse, yeni eklenen görevi seç
      if (!activeTaskId) {
        setActiveTaskId(addedTask.id);
      }
    } catch (error) {
      console.error("Görev eklenirken hata oluştu:", error);
      setError("Görev eklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
    }
  };

  // Görev seçme
  const handleSelectTask = (taskId) => {
    if (isActive) {
      // Timer çalışıyorsa kullanıcıya bir uyarı göster
      if (!window.confirm("Zamanlayıcı çalışıyor. Görev değiştirmek istediğinize emin misiniz?")) {
        return;
      }
      setIsActive(false);
    }

    setActiveTaskId(taskId);

    // Seçilen görevi bul ve currentSession'a ata
    const selectedTask = tasks.find(task => task.id === taskId);
    setCurrentSession(selectedTask);

    // Reset timer when task changes
    setResetFlag(prev => prev + 1);
  };
  // Görev silme
  const handleDeleteTask = async (taskId) => {
    try {
      await apiService.deleteSession(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));

      // Eğer silinen görev aktif görevse, aktif görevi sıfırla
      if (activeTaskId === taskId) {
        setActiveTaskId(null);
        setIsActive(false);
        setCurrentSession(null);
      }
    } catch (error) {
      console.error("Görev silinirken hata oluştu:", error);
      setError("Görev silinirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
    }
  };

  // Timer'ı başlatma
  const handleStart = async () => {
    if (!activeTaskId) {
      alert("Lütfen önce bir görev seçin veya ekleyin.");
      return;
    }

    setIsActive(true);

    const selectedTask = tasks.find(task => task.id === activeTaskId);
    setCurrentSession(selectedTask);
  };

  // Timer'ı duraklatma
  const handlePause = () => {
    setIsActive(false);
  };

  // Timer'ı sıfırlama
  const handleReset = () => {
    setIsActive(false);
    // resetFlag'i değiştirerek Timer bileşeninin yeniden render edilmesini sağlayın
    setResetFlag(prev => prev + 1);
  };

  // Timer tamamlandığında
  const handleComplete = async () => {
    if (!currentSession) return;

    try {
      await apiService.completeSession(currentSession.id);

      // Görevleri güncelle
      const updatedSessions = await apiService.getSessions();
      setTasks(updatedSessions);

      setIsActive(false);

      // Kullanıcıya bildirim
      alert("Pomodoro tamamlandı! Kısa bir mola verin.");
    } catch (error) {
      console.error("Oturum tamamlanırken hata oluştu:", error);
      setError("Oturum tamamlanırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
    }
  };

  // Aktif görevin süresini bul
  const activeDuration = activeTaskId
    ? tasks.find(task => task.id === activeTaskId)?.duration || 25
    : 25;

  return (
    <div className="app">
      <header>
        <h1>Pomodoro Zamanlayıcı</h1>
      </header>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Kapat</button>
        </div>
      )}

      <main>
        <div className="pomodoro-section">
          <Timer
            duration={activeDuration}
            isActive={isActive}
            onComplete={handleComplete}
            resetFlag={resetFlag}
          />

          <PomodoroControls
            isActive={isActive}
            onStart={handleStart}
            onPause={handlePause}
            onReset={handleReset}
          />

          {activeTaskId && (
            <div className="active-task">
              <h3>Aktif Görev:</h3>
              <p>{tasks.find(task => task.id === activeTaskId)?.taskName}</p>
            </div>
          )}
        </div>

        <div className="tasks-section">
          <TaskForm onAddTask={handleAddTask} />

          {loading ? (
            <p>Görevler yükleniyor...</p>
          ) : (
            <TaskList
              tasks={tasks}
              activeTaskId={activeTaskId}
              onSelectTask={handleSelectTask}
              onDeleteTask={handleDeleteTask}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;