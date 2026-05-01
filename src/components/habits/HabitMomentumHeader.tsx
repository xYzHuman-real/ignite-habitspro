import { motion } from "framer-motion";
import { Flame, Target, TrendingUp } from "lucide-react";

interface HabitMomentumHeaderProps {
  habits: Array<{ completed_today: boolean; streak: number }>;
  completions: Array<{ completed_date: string; habit_id: string }>;
}

export default function HabitMomentumHeader({ habits, completions }: HabitMomentumHeaderProps) {
  const totalCompleted = habits.filter(h => h.completed_today).length;
  const total = habits.length;
  const maxStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak), 0) : 0;
  const pctToday = total > 0 ? Math.round((totalCompleted / total) * 100) : 0;

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

  // Progress ring math
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - pctToday / 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl p-5 shadow-xl"
      style={{
        background: "linear-gradient(135deg, #ff6a3d 0%, #ff3d00 100%)",
      }}
    >
      {/* Decorative glow blobs */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-8 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />

      <div className="relative flex items-center justify-between mb-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/80">Today's Momentum</p>
          <h1 className="text-2xl font-display font-bold text-white mt-0.5">
            {totalCompleted}<span className="text-white/70 text-lg font-semibold">/{total}</span>
            <span className="text-white/80 text-sm font-medium ml-2">habits</span>
          </h1>
        </div>

        {/* Progress ring */}
        <div className="relative w-[72px] h-[72px] flex items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r={radius} stroke="rgba(255,255,255,0.2)" strokeWidth="5" fill="none" />
            <motion.circle
              cx="32" cy="32" r={radius}
              stroke="white" strokeWidth="5" fill="none" strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </svg>
          <div className="text-white font-display font-bold text-base">{pctToday}%</div>
        </div>
      </div>

      {/* Stats pills */}
      <div className="relative flex gap-2 mb-4">
        <div className="flex-1 backdrop-blur-md bg-white/15 rounded-xl px-3 py-2 flex items-center gap-2">
          <Flame className="h-4 w-4 text-white" />
          <div>
            <p className="text-[9px] uppercase tracking-wider text-white/70 font-semibold leading-none">Streak</p>
            <p className="text-sm font-bold text-white leading-tight">{maxStreak}d</p>
          </div>
        </div>
        <div className="flex-1 backdrop-blur-md bg-white/15 rounded-xl px-3 py-2 flex items-center gap-2">
          <Target className="h-4 w-4 text-white" />
          <div>
            <p className="text-[9px] uppercase tracking-wider text-white/70 font-semibold leading-none">Done</p>
            <p className="text-sm font-bold text-white leading-tight">{totalCompleted}</p>
          </div>
        </div>
        <div className="flex-1 backdrop-blur-md bg-white/15 rounded-xl px-3 py-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-white" />
          <div>
            <p className="text-[9px] uppercase tracking-wider text-white/70 font-semibold leading-none">Active</p>
            <p className="text-sm font-bold text-white leading-tight">{total}</p>
          </div>
        </div>
      </div>

      {/* 7-day date strip */}
      <div className="relative flex gap-1.5 justify-between">
        {days.map(day => {
          const count = day.isToday ? totalCompleted : (completionsByDate.get(day.date) || 0);
          const pct = total > 0 ? Math.min(count / total, 1) : 0;
          return (
            <div key={day.date} className="flex flex-col items-center flex-1">
              <span className="text-[9px] text-white/70 font-semibold">{day.label}</span>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold mt-1 transition-all ${
                  day.isToday
                    ? "bg-white text-[#ff3d00] shadow-lg ring-2 ring-white/40"
                    : pct >= 1
                    ? "bg-white/30 text-white backdrop-blur-sm"
                    : pct > 0
                    ? "bg-white/15 text-white"
                    : "bg-white/5 text-white/60"
                }`}
              >
                {day.dayNum}
              </div>
              <div className="flex gap-0.5 mt-1">
                {[0.33, 0.66, 1].map((t, i) => (
                  <div
                    key={i}
                    className={`w-1 h-1 rounded-full ${pct >= t ? "bg-white" : "bg-white/25"}`}
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
