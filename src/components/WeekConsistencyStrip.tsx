import { useMemo } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useHabits } from "@/lib/supabase-hooks";

const WEEK = ["S", "M", "T", "W", "T", "F", "S"];

function toLocalDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Apple Fitness-inspired 7-day consistency strip.
 * Shows the last 7 days as small rings: filled (all habits done),
 * partial arc (some done), or hollow (none). Today is highlighted.
 */
export function WeekConsistencyStrip() {
  const { user } = useAuth();
  const { habits } = useHabits();
  const totalHabits = habits.length;

  const days = useMemo(() => {
    const arr: { date: Date; ds: string }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      arr.push({ date: d, ds: toLocalDateStr(d) });
    }
    return arr;
  }, []);

  const { data: completions = [] } = useQuery({
    queryKey: ["week_consistency", user?.id, days[0]?.ds],
    queryFn: async () => {
      if (!user) return [] as { completed_date: string; habit_id: string }[];
      const { data } = await supabase
        .from("habit_completions")
        .select("completed_date, habit_id")
        .eq("user_id", user.id)
        .gte("completed_date", days[0].ds);
      return data || [];
    },
    enabled: !!user,
  });

  const todayStr = toLocalDateStr(new Date());

  // Map date -> unique habits completed that day
  const map = useMemo(() => {
    const m = new Map<string, Set<string>>();
    completions.forEach((c: any) => {
      if (!m.has(c.completed_date)) m.set(c.completed_date, new Set());
      m.get(c.completed_date)!.add(c.habit_id);
    });
    return m;
  }, [completions]);

  const radius = 16;
  const circ = 2 * Math.PI * radius;

  if (totalHabits === 0) return null;

  return (
    <section className="rounded-3xl bg-card border border-border/60 p-5">
      <div className="flex items-baseline justify-between mb-4">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          Last 7 days
        </p>
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {Array.from(map.values()).filter((s) => s.size >= totalHabits).length}/7 perfect
        </p>
      </div>

      <div className="flex items-end justify-between gap-1">
        {days.map(({ date, ds }, i) => {
          const done = map.get(ds)?.size || 0;
          const pct = Math.min(1, done / (totalHabits || 1));
          const isToday = ds === todayStr;
          const isFuture = ds > todayStr;
          const isPerfect = pct >= 1 && done > 0;
          const dash = circ * (1 - pct);

          return (
            <motion.div
              key={ds}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.03, ease: "easeOut" }}
              className="flex flex-col items-center gap-1.5 flex-1"
            >
              <div className="relative w-10 h-10">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 40 40">
                  <circle
                    cx="20"
                    cy="20"
                    r={radius}
                    stroke="hsl(var(--muted))"
                    strokeWidth="3"
                    fill="none"
                  />
                  {!isFuture && pct > 0 && (
                    <motion.circle
                      cx="20"
                      cy="20"
                      r={radius}
                      stroke="hsl(var(--primary))"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={circ}
                      initial={{ strokeDashoffset: circ }}
                      animate={{ strokeDashoffset: dash }}
                      transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.03 }}
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {isPerfect ? (
                    <Check className="h-4 w-4 text-primary" strokeWidth={3} />
                  ) : (
                    <span
                      className={`text-[11px] tabular-nums font-medium ${
                        isToday ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`text-[10px] uppercase tracking-wider ${
                  isToday ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                {WEEK[date.getDay()]}
              </span>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
