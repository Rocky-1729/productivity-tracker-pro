export enum TaskPriority {
  HIGH = "High",
  MEDIUM = "Medium",
  LOW = "Low",
}

export enum TaskType {
  DAILY = "daily",
  ONE_TIME = "oneTime",
}

export interface User {
  id: string;
  name: string;
  email: string;
  profilePic?: string;
  joinedDate: string;
  streak: number;
  longestStreak: number;
  score: number;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  priority: TaskPriority;
  dueDate: string; // YYYY-MM-DD
  type: TaskType;
  completed: boolean;
  createdAt: string;
  completedAt?: string; // ISO string
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  category: string;
  targetValue: number;
  currentValue: number;
  createdAt: string;
}

export interface HabitCompletion {
  id: string;
  userId: string;
  taskId: string;
  date: string; // YYYY-MM-DD
  title: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  text: string;
  type: "info" | "success" | "warning" | "alert";
  createdAt: string;
  read: boolean;
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  score: number;
}
