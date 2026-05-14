import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ShareProgress } from "@/components/ShareProgress";
import { Skeleton } from "@/components/ui/skeleton";
import { Onboarding } from "@/components/Onboarding";
import { GpaCalculator } from "@/components/GpaCalculator";
import { ExamCountdown } from "@/components/ExamCountdown";
import { useHabits, useTodos, useProfile } from "@/lib/supabase-hooks";
import { useGoals } from "@/lib/use-goals";
import { useWeeklyReport } from "@/lib/use-weekly-report";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  MomentumWidget,
  CurrentStreakWidget,
  QuickStatsWidget,
  HabitsListWidget,
  TodoListWidget,
  ReflectionWidget,
  GoalsWidget,
  StreakFireWidget,
  WeeklyReportWidget,
  ConsistencyWidget,
  StarHabitWidget,
  FocusTimeWidget,
} from "@/components/dashboard/widgets";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } } };

export default function Dashboard() {
  const { user } = useAuth();
  const { habits, isLoading: habitsLoading, toggleHabit } = useHabits();
  const { todos, isLoading: todosLoading } = useTodos();
  const { profile, isLoading: profileLoading } = useProfile();
  const { goals } = useGoals();
  const { data: weekly } = useWeeklyReport();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!profileLoading && profile) {
      const seen = localStorage.getItem("onboarding_completed");
      if (!seen && profile.habits_completed === 0) setShowOnboarding(true);
    }
  }, [profileLoading, profile]);

  // Last 30 days of completions for sparkline + momentum strip
  const { data: completions = [] } = useQuery({
    queryKey: ["dash_completions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const start = new Date();
      start.setDate(start.getDate() - 35);
      const { data } = await supabase
        .from("habit_completions")
        .select("completed_date")
        .eq("user_id", user.id)
        .gte("completed_date", start.toISOString().split("T")[0]);
      return data || [];
    },
    enabled: !!user,
  });

  const completedHabits = habits.filter((h) => h.completed_today).length;

  const now = new Date();
  const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const todayTodos = todos.filter((t) => {
    const d = new Date(t.created_at);
    const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return local === todayLocal;
  });
  const completedTodos = todayTodos.filter((t) => t.completed).length;
  const pendingTodos = todayTodos.length - completedTodos;
  const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);
  const dailyScore = habits.length > 0 ? Math.round((completedHabits / habits.length) * 100) : 0;

  // Sparkline: last 14 days completion counts
  const sparkline: number[] = [];
  const map = new Map<string, number>();
  completions.forEach((c) => map.set(c.completed_date, (map.get(c.completed_date) || 0) + 1));
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    sparkline.push(map.get(k) || 0);
  }

  const displayName = profile?.display_name || "there";
  const xpEarned = (profile as any)?.xp_today || 0;

  if (habitsLoading || todosLoading || profileLoading) {
    return (
      <div className="space-y-3 max-w-lg mx-auto px-1">
        <Skeleton className="h-44 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-20 rounded-3xl" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-3xl" />)}
      </div>
    );
  }

  const weekLabel = weekly
    ? `${new Date(weekly.weekStart).toLocaleDateString("en", { month: "short", day: "numeric" })} – ${new Date(new Date(weekly.weekStart).getTime() + 6 * 86400000).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}`
    : "This week";

  return (
    <>
      {showOnboarding && <Onboarding displayName={displayName} onComplete={() => { localStorage.setItem("onboarding_completed", "true"); setShowOnboarding(false); }} />}

      <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-lg mx-auto space-y-4 pb-10">
        {/* Greeting */}
        <motion.div variants={item} className="flex items-start justify-between px-1 pt-1">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Hey, {displayName}! <span className="inline-block animate-streak-fire">🔥</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {maxStreak > 0 ? `${maxStreak}-day streak — keep going!` : "Start building your streaks today"}
            </p>
          </div>
          <ShareProgress
            displayName={displayName} streak={maxStreak} habitsCompleted={completedHabits}
            totalHabits={habits.length} dailyScore={dailyScore}
            level={profile?.xp_level || 1} points={profile?.leaderboard_points || 0}
          />
        </motion.div>

        <motion.div variants={item}>
          <MomentumWidget totalCompleted={completedHabits} total={habits.length} maxStreak={maxStreak} completions={completions} />
        </motion.div>

        <motion.div variants={item}>
          <CurrentStreakWidget streak={maxStreak} sparkline={sparkline} />
        </motion.div>

        <motion.div variants={item}>
          <QuickStatsWidget done={completedTodos} pending={pendingTodos} score={dailyScore} xp={xpEarned} />
        </motion.div>

        <motion.div variants={item}>
          <HabitsListWidget habits={habits} onToggle={(h) => toggleHabit(h)} />
        </motion.div>

        <motion.div variants={item}>
          <TodoListWidget todos={todayTodos} />
        </motion.div>

        <motion.div variants={item}>
          <ReflectionWidget />
        </motion.div>

        <motion.div variants={item}>
          <GoalsWidget goals={goals} />
        </motion.div>

        <motion.div variants={item}>
          <StreakFireWidget streak={maxStreak} />
        </motion.div>

        <motion.div variants={item}>
          <WeeklyReportWidget
            habitsCompleted={weekly?.totalCompletions ?? 0}
            focusMinutes={weekly?.totalFocusMinutes ?? 0}
            streak={weekly?.bestStreak ?? maxStreak}
            weekLabel={weekLabel}
            dailyBreakdown={weekly?.dailyBreakdown ?? []}
          />
        </motion.div>

        <motion.div variants={item}>
          <ConsistencyWidget activeDays={weekly?.daysActive ?? 0} totalDays={7} />
        </motion.div>

        <motion.div variants={item}>
          <StarHabitWidget habit={weekly?.topHabit ?? null} count={weekly?.topHabit?.count ?? 0} />
        </motion.div>

        <motion.div variants={item}>
          <FocusTimeWidget minutes={weekly?.totalFocusMinutes ?? 0} />
        </motion.div>

        {/* Academic tools tucked at the bottom */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <GpaCalculator />
          <ExamCountdown />
        </motion.div>
      </motion.div>
    </>
  );
}
