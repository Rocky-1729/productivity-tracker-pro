import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { User, Task, Goal, HabitCompletion, AppNotification, TaskPriority, TaskType } from "./types.ts";

const DB_DIR = path.resolve("./data");
const DB_FILE = path.join(DB_DIR, "productivity_db.json");

export interface DatabaseSchema {
  users: Record<string, User & { passwordHash: string }>;
  tasks: Record<string, Task>;
  goals: Record<string, Goal>;
  completions: HabitCompletion[];
  notifications: AppNotification[];
}

// Initial default db state
const defaultDb: DatabaseSchema = {
  users: {},
  tasks: {},
  goals: {},
  completions: [],
  notifications: [],
};

// Seed with default data if empty
function loadDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf-8");
      return defaultDb;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw) as DatabaseSchema;
  } catch (error) {
    console.error("Failed to load local DB, returning default state:", error);
    return defaultDb;
  }
}

function saveDb(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save local DB:", error);
  }
}

const quotes = [
  "Discipline beats motivation. Show up today.",
  "Small progress is still progress. Keep going.",
  "Consistency creates success. Don't break the chain.",
  "Focus on progress, not perfection.",
  "Your future is built by what you do today.",
  "One task at a time, one day at a time.",
  "Great things are done by a series of small things brought together."
];

