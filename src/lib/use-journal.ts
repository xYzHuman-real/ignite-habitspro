import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function useJournal(date?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const targetDate = date || new Date().toISOString().split("T")[0];

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["journal", user?.id, targetDate],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .eq("entry_date", targetDate)
        .order("created_at");
      return data || [];
    },
    enabled: !!user,
  });

  const { data: recentEntries = [] } = useQuery({
    queryKey: ["journal_recent", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .is("habit_id", null)
        .order("entry_date", { ascending: false })
        .limit(7);
      return data || [];
    },
    enabled: !!user,
  });

  const saveEntry = useMutation({
    mutationFn: async (entry: {
      mood: string;
      reflection: string;
      wins?: string;
      improvements?: string;
      gratitude?: string;
      habit_id?: string | null;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Upsert based on user_id + entry_date + habit_id
      const { data: existing } = await supabase
        .from("journal_entries")
        .select("id")
        .eq("user_id", user.id)
        .eq("entry_date", targetDate)
        .is("habit_id", entry.habit_id || null)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("journal_entries")
          .update({
            mood: entry.mood,
            reflection: entry.reflection,
            wins: entry.wins || "",
            improvements: entry.improvements || "",
            gratitude: entry.gratitude || "",
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("journal_entries")
          .insert({
            user_id: user.id,
            entry_date: targetDate,
            mood: entry.mood,
            reflection: entry.reflection,
            wins: entry.wins || "",
            improvements: entry.improvements || "",
            gratitude: entry.gratitude || "",
            habit_id: entry.habit_id || null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal", user?.id, targetDate] });
      qc.invalidateQueries({ queryKey: ["journal_recent", user?.id] });
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("journal_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal", user?.id, targetDate] });
      qc.invalidateQueries({ queryKey: ["journal_recent", user?.id] });
    },
  });

  return {
    entries,
    recentEntries,
    isLoading,
    saveEntry: saveEntry.mutate,
    deleteEntry: deleteEntry.mutate,
    isSaving: saveEntry.isPending,
  };
}
