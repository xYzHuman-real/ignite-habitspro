import { useState, useEffect } from "react";

// Theme
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

// Habits
export interface Habit {
  id: string;
  name: string;
  icon: string;
  streak: number;
  completedToday: boolean;
  history: string[]; // dates completed
  target: number; // daily target count
  current: number;
}

export const defaultHabits: Habit[] = [
  { id: "1", name: "Meditation", icon: "🧘", streak: 12, completedToday: false, history: [], target: 1, current: 0 },
  { id: "2", name: "Exercise", icon: "💪", streak: 7, completedToday: true, history: [], target: 1, current: 1 },
  { id: "3", name: "Reading", icon: "📚", streak: 23, completedToday: false, history: [], target: 1, current: 0 },
  { id: "4", name: "Water Intake", icon: "💧", streak: 5, completedToday: false, history: [], target: 8, current: 3 },
  { id: "5", name: "Journaling", icon: "📝", streak: 15, completedToday: true, history: [], target: 1, current: 1 },
];

// Todos
export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
}

export const defaultTodos: Todo[] = [
  { id: "1", text: "Complete morning routine", completed: true, priority: "high" },
  { id: "2", text: "Review weekly goals", completed: false, priority: "medium" },
  { id: "3", text: "Prepare healthy lunch", completed: false, priority: "low" },
  { id: "4", text: "30 min workout session", completed: false, priority: "high" },
  { id: "5", text: "Read 20 pages", completed: false, priority: "medium" },
];

// Leaderboard
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
  { rank: 4, name: "You", avatar: "YO", streak: 52, points: 8200, habits: 5 },
  { rank: 5, name: "Maya Patel", avatar: "MP", streak: 48, points: 7600, habits: 5 },
  { rank: 6, name: "Chris Wong", avatar: "CW", streak: 41, points: 6900, habits: 4 },
  { rank: 7, name: "Emma Davis", avatar: "ED", streak: 35, points: 5800, habits: 6 },
  { rank: 8, name: "Tom Brooks", avatar: "TB", streak: 28, points: 4500, habits: 3 },
];

// Community
export interface CommunityGroup {
  id: string;
  name: string;
  members: number;
  description: string;
  icon: string;
  joined: boolean;
}

export const communityGroups: CommunityGroup[] = [
  { id: "1", name: "Morning Warriors", members: 2340, description: "Early risers crushing their goals", icon: "🌅", joined: true },
  { id: "2", name: "Fitness Freaks", members: 5120, description: "Daily exercise accountability", icon: "🏋️", joined: true },
  { id: "3", name: "Mindful Minds", members: 1890, description: "Meditation & mental wellness", icon: "🧠", joined: false },
  { id: "4", name: "Book Club", members: 3200, description: "Read together, grow together", icon: "📖", joined: false },
  { id: "5", name: "Hydration Nation", members: 980, description: "Stay hydrated, stay healthy", icon: "💦", joined: true },
  { id: "6", name: "Code & Create", members: 4100, description: "Build coding habits daily", icon: "💻", joined: false },
];

// Profile
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

export const userProfile: UserProfile = {
  name: "Alex Johnson",
  username: "@alexj",
  bio: "Building better habits, one day at a time 🔥",
  avatar: "AJ",
  followers: 284,
  following: 156,
  totalStreak: 52,
  habitsCompleted: 1247,
  joinDate: "Jan 2025",
  badges: [
    { name: "7-Day Streak", icon: "🔥" },
    { name: "30-Day Streak", icon: "⭐" },
    { name: "Early Bird", icon: "🌅" },
    { name: "Hydration Master", icon: "💧" },
    { name: "Social Butterfly", icon: "🦋" },
    { name: "Consistency King", icon: "👑" },
  ],
};
