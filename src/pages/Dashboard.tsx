import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Check } from "lucide-react";
import { ShareProgress } from "@/components/ShareProgress";
import { useHabits, useTodos, useProfile } from "@/lib/supabase-hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { Onboarding } from "@/components/Onboarding";
import { PremiumStatusBanner } from "@/components/PremiumStatusBanner";
import { AdSlot } from "@/components/AdSlot";
import { useNavigate } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
};
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { habits, isLoading: habitsLoading, toggleHabit } = useHabits();
  const { todos, isLoading: todosLoading } = useTodos();
  const { profile, isLoading: profileLoading } = useProfile();

  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!profileLoading && profile) {
      const seen = localStorage.getItem("onboarding_completed");
      if (!seen && profile.habits_completed === 0) setShowOnboarding(true);
    }
  }, [profileLoading, profile]);

  const completedHabits = habits.filter((h) => h.completed_today).length;
  const totalHabits = habits.length;

  const now = new Date();
  const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const todayTodos = todos.filter((t) => {
    const d = new Date(t.created_at);
    const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return local === todayLocal;
  });
  const completedTodos = todayTodos.filter((t) => t.completed).length;
  const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);
  const pctToday = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

  const displayName = profile?.display_name || "there";

  const hour = now.getHours();
  const greeting = hour < 5 ? "Good night" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const nextHabits = habits.filter((h) => !h.completed_today).slice(0, 3);
  const nextTasks = todayTodos.filter((t) => !t.completed).slice(0, 3);

  // Ring math
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * (1 - pctToday / 100);

  if (habitsLoading || todosLoading || profileLoading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto px-1">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-36 rounded-3xl" />
        <Skeleton className="h-40 rounded-3xl" />
      </div>
    );
  }

  return (
    <>
      {showOnboarding && (
        <Onboarding displayName={displayName} onComplete={() => { localStorage.setItem("onboarding_completed", "true"); setShowOnboarding(false); }} />
      )}

      <motion.div variants={container} initial="hidden" animate="show" className="max-w-2xl mx-auto space-y-7">
        {/* Greeting — no card */}
        <motion.div variants={fadeUp} className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[28px] leading-tight font-display font-semibold tracking-tight text-foreground">
              {greeting}, {displayName}.
            </h1>
            <p className="text-[14px] text-muted-foreground mt-1">
              {totalHabits === 0
                ? "Add a habit to start your day."
                : completedHabits === totalHabits
                ? "All habits done. Beautiful."
                : `${completedHabits} of ${totalHabits} habits done today.`}
            </p>
          </div>
          <ShareProgress
            displayName={displayName}
            streak={maxStreak}
            habitsCompleted={completedHabits}
            totalHabits={totalHabits}
            dailyScore={pctToday}
            level={profile?.xp_level || 1}
            points={profile?.leaderboard_points || 0}
          />
        </motion.div>

        <motion.div variants={fadeUp}>
          <PremiumStatusBanner />
        </motion.div>

        {/* Today's progress — single calm card */}
        <motion.section variants={fadeUp} className="rounded-3xl bg-card border border-border/60 p-5">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Today</p>
          <div className="mt-2 flex items-center justify-between gap-5">
            <div>
              <p className="text-[40px] font-display font-semibold leading-none tabular-nums text-foreground">
                {pctToday}%
              </p>
              <p className="text-[13px] text-muted-foreground mt-1.5">
                {completedHabits}/{totalHabits} habits · {completedTodos}/{todayTodos.length} tasks
              </p>
            </div>

            <div className="relative w-[96px] h-[96px] shrink-0">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r={radius} stroke="hsl(var(--muted))" strokeWidth="6" fill="none" />
                <motion.circle
                  cx="48" cy="48" r={radius}
                  stroke="hsl(var(--primary))" strokeWidth="6" fill="none" strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: dash }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Flame className="h-4 w-4 text-primary" />
                <span className="text-[15px] font-display font-semibold tabular-nums mt-0.5">
                  {maxStreak}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">streak</span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Up next */}
        {(nextHabits.length > 0 || nextTasks.length > 0) && (
          <motion.section variants={fadeUp}>
            <div className="flex items-baseline justify-between mb-2 px-1">
              <h2 className="text-[13px] uppercase tracking-wider font-medium text-muted-foreground">Up next</h2>
              <button
                onClick={() => navigate(nextHabits.length > 0 ? "/habits" : "/todos")}
                className="text-[12px] text-primary font-medium"
              >
                View all
              </button>
            </div>
            <div className="rounded-3xl bg-card border border-border/60 divide-y divide-border/60 overflow-hidden">
              {nextHabits.map((h) => (
                <button
                  key={`h-${h.id}`}
                  onClick={() => toggleHabit(h as any)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/40 transition-colors"
                >
                  <span className="text-[20px] w-6 text-center">{h.icon}</span>
                  <span className="flex-1 text-[15px] text-foreground truncate">{h.name}</span>
                  {h.streak > 0 && (
                    <span className="text-[12px] text-muted-foreground tabular-nums inline-flex items-center gap-1">
                      <Flame className="h-3 w-3 text-primary" />
                      {h.streak}
                    </span>
                  )}
                  <span className="w-7 h-7 rounded-full border border-border flex items-center justify-center" />
                </button>
              ))}
              {nextTasks.map((t) => (
                <div
                  key={`t-${t.id}`}
                  className="w-full flex items-center gap-3 px-4 py-3.5"
                >
                  <span className="w-6 text-center text-muted-foreground">
                    <Check className="h-4 w-4 opacity-0" />
                  </span>
                  <span className="flex-1 text-[15px] text-foreground truncate">{t.text}</span>
                  <span className="text-[11px] text-muted-foreground capitalize">{t.priority}</span>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Quiet ad slot */}
        <motion.div variants={fadeUp}>
          <AdSlot slotId="dashboard-bottom" size="banner" />
        </motion.div>
      </motion.div>
    </>
  );
}
