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
  streak?: number;
  longest_streak?: number;
}

interface Props {
  habits: Habit[];
  completions: Array<{ completed_date: string; habit_id: string }>;
  onToggle: (habit: Habit) => void;
}

const ACCENT = "#F97316";
const SUCCESS = "#22C55E";

type View = "week" | "month" | "year";

const fmt = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function HabitCalendarTab({ habits, completions, onToggle }: Props) {
  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(fmt(new Date()));

  const completionMap = useMemo(() => {
    const m = new Map<string, Set<string>>();
    completions.forEach((c) => {
      if (!m.has(c.completed_date)) m.set(c.completed_date, new Set());
      m.get(c.completed_date)!.add(c.habit_id);
    });
    return m;
  }, [completions]);

  const todayStr = fmt(new Date());
  const totalHabits = habits.length;
  const isToday = selectedDate === todayStr;

  const selectedHabits = useMemo(() => {
    if (isToday) return habits;
    const ids = completionMap.get(selectedDate) || new Set();
    return habits.map((h) => ({
      ...h,
      completed_today: ids.has(h.id),
      current: ids.has(h.id) ? h.target : 0,
    }));
  }, [habits, isToday, selectedDate, completionMap]);

  const completedCount = selectedHabits.filter((h) => h.completed_today).length;
  const dayPct = totalHabits ? Math.round((completedCount / totalHabits) * 100) : 0;
  const ordered = [
    ...selectedHabits.filter((h) => !h.completed_today),
    ...selectedHabits.filter((h) => h.completed_today),
  ];

  // ── Week computation (Mon-Sun) ──
  const weekStart = useMemo(() => {
    const d = new Date(anchor);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [anchor]);

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
      }),
    [weekStart]
  );

  // ── Range label ──
  const rangeLabel = useMemo(() => {
    if (view === "week") {
      const end = new Date(weekStart);
      end.setDate(weekStart.getDate() + 6);
      const sameMonth = weekStart.getMonth() === end.getMonth();
      if (sameMonth) {
        return `${weekStart.getDate()} – ${end.getDate()} ${end.toLocaleString("default", {
          month: "short",
          year: "numeric",
        })}`;
      }
      return `${weekStart.toLocaleDateString("default", {
        day: "numeric",
        month: "short",
      })} – ${end.toLocaleDateString("default", { day: "numeric", month: "short", year: "numeric" })}`;
    }
    if (view === "month")
      return anchor.toLocaleString("default", { month: "long", year: "numeric" });
    return String(anchor.getFullYear());
  }, [view, weekStart, anchor]);

  const stepPrev = () => {
    const d = new Date(anchor);
    if (view === "week") d.setDate(d.getDate() - 7);
    else if (view === "month") d.setMonth(d.getMonth() - 1);
    else d.setFullYear(d.getFullYear() - 1);
    setAnchor(d);
  };
  const stepNext = () => {
    const d = new Date(anchor);
    if (view === "week") d.setDate(d.getDate() + 7);
    else if (view === "month") d.setMonth(d.getMonth() + 1);
    else d.setFullYear(d.getFullYear() + 1);
    setAnchor(d);
  };

  const statusFor = (ds: string) => {
    const count = completionMap.get(ds)?.size || 0;
    const t = totalHabits || 1;
    const pct = count / t;
    const isFuture = ds > todayStr;
    return {
      count,
      pct,
      isFuture,
      isComplete: pct >= 1 && count > 0,
      isPartial: pct > 0 && pct < 1,
    };
  };

  return (
    <div className="space-y-6">
      {/* Segmented control */}
      <div className="relative flex bg-muted/60 rounded-full p-1">
        {(["week", "month", "year"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`relative flex-1 text-[13px] font-semibold py-2 rounded-full transition-colors z-10 ${
              view === v ? "" : "text-muted-foreground"
            }`}
            style={view === v ? { color: ACCENT } : undefined}
          >
            {view === v && (
              <motion.span
                layoutId="viewBg"
                className="absolute inset-0 rounded-full bg-card"
                style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              />
            )}
            <span className="relative capitalize">{v}</span>
          </button>
        ))}
      </div>

      {/* Range nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={stepPrev}
          className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-[14px] font-medium text-foreground tracking-tight">{rangeLabel}</span>
        <button
          onClick={stepNext}
          className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Next"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* View */}
      {view === "week" && (
        <WeekStrip
          days={weekDays}
          selectedDate={selectedDate}
          todayStr={todayStr}
          statusFor={statusFor}
          onSelect={(ds) => setSelectedDate(ds)}
        />
      )}
      {view === "month" && (
        <MonthGrid
          anchor={anchor}
          selectedDate={selectedDate}
          todayStr={todayStr}
          statusFor={statusFor}
          onSelect={(ds) => setSelectedDate(ds)}
        />
      )}
      {view === "year" && (
        <YearGrid
          year={anchor.getFullYear()}
          completionMap={completionMap}
          totalHabits={totalHabits}
          todayStr={todayStr}
          onPickMonth={(m) => {
            const d = new Date(anchor.getFullYear(), m, 1);
            setAnchor(d);
            setView("month");
          }}
        />
      )}

      {/* Selected day card */}
      <section className="rounded-3xl bg-card border border-border/60 px-5 pt-5 pb-3">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[17px] font-display font-semibold text-foreground tracking-tight">
              {isToday
                ? "Today"
                : new Date(selectedDate + "T12:00:00").toLocaleDateString("default", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
            </p>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {totalHabits === 0
                ? "No habits yet"
                : `${completedCount} of ${totalHabits} habits completed`}
            </p>
          </div>
          {totalHabits > 0 && <MiniRing pct={dayPct} />}
        </div>

        {totalHabits === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Tap + to add your first habit.</p>
        ) : (
          <ul className="divide-y divide-border/40">
            {ordered.map((h) => (
              <li key={h.id} className="flex items-center gap-4 py-3.5">
                <span className="text-[20px] leading-none w-7 text-center shrink-0">{h.icon}</span>
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
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors"
                    style={
                      h.completed_today
                        ? { backgroundColor: SUCCESS, color: "white" }
                        : { border: "1.5px solid hsl(var(--border))" }
                    }
                    aria-label={h.completed_today ? "Completed" : "Mark complete"}
                  >
                    {h.completed_today && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </motion.button>
                ) : (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={
                      h.completed_today
                        ? { backgroundColor: SUCCESS, color: "white" }
                        : { border: "1.5px solid hsl(var(--border))" }
                    }
                  >
                    {h.completed_today && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ─── Week strip ─── */
function WeekStrip({
  days,
  selectedDate,
  todayStr,
  statusFor,
  onSelect,
}: {
  days: Date[];
  selectedDate: string;
  todayStr: string;
  statusFor: (ds: string) => { count: number; pct: number; isFuture: boolean; isComplete: boolean; isPartial: boolean };
  onSelect: (ds: string) => void;
}) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((d, i) => {
        const ds = fmt(d);
        const s = statusFor(ds);
        const isSelected = ds === selectedDate;
        const isTodayCell = ds === todayStr;
        return (
          <button
            key={i}
            onClick={() => onSelect(ds)}
            className="flex flex-col items-center gap-2 py-1 group"
          >
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider ${
                isSelected ? "text-foreground" : "text-muted-foreground/70"
              }`}
            >
              {d.toLocaleDateString("default", { weekday: "short" })}
            </span>
            <motion.div
              className="relative w-11 h-[68px] rounded-full flex flex-col items-center justify-center gap-2"
              animate={{
                backgroundColor: isSelected ? "#111827" : "rgba(0,0,0,0)",
              }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <span
                className={`text-[15px] font-semibold tabular-nums leading-none ${
                  isSelected
                    ? "text-white"
                    : isTodayCell
                    ? "text-foreground"
                    : "text-foreground/90"
                }`}
              >
                {d.getDate()}
              </span>
              <DayStatus
                isComplete={s.isComplete}
                isPartial={s.isPartial}
                isFuture={s.isFuture}
              />
            </motion.div>
          </button>
        );
      })}
    </div>
  );
}

function DayStatus({
  isComplete,
  isPartial,
  isFuture,
}: {
  isComplete: boolean;
  isPartial: boolean;
  isFuture: boolean;
}) {
  if (isComplete) {
    return (
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center"
        style={{ backgroundColor: SUCCESS }}
      >
        <Check className="h-3 w-3 text-white" strokeWidth={3.5} />
      </span>
    );
  }
  if (isPartial) {
    return (
      <span
        className="w-5 h-5 rounded-full"
        style={{ border: `2px solid ${ACCENT}`, backgroundColor: "transparent" }}
      />
    );
  }
  return (
    <span
      className="w-5 h-5 rounded-full"
      style={{
        border: "1.5px solid hsl(var(--border))",
        opacity: isFuture ? 0.5 : 1,
      }}
    />
  );
}

/* ─── Month grid ─── */
function MonthGrid({
  anchor,
  selectedDate,
  todayStr,
  statusFor,
  onSelect,
}: {
  anchor: Date;
  selectedDate: string;
  todayStr: string;
  statusFor: (ds: string) => { count: number; pct: number; isFuture: boolean; isComplete: boolean; isPartial: boolean };
  onSelect: (ds: string) => void;
}) {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 mb-2">
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
          const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const s = statusFor(ds);
          const isSelected = ds === selectedDate;
          const isTodayCell = ds === todayStr;
          return (
            <button
              key={i}
              onClick={() => onSelect(ds)}
              className="relative aspect-square flex flex-col items-center justify-center"
            >
              {isSelected && (
                <motion.span
                  layoutId="monthSel"
                  className="absolute inset-0 rounded-full bg-foreground"
                  transition={{ duration: 0.18, ease: "easeOut" }}
                />
              )}
              <span
                className={`relative text-[13px] tabular-nums ${
                  isSelected
                    ? "text-background font-semibold"
                    : isTodayCell
                    ? "font-semibold"
                    : "text-foreground/85"
                }`}
                style={!isSelected && isTodayCell ? { color: ACCENT } : undefined}
              >
                {day}
              </span>
              <span className="relative mt-1">
                {s.isComplete ? (
                  <span
                    className="block w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: isSelected ? "white" : SUCCESS }}
                  />
                ) : s.isPartial ? (
                  <span
                    className="block w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: isSelected ? "white" : ACCENT }}
                  />
                ) : (
                  <span className="block w-1.5 h-1.5" />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Year grid ─── */
function YearGrid({
  year,
  completionMap,
  totalHabits,
  todayStr,
  onPickMonth,
}: {
  year: number;
  completionMap: Map<string, Set<string>>;
  totalHabits: number;
  todayStr: string;
  onPickMonth: (m: number) => void;
}) {
  const months = Array.from({ length: 12 }, (_, m) => {
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const now = new Date();
    const isCurrent = year === now.getFullYear() && m === now.getMonth();
    const lastDay = isCurrent ? now.getDate() : daysInMonth;
    let total = 0;
    for (let d = 1; d <= lastDay; d++) {
      const ds = `${year}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      total += completionMap.get(ds)?.size || 0;
    }
    const possible = totalHabits * lastDay;
    const pct = possible > 0 ? total / possible : 0;
    return { m, pct, isPast: ds(year, m + 1, 0) <= todayStr };
  });

  return (
    <div className="grid grid-cols-4 gap-3">
      {months.map(({ m, pct }) => {
        const name = new Date(year, m, 1).toLocaleString("default", { month: "short" });
        return (
          <button
            key={m}
            onClick={() => onPickMonth(m)}
            className="rounded-2xl border border-border/60 p-3 flex flex-col items-center gap-1.5 hover:border-foreground/30 transition-colors"
          >
            <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
              {name}
            </span>
            <span className="text-[16px] font-display font-semibold text-foreground tabular-nums">
              {Math.round(pct * 100)}%
            </span>
            <span className="block w-full h-1 rounded-full bg-muted overflow-hidden">
              <span
                className="block h-full rounded-full"
                style={{ width: `${pct * 100}%`, backgroundColor: ACCENT }}
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}
const ds = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/* ─── Mini ring ─── */
function MiniRing({ pct }: { pct: number }) {
  const size = 44;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--muted))" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={SUCCESS}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-semibold tabular-nums" style={{ color: SUCCESS }}>
          {pct}%
        </span>
      </div>
    </div>
  );
}
