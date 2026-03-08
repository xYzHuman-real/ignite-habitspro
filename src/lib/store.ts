import { useState, useEffect, useCallback } from "react";

// ---- localStorage helpers ----
function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---- Theme ----
export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "light" | "dark") || "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  return { theme, toggle };
}

// ---- Daily reset logic ----
function checkAndResetDaily() {
  const today = new Date().toDateString();
  const lastDate = localStorage.getItem("habitflow_last_date");
  if (lastDate !== today) {
    // New day: reset completedToday on habits, keep streaks
    const habits = loadJSON<Habit[]>("habitflow_habits", defaultHabits);
    const resetHabits = habits.map((h) => ({
      ...h,
      completedToday: false,
      current: 0,
    }));
    saveJSON("habitflow_habits", resetHabits);
    localStorage.setItem("habitflow_last_date", today);
  }
}

// ---- Habits ----
export interface Habit {
  id: string;
  name: string;
  icon: string;
  streak: number;
  completedToday: boolean;
  history: string[];
  target: number;
  current: number;
}

export const defaultHabits: Habit[] = [
  { id: "1", name: "Meditation", icon: "🧘", streak: 0, completedToday: false, history: [], target: 1, current: 0 },
  { id: "2", name: "Exercise", icon: "💪", streak: 0, completedToday: false, history: [], target: 1, current: 0 },
  { id: "3", name: "Reading", icon: "📚", streak: 0, completedToday: false, history: [], target: 1, current: 0 },
  { id: "4", name: "Water Intake", icon: "💧", streak: 0, completedToday: false, history: [], target: 8, current: 0 },
  { id: "5", name: "Journaling", icon: "📝", streak: 0, completedToday: false, history: [], target: 1, current: 0 },
];

export function useHabits() {
  checkAndResetDaily();
  const [habits, setHabits] = useState<Habit[]>(() => loadJSON("habitflow_habits", defaultHabits));

  useEffect(() => {
    saveJSON("habitflow_habits", habits);
  }, [habits]);

  return [habits, setHabits] as const;
}

// ---- Todos ----
export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
}

export const defaultTodos: Todo[] = [
  { id: "1", text: "Complete morning routine", completed: false, priority: "high" },
  { id: "2", text: "Review weekly goals", completed: false, priority: "medium" },
  { id: "3", text: "Prepare healthy lunch", completed: false, priority: "low" },
  { id: "4", text: "30 min workout session", completed: false, priority: "high" },
  { id: "5", text: "Read 20 pages", completed: false, priority: "medium" },
];

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(() => loadJSON("habitflow_todos", defaultTodos));

  useEffect(() => {
    saveJSON("habitflow_todos", todos);
  }, [todos]);

  return [todos, setTodos] as const;
}

// ---- Leaderboard ----
export interface LeaderboardUser {
  rank: number;
  name: string;
  avatar: string;
  streak: number;
  points: number;
  habits: number;
}

export const leaderboardData: LeaderboardUser[] = [
  { rank: 1, name: "Sarah Chen", avatar: "SC", streak: 89, points: 12450, habits: 8 },
  { rank: 2, name: "Alex Rivera", avatar: "AR", streak: 72, points: 10830, habits: 6 },
  { rank: 3, name: "Jordan Lee", avatar: "JL", streak: 65, points: 9750, habits: 7 },
  { rank: 4, name: "You", avatar: "YO", streak: 0, points: 0, habits: 5 },
  { rank: 5, name: "Maya Patel", avatar: "MP", streak: 48, points: 7600, habits: 5 },
  { rank: 6, name: "Chris Wong", avatar: "CW", streak: 41, points: 6900, habits: 4 },
  { rank: 7, name: "Emma Davis", avatar: "ED", streak: 35, points: 5800, habits: 6 },
  { rank: 8, name: "Tom Brooks", avatar: "TB", streak: 28, points: 4500, habits: 3 },
];

// ---- Community ----
export interface CommunityGroup {
  id: string;
  name: string;
  members: number;
  description: string;
  icon: string;
  joined: boolean;
}

export const communityGroups: CommunityGroup[] = [
  { id: "1", name: "Morning Warriors", members: 2340, description: "Early risers crushing their goals", icon: "🌅", joined: false },
  { id: "2", name: "Fitness Freaks", members: 5120, description: "Daily exercise accountability", icon: "🏋️", joined: false },
  { id: "3", name: "Mindful Minds", members: 1890, description: "Meditation & mental wellness", icon: "🧠", joined: false },
  { id: "4", name: "Book Club", members: 3200, description: "Read together, grow together", icon: "📖", joined: false },
  { id: "5", name: "Hydration Nation", members: 980, description: "Stay hydrated, stay healthy", icon: "💦", joined: false },
  { id: "6", name: "Code & Create", members: 4100, description: "Build coding habits daily", icon: "💻", joined: false },
];

// ---- Profile ----
export interface UserProfile {
  name: string;
  username: string;
  bio: string;
  avatar: string;
  followers: number;
  following: number;
  totalStreak: number;
  habitsCompleted: number;
  joinDate: string;
  badges: { name: string; icon: string }[];
}

export const defaultProfile: UserProfile = {
  name: "",
  username: "",
  bio: "",
  avatar: "",
  followers: 0,
  following: 0,
  totalStreak: 0,
  habitsCompleted: 0,
  joinDate: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
  badges: [],
};

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile>(() => loadJSON("habitflow_profile", defaultProfile));

  useEffect(() => {
    saveJSON("habitflow_profile", profile);
  }, [profile]);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  return { profile, updateProfile };
}
