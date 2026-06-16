import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

interface Habit {
  id: string;
  name: string;
  icon: string;
  completed_today: boolean;
  current: number;
  target: number;
  priority: string;
}

interface HabitCalendarTabProps {
  habits: Habit[];
  completions: Array<{ completed_date: string; habit_id: string }>;
  onToggle: (habit: Habit) => void;
}

const TOP_N = 5;

export default function HabitCalendarTab({ habits, completions, onToggle }: HabitCalendarTabProps) {
  const [viewDate, setViewDate] = useState(new Date());
  const [showAll, setShowAll] = useState(false);
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
  const dayPct = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

  // Split into completed + remaining; top N preferences remaining first
  const remaining = selectedHabits.filter((h) => !h.completed_today);
  const completedList = selectedHabits.filter((h) => h.completed_today);
  const ordered = [...remaining, ...completedList];
  const visible = showAll ? ordered : ordered.slice(0, TOP_N);
  const hasMore = ordered.length > TOP_N;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const selectedLabel = isToday
    ? "Today"
    : new Date(selectedDate + "T12:00:00").toLocaleDateString("default", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });

  return (
    <div className="space-y-8">
      {/* Calendar hero */}
      <section className="rounded-3xl bg-card border border-border/60 px-4 pt-4 pb-5">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={prevMonth}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted/60 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <h2 className="text-[15px] font-display font-semibold text-foreground tracking-tight">
            {monthName}
          </h2>
          <button
            onClick={nextMonth}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted/60 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div
              key={i}
              className="text-[10px] font-medium text-muted-foreground/70 text-center py-1.5 uppercase tracking-wider"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} aria-hidden />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const completedCount = completionMap.get(dateStr)?.size || 0;
            const total = totalHabits || 1;
            const pct = completedCount / total;
            const isSelected = dateStr === selectedDate;
            const isTodayCell = dateStr === todayStr;
            const isFull = pct >= 1 && completedCount > 0;

            return (
              <button
                key={i}
                onClick={() => {
                  setSelectedDate(dateStr);
                  setShowAll(false);
                }}
                className="relative aspect-square flex flex-col items-center justify-center group"
              >
                {/* Selected ring */}
                {isSelected && (
                  <motion.span
                    layoutId="calSelected"
                    className="absolute inset-1 rounded-full bg-[#F97316]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                {/* Full-day fill (when not selected) */}
                {isFull && !isSelected && (
                  <span className="absolute inset-1.5 rounded-full bg-[#F97316]/12" />
                )}
                <span
                  className={`relative text-[13px] tabular-nums transition-colors ${
                    isSelected
                      ? "text-white font-semibold"
                      : isTodayCell
                      ? "text-[#F97316] font-semibold"
                      : isFull
                      ? "text-foreground font-medium"
                      : "text-foreground/80 font-normal"
                  }`}
                >
                  {day}
                </span>
                {/* Progress dot indicator under the date */}
                {completedCount > 0 && !isFull && !isSelected && (
                  <span
                    className="absolute bottom-1.5 w-1 h-1 rounded-full bg-[#F97316]"
                    style={{ opacity: 0.4 + pct * 0.6 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Selected day */}
      <section>
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex items-baseline justify-between mb-4 px-1">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  {selectedLabel}
                </p>
                <p className="text-[18px] font-display font-semibold text-foreground mt-0.5 tracking-tight">
                  {completedCount} of {totalHabits} complete
                </p>
              </div>
              <span className="text-[15px] font-display font-semibold text-[#F97316] tabular-nums">
                {dayPct}%
              </span>
            </div>

            {selectedHabits.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No habits tracked.</p>
            ) : (
              <ul className="space-y-1">
                {visible.map((h) => (
                  <li
                    key={h.id}
                    className="flex items-center gap-4 px-1 py-3.5 border-b border-border/40 last:border-b-0"
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
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onToggle(h)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          h.completed_today
                            ? "bg-[#F97316] text-white"
                            : "border border-border hover:border-[#F97316]/60"
                        }`}
                        aria-label={h.completed_today ? "Completed" : "Mark complete"}
                      >
                        {h.completed_today && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                      </motion.button>
                    ) : (
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          h.completed_today ? "bg-[#F97316]/15 text-[#F97316]" : "bg-muted/60"
                        }`}
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
                onClick={() => setShowAll((v) => !v)}
                className="mt-4 w-full text-center text-[13px] font-medium text-[#F97316] py-2 hover:opacity-80 transition-opacity"
              >
                {showAll ? "Show less" : `View all ${ordered.length} habits`}
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </section>
    </div>
  );
}
