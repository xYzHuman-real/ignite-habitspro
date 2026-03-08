import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function useGoals() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["goals", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const addGoal = useMutation({
    mutationFn: async (goal: {
      title: string;
      description?: string;
      target_value: number;
      unit: string;
      deadline?: string | null;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("goals").insert({
        ...goal,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals", user?.id] }),
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase.from("goals").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals", user?.id] }),
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals", user?.id] }),
  });

  return {
    goals,
    isLoading,
    addGoal: addGoal.mutate,
    updateGoal: updateGoal.mutate,
    deleteGoal: deleteGoal.mutate,
  };
}

export function useMilestones(goalId: string | null) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: milestones = [] } = useQuery({
    queryKey: ["milestones", goalId],
    queryFn: async () => {
      if (!goalId) return [];
      const { data } = await supabase
        .from("goal_milestones")
        .select("*")
        .eq("goal_id", goalId)
        .order("sort_order");
      return data || [];
    },
    enabled: !!goalId,
  });

  const addMilestone = useMutation({
    mutationFn: async (milestone: { title: string; target_value: number }) => {
      if (!user || !goalId) throw new Error("Not authenticated");
      const { error } = await supabase.from("goal_milestones").insert({
        ...milestone,
        goal_id: goalId,
        user_id: user.id,
        sort_order: milestones.length,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["milestones", goalId] }),
  });

  const toggleMilestone = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase.from("goal_milestones").update({
        completed: !completed,
        completed_at: !completed ? new Date().toISOString() : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["milestones", goalId] }),
  });

  const deleteMilestone = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goal_milestones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["milestones", goalId] }),
  });

  return {
    milestones,
    addMilestone: addMilestone.mutate,
    toggleMilestone: toggleMilestone.mutate,
    deleteMilestone: deleteMilestone.mutate,
  };
}
