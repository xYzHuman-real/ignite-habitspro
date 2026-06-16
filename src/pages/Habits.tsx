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
  const { habits, isLoading, addHabit, toggleHabit, deleteHabit, updateHabit } = useHabits();
  const [activeTab, setActiveTab] = useState<"habits" | "calendar">("calendar");
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

      {/* Apple-style segmented control */}
      <div className="relative flex bg-muted rounded-xl p-1">
        {(["calendar", "habits"] as const).map(tab => {
          const label = tab === "calendar" ? "Overview" : "List";
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative flex-1 text-[13px] font-semibold py-2 rounded-lg transition-colors z-10 ${
                activeTab === tab ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="habitTabBg"
                  className="absolute inset-0 rounded-lg bg-card border border-border/60"
                  style={{ boxShadow: "0 1px 3px hsl(220 30% 10% / 0.06)" }}
                  transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
                />
              )}
              <span className="relative">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Subtle all-completed line, no banner */}
      <AnimatePresence>
        {allCompleted && activeTab === "habits" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center text-[13px] text-primary font-medium"
          >
            All habits complete · streak +1
          </motion.p>
        )}
      </AnimatePresence>

      {/* Content — both tabs always mounted for instant switching */}
      <div className="relative">
        <div className={activeTab === "habits" ? "block animate-in fade-in duration-150" : "hidden"}>
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
        </div>
        <div className={activeTab === "calendar" ? "block animate-in fade-in duration-150" : "hidden"}>
          <HabitCalendarTab
            habits={habits as any}
            completions={completions}
            onToggle={(h) => toggleHabit(h as any)}
          />
        </div>
      </div>

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
