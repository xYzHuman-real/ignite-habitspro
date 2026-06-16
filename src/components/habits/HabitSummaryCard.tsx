import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Trophy } from "lucide-react";

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
const GOLD = "#F59E0B";

export default function HabitSummaryCard({ habits, completions }: Props) {
  const today = new Date();
  const todayStr = fmt(today);

  const completionMap = useMemo(() => {
    const m = new Map<string, Set<string>>();
    completions.forEach((c) => {
      if (!m.has(c.completed_date)) m.set(c.completed_date, new Set());
      m.get(c.completed_date)!.add(c.habit_id);
    });
    return m;
  }, [completions]);

  const totalHabits = habits.length;

  const currentStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    return Math.max(...habits.map((h) => h.streak ?? 0));
  }, [habits]);

  const longestStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    return Math.max(...habits.map((h) => h.longest_streak ?? 0));
  }, [habits]);

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

  const weeklyConsistency = useMemo(() => {
    if (totalHabits === 0) return 0;
    const sum = last7Days.reduce((acc, d) => acc + d.pct, 0);
    return Math.round((sum / 7) * 100);
  }, [last7Days, totalHabits]);

  const ringRadius = 52;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (weeklyConsistency / 100) * ringCircumference;
  const ringColor = weeklyConsistency >= 80 ? SUCCESS : weeklyConsistency >= 50 ? ACCENT : GOLD;

  if (totalHabits === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="rounded-3xl bg-gradient-to-br from-orange-50/60 to-amber-50/40 dark:from-orange-950/20 dark:to-amber-950/10 border border-orange-100/60 dark:border-orange-900/20 px-6 py-7"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-100/80 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
            <Flame className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <p className="text-[16px] font-semibold text-foreground">Start your first habit</p>
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
      className="rounded-3xl bg-gradient-to-br from-card to-muted/30 border border-border/40 px-6 py-6"
    >
      <div className="flex items-center gap-6">
        {/* Circular consistency ring — larger and more prominent */}
        <div className="relative shrink-0">
          <svg width="116" height="116" viewBox="0 0 116 116" className="-rotate-90">
            {/* Background track */}
            <circle
              cx="58"
              cy="58"
              r={ringRadius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
              opacity="0.5"
            />
            {/* Progress ring */}
            <motion.circle
              cx="58"
              cy="58"
              r={ringRadius}
              fill="none"
              stroke={ringColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={ringCircumference}
              initial={{ strokeDashoffset: ringCircumference }}
              animate={{ strokeDashoffset: ringOffset }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-[24px] font-bold tabular-nums leading-none"
              style={{ color: ringColor }}
            >
              {weeklyConsistency}%
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mt-1">
              This Week
            </span>
          </div>
        </div>

        {/* Stats — cleaner vertical layout */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3.5">
            <div
              className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${ACCENT}15` }}
            >
              <Flame className="h-5 w-5" style={{ color: ACCENT }} />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-[0.12em]">
                Current Streak
              </p>
              <p className="text-[26px] font-bold leading-none mt-0.5 tabular-nums tracking-tight">
                {currentStreak}
                <span className="text-[13px] font-medium text-muted-foreground ml-1.5">days</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div
              className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${SUCCESS}12` }}
            >
              <Trophy className="h-5 w-5" style={{ color: SUCCESS }} />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-[0.12em]">
                Best Streak
              </p>
              <p className="text-[26px] font-bold leading-none mt-0.5 tabular-nums tracking-tight">
                {longestStreak}
                <span className="text-[13px] font-medium text-muted-foreground ml-1.5">days</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mini 7-day bar chart */}
      <div className="mt-6 pt-5 border-t border-border/30">
        <div className="flex items-end justify-between gap-3 h-12">
          {last7Days.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-1">
              <motion.div
                className="w-full max-w-[22px] rounded-[6px]"
                style={{
                  backgroundColor: day.isToday
                    ? ringColor
                    : day.pct >= 1
                    ? SUCCESS
                    : day.pct > 0
                    ? ACCENT
                    : "hsl(var(--muted))",
                  opacity: day.pct === 0 && !day.isToday ? 0.4 : 1,
                }}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(day.pct * 100, 8)}%` }}
                transition={{ duration: 0.6, delay: i * 0.06, ease: "easeOut" }}
              />
              <span
                className={`text-[11px] font-bold ${
                  day.isToday ? "text-foreground" : "text-muted-foreground/50"
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
