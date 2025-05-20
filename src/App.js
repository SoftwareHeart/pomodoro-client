import React, { useState, useEffect } from 'react';
import 'react-perfect-scrollbar/dist/css/styles.css';
import Timer from './components/Timer';
import PomodoroControls from './components/PomodoroControls';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import StatisticsPanel from './components/StatisticsPanel';
import ThemeSelector from './components/ThemeSelector';
import NotificationSettings from './components/NotificationSettings';
import NotificationsContainer from './components/NotificationsContainer';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { TasksProvider } from './contexts/TasksContext';
import { useNotification } from './contexts/NotificationContext';
import { useTasks } from './contexts/TasksContext';
import apiService from './services/api';

// Ana uygulama bileşeni - Provider'ları burada oluşturuyoruz
function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <TasksProvider>
          <AppContent />
        </TasksProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

// İç bileşen - Provider'lar içinde olduğu için hooks kullanabilir
function AppContent() {
  // State değişkenleri
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [resetFlag, setResetFlag] = useState(0);
  const { showVisualNotification } = useNotification();
  const { tasks, loading, error: tasksError, fetchTasks, addTask, deleteTask, completeTask } = useTasks();

  // Sayfa yüklendiğinde görevleri getir
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Yeni görev ekleme
  const handleAddTask = async (newTask) => {
    try {
      const addedTask = await addTask(newTask);
      // Eğer henüz aktif görev seçilmediyse, yeni eklenen görevi seç
      if (!activeTaskId) {
        setActiveTaskId(addedTask.id);
      }
    } catch (error) {
      // Hata yönetimi TasksContext'te yapılıyor
    }
  };

  // Görev seçme işlemi için modal gösterme
  const handleSelectTask = (taskId) => {
    const selectedTask = tasks.find(task => task.id === taskId);

    // Eğer seçilen görev tamamlanmışsa uyarı göster
    if (selectedTask.isCompleted) {
      showVisualNotification(
        'Bu görev tamamlanmış. Tekrar başlatmak için tıklayın.',
        'info',
        3000,
        () => {
          setActiveTaskId(taskId);
          setCurrentSession(selectedTask);
          setResetFlag(prev => prev + 1);
        }
      );
      return;
    }

    // Eğer zamanlayıcı çalışıyorsa ve farklı bir görev seçilmeye çalışılıyorsa
    if (isActive && activeTaskId !== taskId) {
      showVisualNotification(
        'Zamanlayıcı çalışıyor. Görev değiştirmek için tıklayın.',
        'warning',
        3000,
        () => {
          setIsActive(false);
          setActiveTaskId(taskId);
          setCurrentSession(selectedTask);
          setResetFlag(prev => prev + 1);
        }
      );
      return;
    }

    // Zamanlayıcı çalışmıyorsa doğrudan görev değiştir
    setActiveTaskId(taskId);
    setCurrentSession(selectedTask);
    setResetFlag(prev => prev + 1);
  };

  // Görev silme
  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      // Eğer silinen görev aktif görevse, aktif görevi sıfırla
      if (activeTaskId === taskId) {
        setActiveTaskId(null);
        setIsActive(false);
        setCurrentSession(null);
      }
    } catch (error) {
      // Hata yönetimi TasksContext'te yapılıyor
    }
  };

  // Timer'ı başlatma
  const handleStart = async () => {
    if (!activeTaskId) {
      showVisualNotification('Lütfen önce bir görev seçin veya ekleyin.', 'warning', 4000);
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
    setResetFlag(prev => prev + 1);
  };

  // Timer tamamlandığında
  const handleComplete = async () => {
    if (!currentSession) return;

    try {
      await completeTask(currentSession.id);
      setIsActive(false);
    } catch (error) {
      // Hata yönetimi TasksContext'te yapılıyor
    }
  };

  // Timer mod değiştiğinde çağrılacak fonksiyon
  const handleModeChange = () => {
    setIsActive(false);
  };

  // Aktif görevin süresini bul
  const activeDuration = activeTaskId
    ? tasks.find(task => task.id === activeTaskId)?.duration || 25
    : 25;

  return (
    <div className="app">
      <div className="app-header-container">
        <header>
          <h1>Pomodoro Zamanlayıcı</h1>
        </header>
        <div className="app-controls">
          <NotificationSettings />
          <ThemeSelector />
        </div>
      </div>

      {tasksError && (
        <div className="error-message">
          <p>{tasksError}</p>
          <button onClick={() => fetchTasks()}>Tekrar Dene</button>
        </div>
      )}

      <main>
        <div className="app-column">
          <div className="top-row">
            <div className="pomodoro-section">
              <Timer
                duration={activeDuration}
                isActive={isActive}
                onComplete={handleComplete}
                resetFlag={resetFlag}
                onModeChange={handleModeChange}
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
              <div className="tasks-list-wrapper">
                <TaskList
                  tasks={tasks}
                  activeTaskId={activeTaskId}
                  onSelectTask={handleSelectTask}
                  onDeleteTask={handleDeleteTask}
                  loading={loading}
                />
              </div>
            </div>
          </div>
          <div className="bottom-row">
            <StatisticsPanel />
          </div>
        </div>
      </main>

      <NotificationsContainer />
    </div>
  );
}

export default App;