export function getQuoteForToday(): string {
  // Use today's date hash to consistently pick a quote each day
  const todayStr = new Date().toDateString();
  let hash = 0;
  for (let i = 0; i < todayStr.length; i++) {
    hash = todayStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % quotes.length;
  return quotes[idx];
}

// Check and recalculate User Streaks
// Completed at least 1 task on a calendar date (local time YYYY-MM-DD or standard date YYYY-MM-DD)
export function recalculateStreaks(userId: string): void {
  const db = loadDb();
  const user = db.users[userId];
  if (!user) return;

  const tasks = Object.values(db.tasks).filter((t) => t.userId === userId);
  const completions = db.completions.filter((c) => c.userId === userId);

  // Collect all distinct dates when the user had completed items
  const productiveDates = new Set<string>();

  // 1. Check completed standard tasks (extract YYYY-MM-DD from completedAt)
  tasks.forEach((task) => {
    if (task.completed && task.completedAt) {
      const datePart = task.completedAt.split("T")[0]; // YYYY-MM-DD
      productiveDates.add(datePart);
    }
  });

  // 2. Check completions history (habit completions)
  completions.forEach((c) => {
    productiveDates.add(c.date);
  });

  // Sort dates descending
  const sortedDates = Array.from(productiveDates).sort((a, b) => b.localeCompare(a));

  if (sortedDates.length === 0) {
    user.streak = 0;
    db.users[userId] = user;
    saveDb(db);
    return;
  }

  // Calculate streak backwards from today
  const tzOffset = new Date().getTimezoneOffset() * 60 * 1000;
  const todayLocalStr = new Date(Date.now() - tzOffset).toISOString().split("T")[0];
  const yesterdayLocalStr = new Date(Date.now() - tzOffset - 86400000).toISOString().split("T")[0];

  let streak = 0;
  let currentCheckDateStr = todayLocalStr;
  let hasToday = productiveDates.has(todayLocalStr);
  let hasYesterday = productiveDates.has(yesterdayLocalStr);

  if (!hasToday && !hasYesterday) {
    // If they haven't completed anything today or yesterday, active streak is 0
    streak = 0;
  } else {
    // Start count from the most recent productive date (either today or yesterday)
    let checkDateObj = new Date(hasToday ? todayLocalStr : yesterdayLocalStr);
    let continues = true;
    while (continues) {
      const dStr = checkDateObj.toISOString().split("T")[0];
      if (productiveDates.has(dStr)) {
        streak++;
        // Go 1 day back
        checkDateObj.setDate(checkDateObj.getDate() - 1);
      } else {
        continues = false;
      }
    }
  }

  user.streak = streak;
  if (streak > user.longestStreak) {
    user.longestStreak = streak;
  }

  // Score Calculation
  // 10 points for completion, plus 5 points daily streak bonus, 20 points for each Goal completed
  let score = 0;
  // Count standard completed tasks
  const standardCompleted = tasks.filter((t) => t.completed).length;
  score += standardCompleted * 10;
  // Count habit completions
  score += completions.length * 10;
  // Streak score bonus
  score += streak * 15;
  
  user.score = score;

  db.users[userId] = user;
  saveDb(db);
}

// Reset daily habits if a new day has arrived
export function resetDailyHabitsForUser(userId: string): void {
  const db = loadDb();
  const tzOffset = new Date().getTimezoneOffset() * 60 * 1000;
  const todayStr = new Date(Date.now() - tzOffset).toISOString().split("T")[0]; // YYYY-MM-DD

  let updated = false;
  Object.values(db.tasks).forEach((task) => {
    if (task.userId === userId && task.type === TaskType.DAILY) {
      // If completed on a previous day, reset completion to false
      if (task.completed && task.completedAt && task.completedAt.split("T")[0] !== todayStr) {
        task.completed = false;
        task.completedAt = undefined;
        updated = true;
      }
    }
  });

  if (updated) {
    saveDb(db);
  }
}

export const Db = {
  load: loadDb,
  save: saveDb,
  users: {
    findMany: () => Object.values(loadDb().users),
    findById: (id: string) => loadDb().users[id] || null,
    findByEmail: (email: string) => {
      const users = Object.values(loadDb().users);
      return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
    },
    create: (data: User & { passwordHash: string }) => {
      const db = loadDb();
      db.users[data.id] = data;
      saveDb(db);
      return data;
    },
    update: (id: string, data: Partial<User>) => {
      const db = loadDb();
      if (!db.users[id]) return null;
      db.users[id] = { ...db.users[id], ...data };
      saveDb(db);
      recalculateStreaks(id);
      return db.users[id];
    },
  },
  tasks: {
    findManyByUser: (userId: string) => {
      resetDailyHabitsForUser(userId);
      return Object.values(loadDb().tasks).filter((t) => t.userId === userId);
    },
    findById: (id: string) => loadDb().tasks[id] || null,
    create: (data: Task) => {
      const db = loadDb();
      db.tasks[data.id] = data;
      saveDb(db);
      recalculateStreaks(data.userId);
      return data;
    },
    update: (id: string, userId: string, data: Partial<Task>) => {
      const db = loadDb();
      const task = db.tasks[id];
      if (!task || task.userId !== userId) return null;

      const previouslyCompleted = task.completed;
      db.tasks[id] = { ...task, ...data };
      
      const tzOffset = new Date().getTimezoneOffset() * 60 * 1000;
      const todayStr = new Date(Date.now() - tzOffset).toISOString().split("T")[0]; // YYYY-MM-DD

      // Track completions list for habits to support calendar history view
      if (db.tasks[id].completed && !previouslyCompleted) {
        db.tasks[id].completedAt = new Date().toISOString();
        if (db.tasks[id].type === TaskType.DAILY) {
          // Add detailed habit completion history for calendar
          const completionExists = db.completions.some(
            (c) => c.userId === userId && c.taskId === id && c.date === todayStr
          );
          if (!completionExists) {
            db.completions.push({
              id: `${id}_${Date.now()}`,
              userId,
              taskId: id,
              date: todayStr,
              title: db.tasks[id].title,
            });
          }
        }
      } else if (!db.tasks[id].completed && previouslyCompleted) {
        db.tasks[id].completedAt = undefined;
        if (db.tasks[id].type === TaskType.DAILY) {
          // Remove habit completion history for today's date
          db.completions = db.completions.filter(
            (c) => !(c.userId === userId && c.taskId === id && c.date === todayStr)
          );
        }
      }

      saveDb(db);
      recalculateStreaks(userId);
      return db.tasks[id];
    },
    delete: (id: string, userId: string) => {
      const db = loadDb();
      if (!db.tasks[id] || db.tasks[id].userId !== userId) return false;
      delete db.tasks[id];
      db.completions = db.completions.filter((c) => c.taskId !== id);
      saveDb(db);
      recalculateStreaks(userId);
      return true;
    },
    clearAll: (userId: string) => {
      const db = loadDb();
      Object.keys(db.tasks).forEach((id) => {
        if (db.tasks[id].userId === userId) {
          delete db.tasks[id];
        }
      });
      db.completions = db.completions.filter((c) => c.userId !== userId);
      saveDb(db);
      recalculateStreaks(userId);
    },
    importAll: (userId: string, taskList: Array<Omit<Task, "userId">>) => {
      const db = loadDb();
      taskList.forEach((t) => {
        const taskId = t.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        db.tasks[taskId] = {
          ...t,
          id: taskId,
          userId,
        };
      });
      saveDb(db);
      recalculateStreaks(userId);
    },
  },
  completions: {
    findManyByUser: (userId: string) => {
      return loadDb().completions.filter((c) => c.userId === userId);
    },
  },
  goals: {
    findManyByUser: (userId: string) => {
      return Object.values(loadDb().goals).filter((g) => g.userId === userId);
    },
    create: (data: Goal) => {
      const db = loadDb();
      db.goals[data.id] = data;
      saveDb(db);
      recalculateStreaks(data.userId);
      return data;
    },
    update: (id: string, userId: string, data: Partial<Goal>) => {
      const db = loadDb();
      const goal = db.goals[id];
      if (!goal || goal.userId !== userId) return null;
      db.goals[id] = { ...goal, ...data };
      saveDb(db);
      recalculateStreaks(userId);
      return db.goals[id];
    },
    delete: (id: string, userId: string) => {
      const db = loadDb();
      if (!db.goals[id] || db.goals[id].userId !== userId) return false;
      delete db.goals[id];
      saveDb(db);
      recalculateStreaks(userId);
      return true;
    },
  },
  notifications: {
    findManyByUser: (userId: string) => {
      return loadDb().notifications.filter((n) => n.userId === userId);
    },
    create: (data: AppNotification) => {
      const db = loadDb();
      db.notifications.push(data);
      saveDb(db);
      return data;
    },
    markRead: (id: string, userId: string) => {
      const db = loadDb();
      const n = db.notifications.find((notif) => notif.id === id && notif.userId === userId);
      if (n) {
        n.read = true;
        saveDb(db);
        return true;
      }
      return false;
    },
    generateForUser: (userId: string) => {
      const db = loadDb();
      const user = db.users[userId];
      if (!user) return;

      const tasks = Object.values(db.tasks).filter((t) => t.userId === userId);
      const tzOffset = new Date().getTimezoneOffset() * 60 * 1000;
      const todayStr = new Date(Date.now() - tzOffset).toISOString().split("T")[0]; // YYYY-MM-DD

      const activeNotifications = db.notifications.filter((n) => n.userId === userId);

      // Check overdue standard tasks
      tasks.forEach((task) => {
        if (!task.completed && task.dueDate && task.dueDate < todayStr && task.type !== TaskType.DAILY) {
          const exists = activeNotifications.some(
            (n) => n.text.includes(task.title) && n.text.includes("overdue")
          );
          if (!exists) {
            db.notifications.push({
              id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              userId,
              text: `⚠️ Task "${task.title}" is overdue (due: ${task.dueDate})!`,
              type: "alert",
              createdAt: new Date().toISOString(),
              read: false,
            });
          }
        } else if (!task.completed && task.dueDate === todayStr) {
          // Check task due today
          const exists = activeNotifications.some(
            (n) => n.text.includes(task.title) && n.text.includes("due today")
          );
          if (!exists) {
            db.notifications.push({
              id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              userId,
              text: `📅 Task "${task.title}" is due today!`,
              type: "info",
              createdAt: new Date().toISOString(),
              read: false,
            });
          }
        }
      });

      // Streak warnings
      if (user.streak > 0) {
        // If they have a streak but completed 0 tasks today
        const completedCountToday = tasks.filter((t) => {
          if (!t.completed || !t.completedAt) return false;
          return t.completedAt.split("T")[0] === todayStr;
        }).length;

        const habitCompletionsToday = db.completions.filter((c) => c.userId === userId && c.date === todayStr).length;

        if (completedCountToday === 0 && habitCompletionsToday === 0) {
          const exists = activeNotifications.some(
            (n) => n.text.includes("streak") && n.text.includes(todayStr)
          );
          if (!exists) {
            db.notifications.push({
              id: `notif_streak_${todayStr}`,
              userId,
              text: `🔥 Complete a task today to keep your ${user.streak}-day streak alive!`,
              type: "warning",
              createdAt: new Date().toISOString(),
              read: false,
            });
          }
        }
      }

      saveDb(db);
    },
  },
};
