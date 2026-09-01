import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type Habit = {
  id: string;
  name: string;
  icon: string;
  target: number;
  current: number;
  completed_today: boolean;
  streak: number;
  longest_streak: number;
  priority?: string;
};

export type Todo = {
  id: string;
  text: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
};

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  return { user, loading };
}

export function useHabits(user: User | null) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) {
      setHabits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase.from("habits").select("*").eq("user_id", user.id).order("sort_order").order("created_at");
    setHabits((data ?? []) as Habit[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

  const toggle = useCallback(async (habit: Habit) => {
    if (!user) return;
    const nextCurrent = habit.completed_today ? 0 : habit.current + 1;
    const nowCompleted = !habit.completed_today && nextCurrent >= habit.target;
    const { error } = await supabase.from("habits").update({
      current: nextCurrent,
      completed_today: nowCompleted,
    }).eq("id", habit.id);
    if (error) throw error;

    if (nowCompleted) {
      const completedDate = new Date().toISOString().slice(0, 10);
      await supabase.from("habit_completions").upsert({
        user_id: user.id,
        habit_id: habit.id,
        completed_date: completedDate,
      }, { onConflict: "habit_id,completed_date" });
    }
    await reload();
  }, [reload, user]);

  return { habits, loading, reload, toggle };
}

export function useTodos(user: User | null) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) {
      setTodos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase.from("todos").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setTodos((data ?? []) as Todo[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

  const add = useCallback(async (text: string) => {
    if (!user || !text.trim()) return;
    const { error } = await supabase.from("todos").insert({ user_id: user.id, text: text.trim(), priority: "medium" });
    if (error) throw error;
    await reload();
  }, [reload, user]);

  const toggle = useCallback(async (todo: Todo) => {
    const { error } = await supabase.from("todos").update({ completed: !todo.completed }).eq("id", todo.id);
    if (error) throw error;
    await reload();
  }, [reload]);

  return { todos, loading, reload, add, toggle };
}
