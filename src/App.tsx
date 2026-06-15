import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  TrendingUp,
  Flame,
  Calendar,
  CheckCircle,
  Clock,
  Plus,
  Trash2,
  FolderPlus,
  Search,
  Filter,
  ArrowUpDown,
  Upload,
  Download,
  Moon,
  Sun,
  User as UserIcon,
  HelpCircle,
  LogOut,
  Target,
  Bell,
  RefreshCw,
  Loader2,
  CheckCircle2,
  ListTodo,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { Api, getToken, clearToken } from "./api.ts";
import { Task, Goal, AppNotification, TaskPriority, TaskType, DashboardStats } from "./types.ts";
import { downloadJSONFile, downloadCSVFile } from "./utils.ts";

import LoginView from "./components/LoginView.tsx";
import RegisterView from "./components/RegisterView.tsx";
import ProfileModal from "./components/ProfileModal.tsx";
import GoalSection from "./components/GoalSection.tsx";
import NotificationsCenter from "./components/NotificationsCenter.tsx";
import CalendarContributionView from "./components/CalendarContributionView.tsx";
import AnalyticsCharts from "./components/AnalyticsCharts.tsx";
import QuickAddTaskModal from "./components/QuickAddTaskModal.tsx";
import PomodoroWidget from "./components/PomodoroWidget.tsx";

