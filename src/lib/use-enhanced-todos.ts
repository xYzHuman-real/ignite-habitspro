import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getLevelForPoints } from "@/lib/xp-levels";

export interface Todo {
  id: string;
  text: string;
  priority: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  due_date: string | null;
  tags: string[];
  notes: string;
  recurring: string;
  sort_order: number;
}

export interface Subtask {
  id: string;
  todo_id: string;
  user_id: string;
  text: string;
  completed: boolean;
  sort_order: number;
  created_at: string;
}

const POINTS_MAP: Record<string, number> = { high: 15, medium: 10, low: 5 };

export function useEnhancedTodos() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: todos = [], isLoading } = useQuery({
    queryKey: ["todos", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("todos")
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      return (data || []) as unknown as Todo[];
    },
    enabled: !!user,
  });

  const { data: subtasks = [] } = useQuery({
    queryKey: ["subtasks", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("subtasks")
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order");
      return (data || []) as unknown as Subtask[];
    },
    enabled: !!user,
  });

  const addTodo = useMutation({
    mutationFn: async (todo: { text: string; priority: string; due_date?: string | null; tags?: string[]; notes?: string; recurring?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("todos").insert({
        text: todo.text,
        priority: todo.priority,
        user_id: user.id,
        due_date: todo.due_date || null,
        tags: todo.tags || [],
        notes: todo.notes || "",
        recurring: todo.recurring || "none",
      } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["todos", user?.id] }),
  });

  const updateTodo = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase.from("todos").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["todos", user?.id] }),
  });

  const toggleTodo = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("todos").update({ completed: !completed } as any).eq("id", id);
      if (error) throw error;

      if (!completed) {
        const todo = todos.find(t => t.id === id);
        const pts = POINTS_MAP[todo?.priority || "medium"] || 10;
        const { data: profile } = await supabase.from("profiles").select("leaderboard_points, coins").eq("user_id", user.id).single();
        if (profile) {
          const newPoints = profile.leaderboard_points + pts;
          const newCoins = (profile.coins || 0) + pts;
          const newLevel = getLevelForPoints(newPoints);
          await supabase.from("profiles").update({
            leaderboard_points: newPoints,
            coins: newCoins,
            xp_level: newLevel.level,
            title: newLevel.title,
          }).eq("user_id", user.id);
        }

        // Handle recurring: create new task if recurring
        if (todo && todo.recurring && todo.recurring !== "none" && todo.due_date) {
          const oldDate = new Date(todo.due_date);
          let newDate = new Date(oldDate);
          if (todo.recurring === "daily") newDate.setDate(newDate.getDate() + 1);
          else if (todo.recurring === "weekly") newDate.setDate(newDate.getDate() + 7);
          else if (todo.recurring === "monthly") newDate.setMonth(newDate.getMonth() + 1);

          await supabase.from("todos").insert({
            text: todo.text,
            priority: todo.priority,
            user_id: user.id,
            due_date: newDate.toISOString(),
            tags: todo.tags,
            notes: todo.notes,
            recurring: todo.recurring,
          } as any);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["todos", user?.id] });
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });

  const deleteTodo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("todos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["todos", user?.id] }),
  });

  // Subtask mutations
  const addSubtask = useMutation({
    mutationFn: async ({ todoId, text }: { todoId: string; text: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("subtasks").insert({
        todo_id: todoId,
        user_id: user.id,
        text,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subtasks", user?.id] }),
  });

  const toggleSubtask = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase.from("subtasks").update({ completed: !completed } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subtasks", user?.id] }),
  });

  const deleteSubtask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subtasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subtasks", user?.id] }),
  });

  const reorderTodos = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      await Promise.all(
        orderedIds.map((id, index) =>
          supabase.from("todos").update({ sort_order: index } as any).eq("id", id)
        )
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["todos", user?.id] }),
  });

  return {
    todos,
    subtasks,
    isLoading,
    addTodo: addTodo.mutate,
    updateTodo: updateTodo.mutate,
    toggleTodo: toggleTodo.mutate,
    deleteTodo: deleteTodo.mutate,
    addSubtask: addSubtask.mutate,
    toggleSubtask: toggleSubtask.mutate,
    deleteSubtask: deleteSubtask.mutate,
    reorderTodos: reorderTodos.mutate,
  };
}
