import express, { Request, Response, NextFunction } from "express";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createServer as createViteServer } from "vite";
import { Db, getQuoteForToday, recalculateStreaks } from "./src/db_store.ts";
import { Task, Goal, TaskPriority, TaskType } from "./src/types.ts";

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "MY_SUPER_SECRET_JWT_PASSPHRASE";

app.use(express.json());

// Express Auth Middleware
export interface AuthenticatedRequest extends Request {
  userId?: string;
  email?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    req.userId = decoded.userId;
    req.email = decoded.email;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token." });
  }
}

/* =========================================
   AUTHENTICATION ROUTES
========================================= */

// Register Route
app.post("/api/auth/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    const db = Db.load();
    const existing = Db.users.findByEmail(email);
    if (existing) {
      return res.status(400).json({ error: "A user with this email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userId = "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
    const user = {
      id: userId,
      name,
      email: email.toLowerCase(),
      joinedDate: new Date().toISOString(),
      streak: 0,
      longestStreak: 0,
      score: 0,
    };

    Db.users.create({
      ...user,
      passwordHash,
    });

    const token = jwt.sign({ userId, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({ token, user });
  } catch (error: any) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: "Server error during registration." });
  }
});

// Login Route
app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const userRecord = Db.users.findByEmail(email);
    if (!userRecord) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const validPassword = await bcrypt.compare(password, userRecord.passwordHash);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign({ userId: userRecord.id, email: userRecord.email }, JWT_SECRET, { expiresIn: "7d" });
    
    // Omit sensitive data
    const user = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      joinedDate: userRecord.joinedDate,
      streak: userRecord.streak,
      longestStreak: userRecord.longestStreak,
      score: userRecord.score,
      profilePic: userRecord.profilePic,
    };

    // Calculate/reset habits & generate notifications upon user login
    Db.notifications.generateForUser(user.id);

    return res.json({ token, user });
  } catch (error: any) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Server error during login." });
  }
});

// Profile / Current User Update
app.get("/api/auth/me", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const userRecord = Db.users.findById(userId);
    if (!userRecord) {
      return res.status(404).json({ error: "User not found." });
    }

    // Refresh system warnings & notifications
    Db.notifications.generateForUser(userId);
    recalculateStreaks(userId);

    // Reload with updated streak/score
    const refreshedUser = Db.users.findById(userId)!;

    const user = {
      id: refreshedUser.id,
      name: refreshedUser.name,
      email: refreshedUser.email,
      joinedDate: refreshedUser.joinedDate,
      streak: refreshedUser.streak,
      longestStreak: refreshedUser.longestStreak,
      score: refreshedUser.score,
      profilePic: refreshedUser.profilePic,
    };
    return res.json(user);
  } catch (error: any) {
    return res.status(500).json({ error: "Server error fetching user profile." });
  }
});

// Update Profile Detail
app.put("/api/auth/profile", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { name, profilePic } = req.body;

    const updated = Db.users.update(userId, {
      name: name || undefined,
      profilePic: profilePic || undefined,
    });

    if (!updated) {
      return res.status(404).json({ error: "User not found." });
    }

    const user = {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      joinedDate: updated.joinedDate,
      streak: updated.streak,
      longestStreak: updated.longestStreak,
      score: updated.score,
      profilePic: updated.profilePic,
    };
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: "Server error updating profile." });
  }
});

/* =========================================
   TASK MANAGEMENT ROUTES
========================================= */

app.get("/api/tasks", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const tasks = Db.tasks.findManyByUser(userId);
    return res.json(tasks);
  } catch (error) {
    return res.status(500).json({ error: "Server error loading tasks." });
  }
});

app.post("/api/tasks", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { title, description, category, priority, dueDate, type } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Task title is required." });
    }

    const task: Task = {
      id: "task_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      userId,
      title,
      description: description || "",
      category: category || "Personal",
      priority: (priority as TaskPriority) || TaskPriority.MEDIUM,
      dueDate: dueDate || "",
      type: (type as TaskType) || TaskType.ONE_TIME,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const created = Db.tasks.create(task);
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ error: "Server error creating task." });
  }
});

app.put("/api/tasks/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const updateData = req.body;

    const updated = Db.tasks.update(id, userId, updateData);
    if (!updated) {
      return res.status(404).json({ error: "Task not found or unauthorized." });
    }
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: "Server error updating task." });
  }
});

app.delete("/api/tasks/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const done = Db.tasks.delete(id, userId);
    if (!done) {
      return res.status(404).json({ error: "Task not found or unauthorized." });
    }
    return res.json({ success: true, message: "Task deleted successfully." });
  } catch (error) {
    return res.status(500).json({ error: "Server error deleting task." });
  }
});

app.post("/api/tasks/clear-all", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    Db.tasks.clearAll(userId);
    return res.json({ success: true, message: "All tasks deleted." });
  } catch (error) {
    return res.status(500).json({ error: "Server error clearing tasks." });
  }
});

app.post("/api/tasks/import", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { tasks: importedTasks } = req.body;
    if (!Array.isArray(importedTasks)) {
      return res.status(400).json({ error: "Invalid tasks collection data." });
    }
    Db.tasks.importAll(userId, importedTasks);
    const updatedTasks = Db.tasks.findManyByUser(userId);
    return res.json(updatedTasks);
  } catch (error) {
    return res.status(500).json({ error: "Server error importing tasks." });
  }
});

/* =========================================
   GOAL MANAGEMENT ROUTES
========================================= */

app.get("/api/goals", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const goals = Db.goals.findManyByUser(userId);
    return res.json(goals);
  } catch (error) {
    return res.status(500).json({ error: "Server error loading goals." });
  }
});

