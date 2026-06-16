import { useMemo } from "react";
import { useHabits } from "@/lib/supabase-hooks";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import HabitMomentumHeader from "@/components/habits/HabitMomentumHeader";
import AddHabitDrawer from "@/components/habits/AddHabitDrawer";
import HabitCalendarTab from "@/components/habits/HabitCalendarTab";
import { usePremium, FREE_HABIT_LIMIT } from "@/lib/use-premium";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useState } from "react";

export default function Habits() {
  const { user } = useAuth();
  const { habits, isLoading, addHabit, toggleHabit } = useHabits();
  const { isPremium } = usePremium();
  const [showUpgrade, setShowUpgrade] = useState(false);

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

  const handleAdd = (habit: any) => {
    if (!isPremium && habits.length >= FREE_HABIT_LIMIT) {
      setShowUpgrade(true);
      return;
    }
    addHabit({
      name: habit.name,
      icon: habit.icon,
      target: habit.target,
      difficulty: habit.difficulty,
      ...({ priority: habit.priority, reminder_enabled: habit.reminder_enabled, reminder_time: habit.reminder_time, reminder_days: habit.reminder_days } as any),
    });
  };

  // Memo not strictly needed but keeps reference stable
  useMemo(() => habits.length, [habits]);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-lg mx-auto px-5 pt-4">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-80 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-5 pb-32 space-y-8">
      <HabitMomentumHeader />
      <HabitCalendarTab
        habits={habits as any}
        completions={completions}
        onToggle={(h) => toggleHabit(h as any)}
      />
      <AddHabitDrawer onAdd={handleAdd} />
      <UpgradeModal
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        featureName="Unlimited Habits"
        reason={`Free plan is limited to ${FREE_HABIT_LIMIT} habits. Upgrade to Premium to track as many as you want.`}
      />
    </div>
  );
}
