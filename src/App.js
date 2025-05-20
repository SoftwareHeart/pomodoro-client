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
import apiService from './services/api';
import { useNotification } from './contexts/NotificationContext';
// Ana uygulama bileşeni - Provider'ları burada oluşturuyoruz
function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </ThemeProvider>
  );
}

// İç bileşen - NotificationProvider içinde olduğu için useNotification kullanabilir
function AppContent() {
  // State değişkenleri
  const [tasks, setTasks] = useState([]);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resetFlag, setResetFlag] = useState(0);
  const { showVisualNotification } = useNotification();

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

  // Görev değiştirme ortak fonksiyonu
  const changeTask = (taskId) => {
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
      // Görev seçilmediğinde bildirim göster
      showVisualNotification('Lütfen önce bir görev seçin veya ekleyin.', 'warning', 4000);
      return;
    }

    setIsActive(true);

    const selectedTask = tasks.find(task => task.id === activeTaskId);
    setCurrentSession(selectedTask);

    // Başlangıç bildirimi BURADA KALDIRDIK - Timer.js'de zaten ses çalıyor
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
      await apiService.completeSession(currentSession.id);

      // Görevleri güncelle
      const updatedSessions = await apiService.getSessions();
      setTasks(updatedSessions);

      setIsActive(false);

      // Tamamlanma bildirimi BURADA KALDIRDIK - Timer.js'de zaten bildirimi gösteriyor
    } catch (error) {
      console.error("Oturum tamamlanırken hata oluştu:", error);
      showVisualNotification('Oturum tamamlanırken bir hata oluştu.', 'error', 5000);
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

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Kapat</button>
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

      {/* Bildirim konteynerini ekleyin */}
      <NotificationsContainer />
    </div>
  );
}
export default App;