app.post("/api/goals", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { title, category, targetValue, currentValue } = req.body;
    if (!title || !category || targetValue === undefined) {
      return res.status(400).json({ error: "Missing required goal parameters." });
    }

    const goal: Goal = {
      id: "goal_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      userId,
      title,
      category,
      targetValue: parseFloat(targetValue),
      currentValue: parseFloat(currentValue || 0),
      createdAt: new Date().toISOString(),
    };

    const created = Db.goals.create(goal);
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ error: "Server error creating goals." });
  }
});

app.put("/api/goals/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { currentValue, title, targetValue } = req.body;

    const updated = Db.goals.update(id, userId, {
      currentValue: currentValue !== undefined ? parseFloat(currentValue) : undefined,
      title: title || undefined,
      targetValue: targetValue !== undefined ? parseFloat(targetValue) : undefined,
    });

    if (!updated) {
      return res.status(404).json({ error: "Goal not found." });
    }
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: "Server error updating goal." });
  }
});

app.delete("/api/goals/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const done = Db.goals.delete(id, userId);
    if (!done) {
      return res.status(404).json({ error: "Goal not found." });
    }
    return res.json({ success: true, message: "Goal deleted." });
  } catch (error) {
    return res.status(500).json({ error: "Server error deleting goal." });
  }
});

/* =========================================
   NOTIFICATION ROUTING
========================================= */

app.get("/api/notifications", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const notifications = Db.notifications.findManyByUser(userId);
    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({ error: "Server error loading notifications." });
  }
});

app.put("/api/notifications/:id/read", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const status = Db.notifications.markRead(id, userId);
    return res.json({ success: status });
  } catch (error) {
    return res.status(500).json({ error: "Server error updating notifications." });
  }
});

/* =========================================
   DAILY MOTIVATION & INSIGHT ENDPOINTS
========================================= */

app.get("/api/motivation", (req: Request, res: Response) => {
  return res.json({ quote: getQuoteForToday() });
});

/* =========================================
   PRODUCTIVITY ANALYTICS & CALENDAR
========================================= */

app.get("/api/analytics/calendar", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const completions = Db.completions.findManyByUser(userId);
    const tasks = Db.tasks.findManyByUser(userId);

    // We compile standard task completions and habit completions by date
    const contributionMap: Record<string, { count: number; items: string[] }> = {};

    // Standard task completions
    tasks.forEach((task) => {
      if (task.completed && task.completedAt) {
        const dStr = task.completedAt.split("T")[0]; // YYYY-MM-DD
        if (!contributionMap[dStr]) {
          contributionMap[dStr] = { count: 0, items: [] };
        }
        contributionMap[dStr].count++;
        contributionMap[dStr].items.push(`✓ [Task] ${task.title}`);
      }
    });

    // Habit completions
    completions.forEach((hc) => {
      if (!contributionMap[hc.date]) {
        contributionMap[hc.date] = { count: 0, items: [] };
      }
      contributionMap[hc.date].count++;
      contributionMap[hc.date].items.push(`🔁 [Habit] ${hc.title}`);
    });

    return res.json(contributionMap);
  } catch (error) {
    return res.status(500).json({ error: "Server error. Could not compile calendar history." });
  }
});

app.get("/api/analytics/summary", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const tasks = Db.tasks.findManyByUser(userId);
    const completions = Db.completions.findManyByUser(userId);
    const user = Db.users.findById(userId);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Compile categories count
    const categoryCounts: Record<string, { completed: number; total: number }> = {
      Study: { completed: 0, total: 0 },
      Work: { completed: 0, total: 0 },
      Health: { completed: 0, total: 0 },
      Exercise: { completed: 0, total: 0 },
      Personal: { completed: 0, total: 0 },
    };

    tasks.forEach((t) => {
      const cat = t.category || "Personal";
      if (!categoryCounts[cat]) {
        categoryCounts[cat] = { completed: 0, total: 0 };
      }
      categoryCounts[cat].total++;
      if (t.completed) {
        categoryCounts[cat].completed++;
      }
    });

    // Compile Weekly Productivity data (last 7 days)
    const tzOffset = new Date().getTimezoneOffset() * 60 * 1000;
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - tzOffset - i * 86400000);
      const dStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });

      // count completed tasks or habits for this date
      const taskComps = tasks.filter((t) => t.completed && t.completedAt && t.completedAt.split("T")[0] === dStr).length;
      const habitComps = completions.filter((c) => c.date === dStr).length;

      weeklyData.push({
        date: dStr,
        day: dayName,
        completed: taskComps + habitComps,
      });
    }

    // Compile Monthly state (grouped by day of month or general progress chart)
    const monthlyData = [];
    for (let i = 29; i >= 0; i -= 2) {
      const d = new Date(Date.now() - tzOffset - i * 86400000);
      const dStr = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      const tComps = tasks.filter((t) => t.completed && t.completedAt && t.completedAt.split("T")[0] === dStr).length;
      const hComps = completions.filter((c) => c.date === dStr).length;

      monthlyData.push({
        label,
        completed: tComps + hComps,
      });
    }

    return res.json({
      stats: {
        totalTasks,
        completedTasks,
        pendingTasks,
        completionRate,
        currentStreak: user?.streak || 0,
        longestStreak: user?.longestStreak || 0,
        score: user?.score || 0,
      },
      categories: categoryCounts,
      weekly: weeklyData,
      monthly: monthlyData,
    });
  } catch (error) {
    return res.status(500).json({ error: "Server error fetching stats data." });
  }
});

/* =========================================
   VITE LAYER INTEGRATION middleware routing
========================================= */

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Productivity Tracker Pro service running at http://localhost:${PORT}`);
  });
}

startServer();
