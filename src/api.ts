const API_URL = ""; // Relative paths will automatically be routed to our Express server

export function setToken(token: string) {
  localStorage.setItem("prod_tracker_token", token);
}

export function getToken(): string | null {
  return localStorage.getItem("prod_tracker_token");
}

export function clearToken() {
  localStorage.removeItem("prod_tracker_token");
}

export function setUserSession(user: any) {
  localStorage.setItem("prod_tracker_user", JSON.stringify(user));
}

export function getUserSession(): any | null {
  const u = localStorage.getItem("prod_tracker_user");
  try {
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
}

export function clearUserSession() {
  localStorage.removeItem("prod_tracker_user");
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({ error: "Unknown API error" }));
    throw new Error(errData.error || `HTTP error! Status: ${response.status}`);
  }

  return response.json();
}

export const Api = {
  auth: {
    login: async (email: string, password: string) => {
      const data = await request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      setUserSession(data.user);
      return data;
    },
    register: async (name: string, email: string, password: string) => {
      const data = await request("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      setToken(data.token);
      setUserSession(data.user);
      return data;
    },
    me: async () => {
      const user = await request("/api/auth/me");
      setUserSession(user);
      return user;
    },
    updateProfile: async (name?: string, profilePic?: string) => {
      const user = await request("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify({ name, profilePic }),
      });
      setUserSession(user);
      return user;
    },
    logout: () => {
      clearToken();
      clearUserSession();
    },
  },
  tasks: {
    getAll: () => request("/api/tasks"),
    create: (data: { title: string; description?: string; category?: string; priority?: string; dueDate?: string; type?: string }) =>
      request("/api/tasks", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request(`/api/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request(`/api/tasks/${id}`, {
        method: "DELETE",
      }),
    clearAll: () =>
      request("/api/tasks/clear-all", {
        method: "POST",
      }),
    import: (tasksArr: any[]) =>
      request("/api/tasks/import", {
        method: "POST",
        body: JSON.stringify({ tasks: tasksArr }),
      }),
  },
  goals: {
    getAll: () => request("/api/goals"),
    create: (data: { title: string; category: string; targetValue: number; currentValue?: number }) =>
      request("/api/goals", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: { currentValue?: number; title?: string; targetValue?: number }) =>
      request(`/api/goals/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request(`/api/goals/${id}`, {
        method: "DELETE",
      }),
  },
  notifications: {
    getAll: () => request("/api/notifications"),
    markRead: (id: string) =>
      request(`/api/notifications/${id}/read`, {
        method: "PUT",
      }),
  },
  analytics: {
    getSummary: () => request("/api/analytics/summary"),
    getCalendar: () => request("/api/analytics/calendar"),
  },
  motivation: {
    getQuote: () => request("/api/motivation"),
  },
};
