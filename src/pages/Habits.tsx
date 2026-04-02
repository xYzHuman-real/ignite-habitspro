import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHabits } from "@/lib/supabase-hooks";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import HabitMomentumHeader from "@/components/habits/HabitMomentumHeader";
import HabitCard from "@/components/habits/HabitCard";
import AddHabitDrawer from "@/components/habits/AddHabitDrawer";
import HabitCalendarTab from "@/components/habits/HabitCalendarTab";

export default function Habits() {
  const { user } = useAuth();
  const { habits, isLoading, addHabit, toggleHabit, deleteHabit, updateHabit } = useHabits();
  const [activeTab, setActiveTab] = useState<"habits" | "calendar">("habits");

  const { data: completions = [] } = useQuery({
    queryKey: ["habit_completions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 35);
      const { data } = await supabase
        .from("habit_completions")
        .select("completed_date, habit_id")
        .eq("user_id", user.id)
        .gte("completed_date", thirtyDaysAgo.toISOString().split("T")[0]);
      return data || [];
    },
    enabled: !!user,
  });

  const sortedHabits = useMemo(() => {
    return [...habits].sort((a, b) => ((a as any).sort_order || 0) - ((b as any).sort_order || 0));
  }, [habits]);

  const handleAdd = (habit: any) => {
    addHabit({
      name: habit.name,
      icon: habit.icon,
      target: habit.target,
      difficulty: habit.difficulty,
      ...({ priority: habit.priority, reminder_enabled: habit.reminder_enabled, reminder_time: habit.reminder_time, reminder_days: habit.reminder_days } as any),
    });
  };

  const totalCompleted = habits.filter(h => h.completed_today).length;
  const allCompleted = totalCompleted === habits.length && habits.length > 0;

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-lg mx-auto px-4 pt-4">
        <Skeleton className="h-32 rounded-2xl" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pb-32 space-y-5">
      <HabitMomentumHeader habits={habits} completions={completions} />

      {/* Tab Switcher */}
      <div className="flex bg-muted rounded-xl p-1">
        {(["habits", "calendar"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-sm font-medium py-2 rounded-lg transition-all capitalize ${
              activeTab === tab
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* All completed banner */}
      <AnimatePresence>
        {allCompleted && activeTab === "habits" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4 rounded-2xl bg-gradient-accent text-accent-foreground text-center font-display font-semibold shadow-glow-accent"
          >
            🎉 All habits completed! Streak +1!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === "habits" ? (
          <motion.div
            key="habits"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            {habits.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">🌱</p>
                <p className="text-muted-foreground text-sm">No habits yet. Tap + to start building your routine!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedHabits.map(habit => (
                  <HabitCard
                    key={habit.id}
                    habit={habit as any}
                    onToggle={(h) => toggleHabit(h as any)}
                    onDelete={deleteHabit}
                  />
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <HabitCalendarTab
            key="calendar"
            habits={habits as any}
            completions={completions}
            onToggle={(h) => toggleHabit(h as any)}
          />
        )}
      </AnimatePresence>

      <AddHabitDrawer onAdd={handleAdd} />
    </div>
  );
}
