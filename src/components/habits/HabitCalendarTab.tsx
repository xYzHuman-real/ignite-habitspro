import { useState, useMemo } from "react";
import { motion } from "framer-motion";
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

export default function HabitCalendarTab({ habits, completions, onToggle }: HabitCalendarTabProps) {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleString("default", { month: "long", year: "numeric" });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  // Build completion map: date -> count
  const completionMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    completions.forEach(c => {
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

  // Get habits for selected date
  const selectedHabits = useMemo(() => {
    if (isToday) return habits;
    const completedIds = completionMap.get(selectedDate) || new Set();
    return habits.map(h => ({
      ...h,
      completed_today: completedIds.has(h.id),
      current: completedIds.has(h.id) ? h.target : 0,
    }));
  }, [selectedDate, habits, completionMap, isToday]);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <h2 className="font-display font-semibold text-foreground">{monthName}</h2>
        <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-[10px] font-medium text-muted-foreground py-1">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const completedHabits = completionMap.get(dateStr)?.size || 0;
          const total = habits.length || 1;
          const pct = completedHabits / total;
          const isSelected = dateStr === selectedDate;
          const isTodayCell = dateStr === todayStr;

          // Royal violet heatmap intensity
          let bg = "bg-muted/40";
          let textColor = "text-muted-foreground";
          if (pct >= 1) { bg = "bg-gradient-to-br from-[#9333ea] to-[#7c3aed]"; textColor = "text-white"; }
          else if (pct >= 0.66) { bg = "bg-[#9333ea]/60"; textColor = "text-white"; }
          else if (pct >= 0.33) { bg = "bg-[#9333ea]/30"; textColor = "text-foreground"; }
          else if (pct > 0) { bg = "bg-[#9333ea]/15"; textColor = "text-foreground"; }

          return (
            <button
              key={i}
              onClick={() => setSelectedDate(dateStr)}
              className={`aspect-square rounded-xl text-xs transition-all flex items-center justify-center ${bg} ${textColor} ${
                isSelected ? "ring-2 ring-[#9333ea] shadow-md scale-105" : ""
              } ${isTodayCell ? "font-bold ring-1 ring-[#9333ea]/40" : "font-medium"}`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Selected day tasks */}
      <div className="space-y-2">
        <h3 className="text-sm font-display font-semibold text-foreground">
          {isToday ? "Today's Habits" : new Date(selectedDate + "T12:00:00").toLocaleDateString("default", { weekday: "long", month: "short", day: "numeric" })}
        </h3>
        {selectedHabits.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No habits tracked</p>
        ) : (
          selectedHabits.map(h => (
            <div
              key={h.id}
              className={`flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 ${h.completed_today ? "opacity-60" : ""}`}
            >
              <span className="text-lg">{h.icon}</span>
              <span className={`flex-1 text-sm font-medium ${h.completed_today ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {h.name}
              </span>
              {isToday ? (
                <button
                  onClick={() => onToggle(h)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    h.completed_today
                      ? "bg-success text-success-foreground"
                      : "border-2 border-muted-foreground/20"
                  }`}
                >
                  {h.completed_today && <Check className="h-3.5 w-3.5" />}
                </button>
              ) : (
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  h.completed_today ? "bg-success text-success-foreground" : "bg-muted"
                }`}>
                  {h.completed_today && <Check className="h-3.5 w-3.5" />}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