export default function App() {
  // Auth state
  const [user, setUser] = useState<any | null>(null);
  const [authView, setAuthView] = useState<"login" | "signup">("login");
  const [tokenChecked, setTokenChecked] = useState(false);

  // App metrics
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [calendarData, setCalendarData] = useState<Record<string, { count: number; items: string[] }>>({});
  const [summary, setSummary] = useState<any>(null);
  const [motivationQuote, setMotivationQuote] = useState("");

  // UI interactive state variables
  const [darkMode, setDarkMode] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [appLoading, setAppLoading] = useState(false);

  // Task filtering & sorting variables
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "completed" | "pending" | "daily" | "oneTime">("all");
  const [sortBy, setSortBy] = useState<"priority" | "dueDate" | "title" | "category">("priority");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Add Custom Category modal or fields
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [showCustomCategoryForm, setShowCustomCategoryForm] = useState(false);
  const [categories, setCategories] = useState<string[]>(["Personal", "Work", "Exercise", "Study", "Health"]);

  // Task inline fields
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskCat, setTaskCat] = useState("Personal");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [taskType, setTaskType] = useState<TaskType>(TaskType.ONE_TIME);
  const [taskDueDate, setTaskDueDate] = useState("");
  const [newTaskLoading, setNewTaskLoading] = useState(false);

  // Pomodoro Focus Timer system states
  const [pomodoroTaskId, setPomodoroTaskId] = useState<string | null>(null);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(1500); // 25 mins in seconds default
  const [pomodoroIsRunning, setPomodoroIsRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<"focus" | "break">("focus");
  const [focusDuration, setFocusDuration] = useState(1500); // 25 mins focus
  const [breakDuration, setBreakDuration] = useState(300); // 5 mins break
  const [pomodoroCompletedCount, setPomodoroCompletedCount] = useState(() => {
    return Number(localStorage.getItem("prod_tracker_pomodoros_today") || "0");
  });
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "info" | "error" } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Read dark-mode / auth on mount
  useEffect(() => {
    // Theme setup
    const isDark = localStorage.getItem("prod_tracker_dark") === "true";
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Verify token
    const token = getToken();
    if (token) {
      checkCredentials();
    } else {
      setTokenChecked(true);
    }
  }, []);

  const checkCredentials = async () => {
    try {
      const u = await Api.auth.me();
      setUser(u);
      // Load dashboard data
      await loadDashboardData();
    } catch {
      // Clear token if expired or bad
      clearToken();
      setUser(null);
    } finally {
      setTokenChecked(true);
    }
  };

  const loadDashboardData = async () => {
    setAppLoading(true);
    try {
      const [tasksList, goalsList, notifsList, calMap, summaryObj, quoteRes] = await Promise.all([
        Api.tasks.getAll(),
        Api.goals.getAll(),
        Api.notifications.getAll(),
        Api.analytics.getCalendar(),
        Api.analytics.getSummary(),
        Api.motivation.getQuote(),
      ]);

      setTasks(tasksList);
      setGoals(goalsList);
      setNotifications(notifsList);
      setCalendarData(calMap);
      setSummary(summaryObj);
      setMotivationQuote(quoteRes.quote);

      // Collect any unique categories from imported tasks
      const allCats = new Set([...categories]);
      tasksList.forEach((t: Task) => {
        if (t.category) allCats.add(t.category);
      });
      setCategories(Array.from(allCats));
    } catch (err) {
      console.error("Failed to load dashboard statistics:", err);
    } finally {
      setAppLoading(false);
    }
  };

  // Toggle Theme
  const toggleTheme = () => {
    const nextVal = !darkMode;
    setDarkMode(nextVal);
    localStorage.setItem("prod_tracker_dark", String(nextVal));
    if (nextVal) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Handle Logout
  const handleLogout = () => {
    Api.auth.logout();
    setUser(null);
    setShowProfile(false);
    setTasks([]);
    setGoals([]);
    setNotifications([]);
  };

  // Authentication trigger callbacks
  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
    loadDashboardData();
  };

  /* =========================================
     POMODORO TIMER LOGIC
  ========================================= */

  const showToast = (text: string, type: "success" | "info" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev && prev.text === text ? null : prev));
    }, 4500);
  };

  const handlePomodoroFinished = () => {
    // Generate a beautiful synthesised notification sound using web audio API securely
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtx) {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.type = "sine";
        
        // Happy success chime
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.3); // G5
        osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.45); // C6
        
        gainNode.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.85);
      }
    } catch (e) {
      console.warn("Chime playback not triggered directly: ", e);
    }

    if (pomodoroMode === "focus") {
      const nextCount = pomodoroCompletedCount + 1;
      setPomodoroCompletedCount(nextCount);
      localStorage.setItem("prod_tracker_pomodoros_today", String(nextCount));

      // Award XP/Score +25
      if (user) {
        const updatedScore = (user.score || 0) + 25;
        setUser({ ...user, score: updatedScore });
        // Update user on backend to keep persistent if profile supports it
        Api.auth.updateProfile().catch(() => {});
      }

      const activeTask = tasks.find((t) => t.id === pomodoroTaskId);
      const text = activeTask 
        ? `🍅 Awesome! Focus session completed for task: "${activeTask.title}" (+25 points!)`
        : "🍅 Fantastic focus session completed! Ready for a rest? (+25 points!)";
      
      showToast(text, "success");

      // Auto trigger a client-side notification
      const newNotif: AppNotification = {
        id: `pomodoro_${Date.now()}`,
        userId: user?.id || "temp",
        text: activeTask 
          ? `🍅 Completed Pomodoro on task: "${activeTask.title}"`
          : "🍅 Completed focus session",
        type: "success",
        createdAt: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);

      // Switch to break duration
      setPomodoroMode("break");
      setPomodoroSeconds(breakDuration);
    } else {
      showToast("🧘 Break finished! Let's get back to smashing goals.", "info");
      setPomodoroMode("focus");
      setPomodoroSeconds(focusDuration);
    }
  };

  useEffect(() => {
    let intervalId: any = null;
    if (pomodoroIsRunning) {
      intervalId = setInterval(() => {
        setPomodoroSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(intervalId);
            setPomodoroIsRunning(false);
            // Defers calling finish outside of active tick
            setTimeout(handlePomodoroFinished, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [pomodoroIsRunning, pomodoroMode, pomodoroTaskId, focusDuration, breakDuration, pomodoroCompletedCount, user]);

  const handlePomodoroTogglePlay = () => {
    setPomodoroIsRunning(!pomodoroIsRunning);
  };

  const handlePomodoroReset = () => {
    setPomodoroIsRunning(false);
    setPomodoroSeconds(pomodoroMode === "focus" ? focusDuration : breakDuration);
  };

  const handlePomodoroSkip = () => {
    setPomodoroIsRunning(false);
    if (pomodoroMode === "focus") {
      setPomodoroMode("break");
      setPomodoroSeconds(breakDuration);
      showToast("Skipped to break session.", "info");
    } else {
      setPomodoroMode("focus");
      setPomodoroSeconds(focusDuration);
      showToast("Skipped break. Back to focusing!", "info");
    }
  };

  const handlePomodoroSetMode = (mode: "focus" | "break") => {
    setPomodoroIsRunning(false);
    setPomodoroMode(mode);
    setPomodoroSeconds(mode === "focus" ? focusDuration : breakDuration);
  };

  const handlePomodoroSelectTask = (taskId: string | null) => {
    setPomodoroTaskId(taskId);
    // If setting a new task, we might reset the timer to fresh state
    if (taskId && pomodoroMode === "focus") {
      setPomodoroIsRunning(false);
      setPomodoroSeconds(focusDuration);
    }
  };

  const handlePomodoroConfigChange = (focusMins: number, breakMins: number) => {
    const focusSecs = focusMins * 60;
    const breakSecs = breakMins * 60;
    setFocusDuration(focusSecs);
    setBreakDuration(breakSecs);
    setPomodoroSeconds(pomodoroMode === "focus" ? focusSecs : breakSecs);
    setPomodoroIsRunning(false);
    showToast(`Timer configured to Work: ${focusMins}m, Break: ${breakMins}m`, "info");
  };

  /* =========================================
     TASK ACTIONS
  ========================================= */

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    setNewTaskLoading(true);
    try {
      await Api.tasks.create({
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        category: taskCat,
        priority: taskPriority,
        dueDate: taskDueDate,
        type: taskType,
      });

      // Reset fields
      setTaskTitle("");
      setTaskDesc("");
      setTaskDueDate("");
      
      // Reload everything
      await loadDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setNewTaskLoading(false);
    }
  };

  const handleQuickAddTask = async (taskData: {
    title: string;
    description: string;
    category: string;
    priority: TaskPriority;
    type: TaskType;
    dueDate: string;
  }) => {
    try {
      await Api.tasks.create(taskData);
      await loadDashboardData();
    } catch (err) {
      console.error("Quick add task error:", err);
      throw err;
    }
  };

  const handleToggleComplete = async (id: string, currentlyCompleted: boolean) => {
    try {
      await Api.tasks.update(id, { completed: !currentlyCompleted });
      await loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await Api.tasks.delete(id);
      await loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditTask = async (task: Task) => {
    const newText = prompt("Edit Task Title", task.title);
    if (newText && newText.trim()) {
      try {
        await Api.tasks.update(task.id, { title: newText.trim() });
        await loadDashboardData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleClearAllTasks = async () => {
    if (confirm("Are you sure you want to delete all tasks permanently?")) {
      try {
        await Api.tasks.clearAll();
        await loadDashboardData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = customCategoryName.trim();
    if (cleanName && !categories.includes(cleanName)) {
      setCategories([...categories, cleanName]);
      setTaskCat(cleanName);
      setCustomCategoryName("");
      setShowCustomCategoryForm(false);
    }
  };

  /* =========================================
     GOAL ACTIONS
  ========================================= */

  const handleAddGoal = async (title: string, category: string, targetValue: number) => {
    try {
      await Api.goals.create({ title, category, targetValue });
      await loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateGoalProgress = async (id: string, currentValue: number) => {
    try {
      await Api.goals.update(id, { currentValue });
      await loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await Api.goals.delete(id);
      await loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  /* =========================================
     NOTIFICATION ACTIONS
  ========================================= */

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await Api.notifications.markRead(id);
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  /* =========================================
     EXPORT / IMPORT HANDLERS
  ========================================= */

  const handleExportJSON = () => {
    // Export full tasks list for backup
    const exportMetadata = {
      app: "Productivity Tracker Pro",
      exportedAt: new Date().toISOString(),
      tasks: tasks.map(({ id, userId, ...rest }) => rest), // Sanitize private hashes
    };
    downloadJSONFile(exportMetadata, `Productivity_Tracker_Backup_${new Date().toISOString().split("T")[0]}`);
  };

  const handleExportCSV = () => {
    downloadCSVFile(tasks, `Productivity_Tracker_Backup_${new Date().toISOString().split("T")[0]}`);
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const listToImport = parsed.tasks && Array.isArray(parsed.tasks) ? parsed.tasks : parsed;
        if (!Array.isArray(listToImport)) {
          alert("Invalid backup format. List of tasks expected.");
          return;
        }

        // Send to backend import
        await Api.tasks.import(listToImport);
        await loadDashboardData();
        alert(`Successfully imported ${listToImport.length} tasks!`);
      } catch (error) {
        alert("Could not import tasks. Make sure file contains valid JSON backup.");
      }
    };
    reader.readAsText(file);
  };

  /* =========================================
     TASK FILTERING & SORTING LOGIC
  ========================================= */

  const priorityScore = {
    [TaskPriority.HIGH]: 3,
    [TaskPriority.MEDIUM]: 2,
    [TaskPriority.LOW]: 1,
  };

  const filteredTasks = tasks
    .filter((task) => {
      // 1. Search Query
      const matchesSearch =
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description.toLowerCase().includes(search.toLowerCase());

      // 2. Filter tabs
      const matchesFilter =
        filter === "all" ||
        (filter === "completed" && task.completed) ||
        (filter === "pending" && !task.completed) ||
        (filter === "daily" && task.type === TaskType.DAILY) ||
        (filter === "oneTime" && task.type === TaskType.ONE_TIME);

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let comparison = 0;

      if (sortBy === "priority") {
        comparison = (priorityScore[a.priority] || 0) - (priorityScore[b.priority] || 0);
      } else if (sortBy === "dueDate") {
        comparison = (a.dueDate || "9999-99-99").localeCompare(b.dueDate || "9999-99-99");
      } else if (sortBy === "title") {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === "category") {
        comparison = a.category.localeCompare(b.category);
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

  /* =========================================
     RENDER
  ========================================= */

  if (!tokenChecked) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
        <p className="text-xs font-semibold text-gray-500 dark:text-neutral-400">
          Loading your workspace...
        </p>
      </div>
    );
  }

  // Render Authentication Views if no user logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex flex-col justify-center items-center p-4 transition-colors">
        <div className="text-center max-w-md mx-auto mb-8 px-4 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl shadow-lg shadow-blue-500/20 mb-4 animate-bounce">
            📈
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-gray-900 dark:text-white tracking-tight">
            📈 Productivity Tracker Pro
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-neutral-400 font-medium mt-2 tracking-wide">
            Track Tasks • Build Habits • Reach Goals
          </p>
        </div>

        {authView === "login" ? (
          <LoginView
            onLoginSuccess={handleAuthSuccess}
            onNavigateToSignUp={() => setAuthView("signup")}
          />
        ) : (
          <RegisterView
            onRegisterSuccess={handleAuthSuccess}
            onNavigateToLogin={() => setAuthView("login")}
          />
        )}
      </div>
    );
  }

  // Active user dashboard statistics
  const dashboardStats: DashboardStats = summary?.stats || {
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    completionRate: 0,
    currentStreak: user.streak,
    longestStreak: user.longestStreak,
    score: user.score,
  };

  const todayDateString = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-neutral-950 text-gray-800 dark:text-neutral-300 transition-colors duration-205 pb-16">
      
      {/* Top Header Controls bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-gray-200/60 dark:border-neutral-800/80">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white text-base sm:text-lg shadow-sm shrink-0">
              📈
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-black text-xs sm:text-sm md:text-base text-gray-900 dark:text-white tracking-tight leading-none truncate">
                Productivity Tracker Pro
              </h1>
              <p className="text-[9px] text-gray-500 dark:text-neutral-450 font-medium tracking-wide mt-1 truncate hidden sm:block">
                Track Tasks • Build Habits • Reach Goals
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Dark Mode toggle button */}
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2.5 rounded-xl border border-gray-200 dark:border-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 dark:text-neutral-300 transition-all cursor-pointer"
              title="Toggle theme mode"
            >
              {darkMode ? <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400" /> : <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-indigo-500" />}
            </button>

            {/* Notifications Alert Center */}
            <NotificationsCenter
              notifications={notifications}
              onMarkRead={handleMarkNotificationRead}
            />

            {/* User Profile Trigger Button */}
            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-1 sm:gap-2 pl-1 pr-1.5 sm:pl-2 sm:pr-2.5 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 border border-transparent hover:border-gray-200 dark:hover:border-neutral-800/80 transition-all cursor-pointer"
              title="My profile controls"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-gray-200 dark:border-neutral-700 bg-gray-100 shrink-0">
                {user.profilePic ? (
                  <img src={user.profilePic} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon className="w-full h-full p-1.5 text-gray-400" />
                )}
              </div>
              <span className="hidden sm:inline font-semibold text-xs text-gray-700 dark:text-white truncate max-w-[100px]">
                {user.name.split(" ")[0]}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Wrapper */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Welcome Section Banner */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xs mb-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6" id="welcome-pane">
          <div className="space-y-1 sm:space-y-2 max-w-xl">
            <h2 className="font-display text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
              Welcome back, <span className="text-blue-500">{user.name}</span> 👋
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
              Today is <span className="font-semibold text-gray-805 dark:text-neutral-200">{todayDateString}</span>
            </p>
            {motivationQuote && (
              <div className="pt-3.5 flex items-start gap-2 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50/45 dark:bg-indigo-950/20 px-3.5 py-2.5 rounded-xl border border-indigo-100/40 dark:border-indigo-900/30">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="italic font-medium">{motivationQuote}</span>
              </div>
            )}
          </div>

          <div className="flex gap-4 sm:gap-6 shrink-0 bg-gray-50 dark:bg-neutral-800 px-5 py-4 rounded-2xl border border-gray-100 dark:border-neutral-800">
            <div className="text-center">
              <span className="block text-[10px] text-gray-400 dark:text-neutral-500 font-bold uppercase tracking-wider">Active Streak</span>
              <span className="font-display font-black text-2xl text-orange-500 flex items-center gap-1 justify-center mt-1">
                <Flame className="w-6.5 h-6.5 text-orange-500 animate-bounce" />
                {dashboardStats.currentStreak}
              </span>
            </div>
            <div className="w-1.5 border-r border-gray-200 dark:border-neutral-800" />
            <div className="text-center">
              <span className="block text-[10px] text-gray-400 dark:text-neutral-500 font-bold uppercase tracking-wider">Productivity Score</span>
              <span className="font-display font-black text-2xl text-blue-600 dark:text-blue-400 flex items-center gap-1 justify-center mt-1">
                🏆
                {dashboardStats.score}
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard numerical stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" id="numerical-metric-cards-row">
          
          <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 p-4.5 rounded-2xl shadow-xs">
            <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-neutral-500">Total Cataloged</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-gray-900 dark:text-white font-mono">{dashboardStats.totalTasks}</span>
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-neutral-800 text-blue-500">
                <ListTodo className="w-4.5 h-4.5" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 p-4.5 rounded-2xl shadow-xs">
            <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-neutral-500">Completed items</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{dashboardStats.completedTasks}</span>
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-neutral-800 text-emerald-500">
                <CheckCircle className="w-4.5 h-4.5" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 p-4.5 rounded-2xl shadow-xs">
            <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-neutral-500">Pending Actions</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{dashboardStats.pendingTasks}</span>
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-neutral-800 text-amber-500">
                <Clock className="w-4.5 h-4.5" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 p-4.5 rounded-2xl shadow-xs">
            <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-neutral-500">Longest Streak</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">{dashboardStats.longestStreak} days</span>
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-neutral-800 text-purple-500">
                <TrendingUp className="w-4.5 h-4.5" />
              </div>
            </div>
          </div>

        </div>

        {/* Action Progress Bar */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl p-4.5 sm:p-5 shadow-xs mb-6">
          <div className="flex justify-between items-center text-xs font-semibold text-gray-500 dark:text-neutral-400 mb-1.5">
            <span className="flex items-center gap-1.5 font-display text-gray-900 dark:text-white font-semibold">
              Today's Completion Progress:
              <span className="text-blue-500 font-bold font-mono">{dashboardStats.completionRate}% Done</span>
            </span>
            <span className="text-gray-400">{dashboardStats.completedTasks} / {dashboardStats.totalTasks} Done</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-neutral-800 h-3 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-full transition-all duration-300"
              style={{ width: `${dashboardStats.completionRate}%` }}
            />
          </div>
        </div>

        {/* Primary Content Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-main-columns-grid">
          
          {/* LEFT: Task management section (8cols) */}
          <section className="lg:col-span-8 space-y-6 relative" id="task-management-section">
            
            {/* Quick Add FAB floats in bottom/side viewport or securely in the corner of the task management section */}
            <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowQuickAdd(true)}
                className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center cursor-pointer group relative"
                title="⚡ Quick Capture Task"
                id="quick-add-fab-button"
              >
                <Plus className="w-6 h-6 transition-transform duration-300 group-hover:rotate-90" />
                <span className="absolute right-16 bg-gray-900 dark:bg-neutral-800 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md flex items-center gap-1 border border-gray-800 dark:border-neutral-700">
                  ⚡ Quick Capture
                </span>
                {/* Micro-indicator pulse animation */}
                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500"></span>
                </span>
              </motion.button>
            </div>
            
            {/* Task Add Form Card */}
            <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-3xl p-5 shadow-xs">
              <h3 className="font-display font-medium text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-500" />
                Plan Custom Activity
              </h3>
              
              <form onSubmit={handleAddTask} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500">Task Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Code feature A, Jog 1 hour"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500">Brief Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Complete test cycles and deploy"
                      value={taskDesc}
                      onChange={(e) => setTaskDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500 mb-1">Type</label>
                    <select
                      value={taskType}
                      onChange={(e) => setTaskType(e.target.value as TaskType)}
                      className="w-full px-2.5 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs focus:outline-none dark:text-white dark:bg-neutral-800"
                    >
                      <option value={TaskType.ONE_TIME} className="bg-white dark:bg-neutral-800 text-gray-900 dark:text-white">📝 One-Time Task</option>
                      <option value={TaskType.DAILY} className="bg-white dark:bg-neutral-800 text-gray-900 dark:text-white">🔁 Daily Habit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500 mb-1">Priority</label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                      className="w-full px-2.5 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs focus:outline-none dark:text-white font-medium dark:bg-neutral-800"
                    >
                      <option value={TaskPriority.HIGH} className="bg-white dark:bg-neutral-800 text-gray-900 dark:text-white">🔴 High Priority</option>
                      <option value={TaskPriority.MEDIUM} className="bg-white dark:bg-neutral-800 text-gray-900 dark:text-white">🟡 Medium Priority</option>
                      <option value={TaskPriority.LOW} className="bg-white dark:bg-neutral-800 text-gray-900 dark:text-white">🟢 Low Priority</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500 mb-1">Category</label>
                    <div className="relative">
                      <select
                        value={taskCat}
                        onChange={(e) => {
                          if (e.target.value === "__new") {
                            setShowCustomCategoryForm(true);
                          } else {
                            setTaskCat(e.target.value);
                          }
                        }}
                        className="w-full px-2.5 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs focus:outline-none dark:text-white dark:bg-neutral-800"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat} className="bg-white dark:bg-neutral-800 text-gray-900 dark:text-white">
                            {cat}
                          </option>
                        ))}
                        <option value="__new" className="bg-white dark:bg-neutral-800 text-gray-900 dark:text-white">➕ Add Custom...</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs focus:outline-none dark:text-white"
                    />
                  </div>
                </div>

                {/* Custom Category mini form popup container */}
                {showCustomCategoryForm && (
                  <div className="p-3 bg-blue-50/40 dark:bg-neutral-800/60 border border-blue-10/40 dark:border-neutral-700 rounded-xl flex items-center gap-2 animate-slide-in">
                    <input
                      type="text"
                      placeholder="Enter custom category name"
                      value={customCategoryName}
                      onChange={(e) => setCustomCategoryName(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-xs dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomCategory}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg cursor-pointer"
                    >
                      Save Category
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCustomCategoryForm(false)}
                      className="px-2.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-600 dark:bg-neutral-700 dark:text-neutral-300 font-semibold text-xs rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={newTaskLoading}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-55 shadow-xs"
                  >
                    {newTaskLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Create Activity
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Task Search & Filter Navigation bar */}
            <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-3xl p-5 shadow-xs whitespace-normal">
              
              <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center mb-4">
                
                {/* Search Bar query elements */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search task title or details..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700/60 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                  />
                </div>

                {/* Filter and actions bar split */}
                <div className="flex flex-wrap items-center gap-2">
                  
                  {/* Sorting settings */}
                  <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-neutral-800 px-2.5 py-1.5 rounded-xl border border-gray-100 dark:border-neutral-700/65 text-xs">
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-transparent focus:outline-none font-medium text-gray-700 dark:text-neutral-300 text-xs"
                    >
                      <option value="priority" className="bg-white dark:bg-neutral-800 text-gray-900 dark:text-white">Priority</option>
                      <option value="dueDate" className="bg-white dark:bg-neutral-800 text-gray-900 dark:text-white">Due Date</option>
                      <option value="title" className="bg-white dark:bg-neutral-800 text-gray-900 dark:text-white">Title</option>
                      <option value="category" className="bg-white dark:bg-neutral-800 text-gray-900 dark:text-white">Category</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                      className="ml-1 text-[10px] uppercase font-bold text-blue-550 hover:underline cursor-pointer"
                    >
                      {sortOrder === "asc" ? "Asc" : "Desc"}
                    </button>
                  </div>

                  {/* Export Options */}
                  <div className="flex items-center gap-1 bg-gray-50 dark:bg-neutral-800 px-2 py-1 rounded-xl border border-gray-100 dark:border-neutral-700/65 text-xs">
                    <button
                      onClick={handleExportJSON}
                      className="px-2 py-1 text-[10px] font-bold text-gray-600 dark:text-neutral-400 hover:text-blue-500 flex items-center gap-0.5 cursor-pointer"
                      title="Export to JSON Backup"
                    >
                      <Download className="w-3 h-3" />
                      JSON
                    </button>
                    <span className="text-gray-350">|</span>
                    <button
                      onClick={handleExportCSV}
                      className="px-2 py-1 text-[10px] font-bold text-gray-600 dark:text-neutral-400 hover:text-blue-500 flex items-center gap-0.5 cursor-pointer"
                      title="Export to CSV Spreadsheet"
                    >
                      <Download className="w-3 h-3" />
                      CSV
                    </button>
                  </div>

                  {/* Import Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1 px-2 text-[10px] font-bold hover:text-blue-500 text-gray-600 dark:text-neutral-400 bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-800 border border-gray-100 dark:border-neutral-700/65 rounded-xl flex items-center gap-1 cursor-pointer"
                    title="Import JSON Task backups"
                  >
                    <Upload className="w-3 h-3" />
                    Import
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportJSON}
                    className="hidden"
                    accept=".json"
                  />

                  {/* Clear Button */}
                  <button
                    onClick={handleClearAllTasks}
                    className="p-2 text-[10px] font-bold text-white bg-red-650 hover:bg-red-700 rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
                    title="Clear list"
                  >
                    <Trash2 className="w-3 h-3" />
                    Reset
                  </button>
                </div>

              </div>

              {/* Filtering category tabs select list */}
              <div className="flex flex-wrap items-center gap-1 border-b border-gray-100 dark:border-neutral-800 pb-3 mb-4">
                {(["all", "completed", "pending", "daily", "oneTime"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      filter === tab
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-gray-500 hover:bg-gray-50 dark:text-neutral-400 dark:hover:bg-neutral-800"
                    }`}
                  >
                    {tab === "all" && "All Tasks"}
                    {tab === "completed" && "✓ Completed"}
                    {tab === "pending" && "⏳ Pending"}
                    {tab === "daily" && "🔁 Habits"}
                    {tab === "oneTime" && "📝 One-Time"}
                  </button>
                ))}
              </div>

              {/* Tasks List Content Area */}
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-gray-200 dark:text-neutral-800 mb-3" />
                  <p className="text-sm font-medium">No tasks found matching current filters.</p>
                  <p className="text-xs text-gray-400 mt-1">Get started by entering an active task above!</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <AnimatePresence initial={false}>
                    {filteredTasks.map((task) => {
                      const priorityColors = {
                        [TaskPriority.HIGH]: "border-l-4 border-l-red-500 bg-red-500/5",
                        [TaskPriority.MEDIUM]: "border-l-4 border-l-amber-500 bg-amber-500/3.5",
                        [TaskPriority.LOW]: "border-l-4 border-l-emerald-500 bg-emerald-500/5",
                      };

                      return (
                        <motion.div
                          key={task.id}
                          id={`task-item-${task.id}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.15 }}
                          className={`p-3.5 border border-gray-100/80 dark:border-neutral-800/75 rounded-2xl flex items-start justify-between gap-3 shadow-xs hover:shadow-xs transition-all ${
                            task.completed ? "opacity-60 bg-gray-50/50 dark:bg-neutral-800/10" : "bg-white dark:bg-neutral-900"
                          } ${priorityColors[task.priority]}`}
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => handleToggleComplete(task.id, task.completed)}
                              className="w-5 h-5 mt-0.5 rounded-lg text-blue-500 border-gray-300 focus:ring-blue-500 cursor-pointer dark:bg-neutral-800"
                            />
                            <div className="flex-1 min-w-0">
                              <h4
                                className={`text-sm font-bold text-gray-900 dark:text-white leading-tight ${
                                  task.completed ? "line-through text-gray-400 dark:text-neutral-500" : ""
                                }`}
                              >
                                {task.title}
                              </h4>
                              {task.description && (
                                <p className="text-xs text-gray-500 dark:text-neutral-450 mt-1 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                              
                              <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[10px] text-gray-400">
                                <span className="bg-gray-200/60 dark:bg-neutral-800 px-2 py-0.5 rounded text-gray-600 dark:text-neutral-350 font-semibold uppercase tracking-wider">
                                  📂 {task.category}
                                </span>
                                <span className={`px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${
                                  task.type === TaskType.DAILY ? "bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-300" : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-300"
                                }`}>
                                  {task.type === TaskType.DAILY ? "🔁 Habit" : "📝 One-Time"}
                                </span>
                                {task.dueDate && (
                                  <span className="flex items-center gap-0.5 font-medium ml-1">
                                    <Clock className="w-3 h-3 text-gray-400" />
                                    Due: {task.dueDate}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Built-in Pomodoro Inline Controller next to task items */}
                          {!task.completed && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50/80 dark:bg-neutral-850/65 rounded-xl border border-gray-150/40 dark:border-neutral-800/40 self-center shrink-0">
                              {pomodoroTaskId === task.id ? (
                                <>
                                  <span className="relative flex h-2 w-2 mr-0.5">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pomodoroIsRunning ? "bg-red-400" : "bg-amber-400"}`}></span>
                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${pomodoroIsRunning ? "bg-red-500" : "bg-amber-500"}`}></span>
                                  </span>
                                  
                                  <span className="font-mono text-xs font-bold text-gray-800 dark:text-neutral-200 tracking-tight">
                                    {Math.floor(pomodoroSeconds / 60).toString().padStart(2, "0")}:{(pomodoroSeconds % 60).toString().padStart(2, "0")}
                                  </span>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPomodoroIsRunning(!pomodoroIsRunning);
                                    }}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                                      pomodoroIsRunning 
                                        ? "bg-amber-100 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 hover:bg-amber-200/50" 
                                        : "bg-red-500 text-white hover:bg-red-600"
                                    } transition-all cursor-pointer`}
                                    title={pomodoroIsRunning ? "Pause focus" : "Start focus"}
                                  >
                                    {pomodoroIsRunning ? "Pause" : "Start"}
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePomodoroReset();
                                    }}
                                    className="p-1 text-[10px] bg-gray-200 hover:bg-gray-300 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-750 text-gray-600 rounded-lg transition-all cursor-pointer"
                                    title="Reset focus clock"
                                  >
                                    Reset
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPomodoroTaskId(task.id);
                                    setPomodoroMode("focus");
                                    setPomodoroSeconds(focusDuration);
                                    setPomodoroIsRunning(true);
                                    showToast(`Started Pomodoro focused session for: "${task.title}"`, "success");
                                  }}
                                  className="px-2.5 py-1 bg-gray-150/40 hover:bg-red-50 hover:text-red-650 dark:bg-neutral-800/40 dark:hover:bg-red-950/20 dark:hover:text-red-400 rounded-lg text-[10px] font-bold text-gray-500 dark:text-neutral-400 transition-all cursor-pointer flex items-center gap-1"
                                  title="Start Pomodoro focus session"
                                >
                                  <span>🍅</span>
                                  <span>Start</span>
                                </button>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-1 self-start shrink-0">
                            <button
                              onClick={() => handleEditTask(task)}
                              className="text-xs font-semibold hover:text-blue-500 text-gray-400 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all cursor-pointer"
                              title="Edit text"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/15 transition-all cursor-pointer"
                              title="Delete item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Recharts Analytics Charts segment */}
            <AnalyticsCharts summaryData={summary} />

          </section>

          {/* RIGHT: Calendar, Goals, Reminders (4cols) */}
          <aside className="lg:col-span-4 space-y-6">

            {/* Pomodoro Focus Timer Core */}
            <PomodoroWidget
              activeTaskId={pomodoroTaskId}
              tasks={tasks}
              seconds={pomodoroSeconds}
              duration={pomodoroMode === "focus" ? focusDuration : breakDuration}
              isRunning={pomodoroIsRunning}
              mode={pomodoroMode}
              completedCount={pomodoroCompletedCount}
              onTogglePlay={handlePomodoroTogglePlay}
              onReset={handlePomodoroReset}
              onSkip={handlePomodoroSkip}
              onSetMode={handlePomodoroSetMode}
              onSelectTask={handlePomodoroSelectTask}
              onConfigChange={handlePomodoroConfigChange}
            />
            
            {/* Contribution GitHub style Calendar */}
            <CalendarContributionView calendarData={calendarData} />

            {/* Strategic goals milestones */}
            <GoalSection
              goals={goals}
              onAddGoal={handleAddGoal}
              onUpdateProgress={handleUpdateGoalProgress}
              onDeleteGoal={handleDeleteGoal}
            />

          </aside>

        </div>

      </main>

      {/* User profile modal controller */}
      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onLogout={handleLogout}
          onProfileUpdated={(up) => setUser(up)}
        />
      )}

      {/* Quick Add capture modal component */}
      <QuickAddTaskModal
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        categories={categories}
        onAddTask={handleQuickAddTask}
      />

      {/* Toast Alert Notifications */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`fixed bottom-6 left-6 z-50 p-4 rounded-2xl shadow-xl border flex items-center gap-3 max-w-sm ${
              toastMessage.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/95 text-emerald-800 dark:text-emerald-300 border-emerald-150/60 dark:border-emerald-800"
                : toastMessage.type === "error"
                ? "bg-red-50 dark:bg-red-950/95 text-red-800 dark:text-red-300 border-red-150/60 dark:border-red-800"
                : "bg-blue-50 dark:bg-blue-950/95 text-blue-800 dark:text-blue-300 border-blue-150/60 dark:border-blue-800"
            }`}
          >
            <div className={`p-1.5 rounded-lg shrink-0 ${
              toastMessage.type === "success"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : toastMessage.type === "error"
                ? "bg-red-500/10 text-red-600 dark:text-red-400"
                : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
            }`}>
              {toastMessage.type === "success" ? "🍅" : "ℹ️"}
            </div>
            <div className="flex-1 text-xs font-semibold leading-relaxed">
              {toastMessage.text}
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-gray-400 hover:text-gray-650 dark:hover:text-neutral-300 font-bold text-xs cursor-pointer p-0.5"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer system details */}
      <footer className="mt-16 pt-8 border-t border-gray-200 dark:border-neutral-900 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-1.5" id="footer-branding">
        <p className="font-display font-black text-lg text-gray-800 dark:text-white tracking-tight">
          📈 Productivity Tracker Pro
        </p>
        <p className="text-xs text-gray-500 dark:text-neutral-400 tracking-wide font-medium">
          Track Tasks • Build Habits • Reach Goals
        </p>
      </footer>

    </div>
  );
}
