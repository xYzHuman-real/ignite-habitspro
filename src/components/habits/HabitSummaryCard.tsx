import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, TrendingUp } from "lucide-react";

interface Props {
  habits: Array<{
    id: string;
    streak: number;
    longest_streak: number;
  }>;
  completions: Array<{ completed_date: string; habit_id: string }>;
}

const SUCCESS = "#22C55E";
const ACCENT = "#F97316";

export default function HabitSummaryCard({ habits, completions }: Props) {
  const today = new Date();
  const todayStr = fmt(today);

  // Build completion map
  const completionMap = useMemo(() => {
    const m = new Map<string, Set<string>>();
    completions.forEach((c) => {
      if (!m.has(c.completed_date)) m.set(c.completed_date, new Set());
      m.get(c.completed_date)!.add(c.habit_id);
    });
    return m;
  }, [completions]);

  const totalHabits = habits.length;

  // Current streak = max streak across habits
  const currentStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    return Math.max(...habits.map((h) => h.streak ?? 0));
  }, [habits]);

  // Longest streak
  const longestStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    return Math.max(...habits.map((h) => h.longest_streak ?? 0));
  }, [habits]);

  // Last 7 days completion rates for mini chart
  const last7Days = useMemo(() => {
    const days: { label: string; pct: number; isToday: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = fmt(d);
      const count = completionMap.get(ds)?.size || 0;
      const pct = totalHabits > 0 ? count / totalHabits : 0;
      days.push({
        label: d.toLocaleDateString("default", { weekday: "narrow" }),
        pct,
        isToday: ds === todayStr,
      });
    }
    return days;
  }, [completionMap, totalHabits, todayStr]);

  // Weekly consistency = average of last 7 days
  const weeklyConsistency = useMemo(() => {
    if (totalHabits === 0) return 0;
    const sum = last7Days.reduce((acc, d) => acc + d.pct, 0);
    return Math.round((sum / 7) * 100);
  }, [last7Days, totalHabits]);

  // Ring progress
  const ringRadius = 42;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (weeklyConsistency / 100) * ringCircumference;

  if (totalHabits === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="rounded-3xl bg-gradient-to-br from-muted/50 to-muted/30 px-6 py-6"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center shrink-0">
            <Flame className="h-6 w-6 text-muted-foreground/40" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-foreground">Start your first habit</p>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Build consistency one day at a time.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="rounded-3xl bg-card border border-border/50 px-5 py-5"
    >
      <div className="flex items-center gap-5">
        {/* Circular consistency ring */}
        <div className="relative shrink-0">
          <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
            {/* Background track */}
            <circle
              cx="48"
              cy="48"
              r={ringRadius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="7"
            />
            {/* Progress ring */}
            <motion.circle
              cx="48"
              cy="48"
              r={ringRadius}
              fill="none"
              stroke={weeklyConsistency >= 80 ? SUCCESS : weeklyConsistency >= 50 ? ACCENT : "#EAB308"}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={ringCircumference}
              initial={{ strokeDashoffset: ringCircumference }}
              animate={{ strokeDashoffset: ringOffset }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[20px] font-bold tabular-nums leading-none">
              {weeklyConsistency}%
            </span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">
              Week
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-[12px] text-muted-foreground font-medium uppercase tracking-wider">
                Current Streak
              </p>
              <p className="text-[22px] font-bold leading-none mt-0.5 tabular-nums">
                {currentStreak}
                <span className="text-[13px] font-medium text-muted-foreground ml-1">days</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-[12px] text-muted-foreground font-medium uppercase tracking-wider">
                Best Streak
              </p>
              <p className="text-[22px] font-bold leading-none mt-0.5 tabular-nums">
                {longestStreak}
                <span className="text-[13px] font-medium text-muted-foreground ml-1">days</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mini 7-day bar chart */}
      <div className="mt-5 pt-4 border-t border-border/40">
        <div className="flex items-end justify-between gap-2 h-10">
          {last7Days.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
              <motion.div
                className="w-full max-w-[18px] rounded-t-md"
                style={{
                  backgroundColor: day.isToday
                    ? weeklyConsistency >= 80
                      ? SUCCESS
                      : ACCENT
                    : day.pct >= 1
                    ? SUCCESS
                    : day.pct > 0
                    ? ACCENT
                    : "hsl(var(--muted))",
                }}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(day.pct * 100, 6)}%` }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: "easeOut" }}
              />
              <span
                className={`text-[10px] font-semibold ${
                  day.isToday ? "text-foreground" : "text-muted-foreground/60"
                }`}
              >
                {day.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function fmt(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
