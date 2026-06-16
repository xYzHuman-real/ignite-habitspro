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
import { usePremium, FREE_HABIT_LIMIT } from "@/lib/use-premium";
import { UpgradeModal } from "@/components/UpgradeModal";

export default function Habits() {
  const { user } = useAuth();
  const { habits, isLoading, addHabit, toggleHabit, deleteHabit } = useHabits();
  const [showList, setShowList] = useState(false);
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

  const sortedHabits = useMemo(() => {
    return [...habits].sort((a, b) => ((a as any).sort_order || 0) - ((b as any).sort_order || 0));
  }, [habits]);

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

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-lg mx-auto px-4 pt-4">
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-72 rounded-3xl" />
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

      {/* Manage list — secondary, collapsible */}
      {habits.length > 0 && (
        <section>
          <button
            onClick={() => setShowList((v) => !v)}
            className="w-full text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            {showList ? "Hide habit list" : "Manage habits"}
          </button>
          <AnimatePresence initial={false}>
            {showList && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="space-y-3 pt-3">
                  {sortedHabits.map((habit) => (
                    <HabitCard
                      key={habit.id}
                      habit={habit as any}
                      onToggle={(h) => toggleHabit(h as any)}
                      onDelete={deleteHabit}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

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
