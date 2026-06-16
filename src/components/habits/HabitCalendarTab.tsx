import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Check, Flame, Star, TrendingUp, ArrowRight } from "lucide-react";

interface Habit {
  id: string;
  name: string;
  icon: string;
  completed_today: boolean;
  current: number;
  target: number;
  priority: string;
  streak?: number;
  longest_streak?: number;
}

interface HabitCalendarTabProps {
  habits: Habit[];
  completions: Array<{ completed_date: string; habit_id: string }>;
  onToggle: (habit: Habit) => void;
}

const TOP_N = 5;
const ACCENT = "#F97316";

export default function HabitCalendarTab({ habits, completions, onToggle }: HabitCalendarTabProps) {
  const [viewDate, setViewDate] = useState(new Date());
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleString("default", { month: "long", year: "numeric" });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const completionMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    completions.forEach((c) => {
      if (!map.has(c.completed_date)) map.set(c.completed_date, new Set());
      map.get(c.completed_date)!.add(c.habit_id);
    });
    return map;
  }, [completions]);

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }, []);

  const isToday = selectedDate === todayStr;
  const totalHabits = habits.length;

  // Stats
  const currentStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.streak || 0)) : 0;
  const bestStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.longest_streak || 0)) : 0;
  const monthlyConsistency = useMemo(() => {
    if (totalHabits === 0) return 0;
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;
    const lastDay = isCurrentMonth ? now.getDate() : daysInMonth;
    let total = 0;
    for (let d = 1; d <= lastDay; d++) {
      const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      total += completionMap.get(ds)?.size || 0;
    }
    const possible = totalHabits * lastDay;
    return possible > 0 ? Math.round((total / possible) * 100) : 0;
  }, [completionMap, year, month, daysInMonth, totalHabits]);

  const selectedHabits = useMemo(() => {
    if (isToday) return habits;
    const completedIds = completionMap.get(selectedDate) || new Set();
    return habits.map((h) => ({
      ...h,
      completed_today: completedIds.has(h.id),
      current: completedIds.has(h.id) ? h.target : 0,
    }));
  }, [selectedDate, habits, completionMap, isToday]);

  const completedCount = selectedHabits.filter((h) => h.completed_today).length;

  const remaining = selectedHabits.filter((h) => !h.completed_today);
  const completedList = selectedHabits.filter((h) => h.completed_today);
  const ordered = [...remaining, ...completedList];
  const visible = ordered.slice(0, TOP_N);
  const hasMore = ordered.length > TOP_N;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const selectedLabel = new Date(selectedDate + "T12:00:00").toLocaleDateString("default", {
    month: "long",
    day: "numeric",
  });

  // Heatmap intensity → subtle warm tones
  const dayBg = (pct: number, count: number) => {
    if (count === 0) return "transparent";
    if (pct >= 1) return ACCENT;
    if (pct >= 0.66) return "rgba(249,115,22,0.55)";
    if (pct >= 0.33) return "rgba(249,115,22,0.30)";
    return "rgba(249,115,22,0.14)";
  };

  return (
    <div className="space-y-10">
      {/* ─── HERO CALENDAR ─── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors -ml-2"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <h2 className="text-[17px] font-display font-semibold text-foreground tracking-tight">
            {monthName}
          </h2>
          <button
            onClick={nextMonth}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors -mr-2"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 mb-3">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div
              key={i}
              className="text-[10px] font-medium text-muted-foreground/60 text-center uppercase tracking-[0.12em]"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} aria-hidden />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const count = completionMap.get(dateStr)?.size || 0;
            const total = totalHabits || 1;
            const pct = count / total;
            const isSelected = dateStr === selectedDate;
            const isTodayCell = dateStr === todayStr;
            const bg = dayBg(pct, count);
            const filled = count > 0;
            const isFull = pct >= 1 && count > 0;

            return (
              <button
                key={i}
                onClick={() => {
                  setSelectedDate(dateStr);
                }}
                className="relative aspect-square flex items-center justify-center group"
              >
                <span
                  className="absolute inset-0 rounded-2xl transition-colors"
                  style={{ backgroundColor: bg }}
                />
                {isSelected && (
                  <motion.span
                    layoutId="calSelected"
                    className="absolute inset-0 rounded-2xl ring-[1.5px] ring-foreground/90"
                    transition={{ duration: 0.22, ease: "easeOut" }}
                  />
                )}
                <span
                  className={`relative text-[14px] tabular-nums transition-colors ${
                    isFull
                      ? "text-white font-semibold"
                      : isTodayCell
                      ? "text-foreground font-semibold"
                      : filled
                      ? "text-foreground font-medium"
                      : "text-foreground/70 font-normal"
                  }`}
                >
                  {day}
                </span>
                {isTodayCell && !isFull && !isSelected && (
                  <span
                    className="absolute bottom-1 w-1 h-1 rounded-full"
                    style={{ backgroundColor: ACCENT }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ─── STATS (no cards) ─── */}
      <section className="flex items-center justify-between px-1">
        <Stat icon={<Flame className="h-4 w-4" style={{ color: ACCENT }} />} value={currentStreak} label="Current" suffix={currentStreak === 1 ? "day" : "days"} />
        <div className="w-px h-10 bg-border/50" />
        <Stat icon={<Star className="h-4 w-4 text-muted-foreground" />} value={bestStreak} label="Best" suffix={bestStreak === 1 ? "day" : "days"} />
        <div className="w-px h-10 bg-border/50" />
        <Stat icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} value={monthlyConsistency} label="This month" suffix="%" />
      </section>

      {/* ─── SELECTED DAY ─── */}
      <section>
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="mb-5 px-1">
              <p className="text-[20px] font-display font-semibold text-foreground tracking-tight">
                {isToday ? "Today" : selectedLabel}
              </p>
              <p className="text-[13px] text-muted-foreground mt-1">
                {totalHabits === 0
                  ? "No habits yet."
                  : `${completedCount} of ${totalHabits} habits completed`}
              </p>
            </div>

            {selectedHabits.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">
                Tap + to add your first habit.
              </p>
            ) : (
              <ul>
                {visible.map((h) => (
                  <li
                    key={h.id}
                    className="flex items-center gap-4 px-1 py-4 border-b border-border/40 last:border-b-0"
                  >
                    <span className="text-[20px] leading-none w-6 text-center shrink-0">
                      {h.icon}
                    </span>
                    <span
                      className={`flex-1 text-[15px] truncate ${
                        h.completed_today
                          ? "text-muted-foreground line-through"
                          : "text-foreground font-medium"
                      }`}
                    >
                      {h.name}
                    </span>
                    {isToday ? (
                      <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={() => onToggle(h)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          h.completed_today
                            ? "text-white"
                            : "border border-border hover:border-foreground/40"
                        }`}
                        style={h.completed_today ? { backgroundColor: ACCENT } : undefined}
                        aria-label={h.completed_today ? "Completed" : "Mark complete"}
                      >
                        {h.completed_today && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                      </motion.button>
                    ) : (
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          h.completed_today ? "" : "bg-muted/50"
                        }`}
                        style={h.completed_today ? { backgroundColor: `${ACCENT}26`, color: ACCENT } : undefined}
                      >
                        {h.completed_today && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {hasMore && (
              <button
                onClick={() => navigate("/habits/all")}
                className="mt-5 w-full flex items-center justify-center gap-1.5 text-[13px] font-medium py-2 transition-opacity hover:opacity-70"
                style={{ color: ACCENT }}
              >
                View all habits
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </section>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
  suffix,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  suffix: string;
}) {
  return (
    <div className="flex-1 flex flex-col items-center">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[20px] font-display font-semibold text-foreground tabular-nums leading-none">
          {value}
          <span className="text-[13px] font-medium text-muted-foreground ml-1">{suffix}</span>
        </span>
      </div>
      <span className="text-[11px] text-muted-foreground mt-2 uppercase tracking-[0.1em]">
        {label}
      </span>
    </div>
  );
}
