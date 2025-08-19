// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import 'react-perfect-scrollbar/dist/css/styles.css';
import Timer from './components/Timer';
import PomodoroControls from './components/PomodoroControls';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import StatisticsPanel from './components/StatisticsPanel';
import ThemeSelector from './components/ThemeSelector';
import NotificationSettings from './components/NotificationSettings';
import NotificationsContainer from './components/NotificationsContainer';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPrompt from './components/LoginPrompt';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TasksProvider, useTasks } from './contexts/TasksContext';
import Header from './components/Header';

// Import the CSS files
import './styles/components/login-prompt.css';
import './styles/components/statistics-redesigned.css';

// Ana uygulama bileşeni - Provider'ları burada oluşturuyoruz
function App() {
  return (
    <Router>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <TasksProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                {/* The main route does not require auth anymore */}
                <Route path="/" element={<AppContent />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
              <NotificationsContainer />
            </TasksProvider>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </Router>
  );
}

// İç bileşen - Provider'lar içinde olduğu için hooks kullanabilir
function AppContent() {
  // State değişkenleri
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [resetFlag, setResetFlag] = useState(0);
  const { showVisualNotification } = useNotification();
  const { currentUser, isAuthenticated } = useAuth();
  const { tasks, loading, error: tasksError, fetchTasks, addTask, deleteTask, completeTask, recordPomodoroForTask } = useTasks();

  // Anonymous timer state - for users who aren't logged in
  const [anonymousTimerDuration, setAnonymousTimerDuration] = useState(25);
  const [anonymousMode, setAnonymousMode] = useState('pomodoro'); // 'pomodoro', 'shortBreak', 'longBreak'

  // Pomodoro duration state - for authenticated users
  const [pomodoroDuration, setPomodoroDuration] = useState(25);
  // İstatistik paneli otomatik yenile anahtarı
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);
  // Aktif görevde canlı süre için başlangıç damgası
  const [activeStartAt, setActiveStartAt] = useState(null);

  // Sayfa yüklendiğinde ve kullanıcı değiştiğinde görevleri getir
  useEffect(() => {
    if (currentUser) {
      fetchTasks();
    }
  }, [fetchTasks, currentUser]);

  // Yeni görev ekleme
  const handleAddTask = async (newTask) => {
    // If not authenticated, show notification
    if (!isAuthenticated()) {
      showVisualNotification(
        'Görev eklemek için giriş yapmalısınız',
        'warning',
        4000
      );
      return;
    }

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
    // If not authenticated, don't try to select a task
    if (!isAuthenticated()) {
      return;
    }

    const selectedTask = tasks.find(task => task.id === taskId);

    // Eğer zamanlayıcı çalışıyorsa ve farklı bir görev seçilmeye çalışılıyorsa
    if (isActive && activeTaskId !== taskId) {
      showVisualNotification(
        'Zamanlayıcı çalışıyor. Görev değiştirmek için tıklayın.',
        'warning',
        3000,
        () => {
          setIsActive(false);
          setActiveStartAt(null);
          setActiveTaskId(taskId);
          setResetFlag(prev => prev + 1);
        }
      );
      return;
    }

    // Zamanlayıcı çalışmıyorsa doğrudan görev değiştir
    setActiveTaskId(taskId);
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
      }
    } catch (error) {
      // Hata yönetimi TasksContext'te yapılıyor
    }
  };

  // Görevi manuel tamamla - tekil görev bazında
  const handleMarkTaskComplete = async (taskId) => {
    if (!isAuthenticated()) return;

    try {
      await completeTask(taskId);
      if (activeTaskId === taskId) {
        setIsActive(false);
      }
      // İstatistikleri otomatik yenile
      setStatsRefreshKey(prev => prev + 1);
    } catch (error) {
      // Hata yönetimi TasksContext'te yapılıyor
    }
  };

  // Timer'ı başlatma
  const handleStart = async () => {
    if (isAuthenticated()) {
      // Authenticated user flow
      if (!activeTaskId) {
        showVisualNotification('Lütfen önce bir görev seçin veya ekleyin.', 'warning', 4000);
        return;
      }

      setIsActive(true);
      setActiveStartAt(Date.now());
    } else {
      // Anonymous user flow - just start the timer with selected duration
      setIsActive(true);
      setActiveStartAt(Date.now());
    }
  };

  // Timer'ı duraklatma
  const handlePause = () => {
    setIsActive(false);
    setActiveStartAt(null);
  };

  // Timer'ı sıfırlama
  const handleReset = () => {
    setIsActive(false);
    setResetFlag(prev => prev + 1);
    setActiveStartAt(null);
  };

  // Timer tamamlandığında
  const handleComplete = async (actualWorkMinutes = null) => {
    // Pomodoro modu ve gerçek çalışma süresi varsa kaydet (minimum süre kısıtlaması yok)
    if (isAuthenticated() && actualWorkMinutes) {
      try {
        if (activeTaskId) {
          const activeTask = tasks.find(task => task.id === activeTaskId);
          const taskName = activeTask ? activeTask.taskName : 'Pomodoro Seansı';
          // Gerçek çalışma süresini kullan
          await recordPomodoroForTask(taskName, actualWorkMinutes);
        } else {
          // Aktif görev yoksa genel pomodoro seansı kaydet
          await recordPomodoroForTask('Pomodoro Seansı', actualWorkMinutes);
        }
        await fetchTasks();
        // İstatistikleri otomatik yenile
        setStatsRefreshKey(prev => prev + 1);
      } catch (error) {
        console.error("Pomodoro kaydedilirken hata:", error);
      }
    }
    setIsActive(false);
    setActiveStartAt(null);
  };

  // Timer mod değiştiğinde çağrılacak fonksiyon
  const handleModeChange = () => {
    setIsActive(false);
    setActiveStartAt(null);
  };

  // Anonymous mode change handler
  const handleAnonymousModeChange = (mode) => {
    setAnonymousMode(mode);

    // Set appropriate duration based on mode
    if (mode === 'pomodoro') {
      setAnonymousTimerDuration(25);
    } else if (mode === 'shortBreak') {
      setAnonymousTimerDuration(5);
    } else if (mode === 'longBreak') {
      setAnonymousTimerDuration(15);
    }

    setResetFlag(prev => prev + 1);
  };

  // Aktif görevin süresini bul - artık pomodoro süresi olarak kullanılacak
  const activeDuration = isAuthenticated() ? pomodoroDuration : anonymousTimerDuration;

  // Current timer mode (for anonymous users)
  const currentMode = isAuthenticated() ? undefined : anonymousMode;

  return (
    <div className="app">
      <Header />

      {tasksError && isAuthenticated() && (
        <div className="error-message">
          <p>{tasksError}</p>
          <button onClick={() => fetchTasks()}>Tekrar Dene</button>
        </div>
      )}

      <main>
        <div className="app-column">
          {!isAuthenticated() && (
            <div className="login-prompt-mini" style={{ marginBottom: 'var(--spacing-xl)' }}>
              <span className="login-prompt-mini-text">
                Görevleri kaydetmek ve istatistiklerinizi görüntülemek için giriş yapın
              </span>
              <div className="login-prompt-mini-actions">
                <Link to="/login" className="login-prompt-mini-btn">Giriş Yap</Link>
                <Link to="/register" className="login-prompt-mini-btn">Kayıt Ol</Link>
              </div>
            </div>
          )}
          <div className="top-row">
            <div className="pomodoro-section">
              <Timer
                duration={activeDuration}
                isActive={isActive}
                onComplete={handleComplete}
                resetFlag={resetFlag}
                onModeChange={handleModeChange}
                currentMode={currentMode}
                onAnonymousModeChange={handleAnonymousModeChange}
                isAuthenticated={isAuthenticated()}
                onDurationChange={isAuthenticated() ? setPomodoroDuration : setAnonymousTimerDuration}
              />

              <PomodoroControls
                isActive={isActive}
                onStart={handleStart}
                onPause={handlePause}
                onReset={handleReset}
              />

              {isAuthenticated() && activeTaskId && (
                <div className="active-task-minimal">
                  <div className="active-task-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <span className="active-task-text">{tasks.find(task => task.id === activeTaskId)?.taskName}</span>
                </div>
              )}
            </div>

            <div className="tasks-section">
              <div className="tasks-list-wrapper">
                <TaskList
                  tasks={tasks}
                  activeTaskId={activeTaskId}
                  isTimerActive={isActive}
                  activeStartAt={activeStartAt}
                  onSelectTask={handleSelectTask}
                  onDeleteTask={handleDeleteTask}
                  onCompleteTask={handleMarkTaskComplete}
                  onAddTask={handleAddTask}
                  loading={loading}
                />
              </div>
            </div>
          </div>
          <div className="bottom-row">
            <StatisticsPanel refreshKey={statsRefreshKey} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;