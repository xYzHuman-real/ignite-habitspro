import { motion } from "framer-motion";
import { Flame } from "lucide-react";

interface HabitMomentumHeaderProps {
  habits: Array<{ completed_today: boolean; streak: number }>;
  completions: Array<{ completed_date: string; habit_id: string }>;
}

export default function HabitMomentumHeader({ habits, completions }: HabitMomentumHeaderProps) {
  const totalCompleted = habits.filter(h => h.completed_today).length;
  const total = habits.length;
  const maxStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak), 0) : 0;

  // Build 7-day date strip
  const days: { label: string; date: string; dayNum: number; isToday: boolean }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
    days.push({
      label: dayNames[d.getDay()],
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      dayNum: d.getDate(),
      isToday: i === 0,
    });
  }

  // Count completions per day
  const completionsByDate = new Map<string, number>();
  completions.forEach(c => {
    completionsByDate.set(c.completed_date, (completionsByDate.get(c.completed_date) || 0) + 1);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 shadow-lg"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-display font-bold text-foreground">Today's Momentum</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalCompleted}/{total} habits done
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full">
          <Flame className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary">{maxStreak} day streak</span>
        </div>
      </div>

      {/* 7-day date strip */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {days.map(day => {
          const count = day.isToday ? totalCompleted : (completionsByDate.get(day.date) || 0);
          const pct = total > 0 ? Math.min(count / total, 1) : 0;
          return (
            <div key={day.date} className="flex flex-col items-center min-w-[40px]">
              <span className="text-[10px] text-muted-foreground font-medium">{day.label}</span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold mt-1 transition-colors ${
                  day.isToday
                    ? "bg-primary text-primary-foreground shadow-glow-primary"
                    : pct >= 1
                    ? "bg-success/20 text-success"
                    : pct > 0
                    ? "bg-accent/20 text-accent-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {day.dayNum}
              </div>
              {/* Progress dots */}
              <div className="flex gap-0.5 mt-1.5">
                {[0.33, 0.66, 1].map((threshold, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${
                      pct >= threshold ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
