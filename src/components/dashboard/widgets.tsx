import { motion } from "framer-motion";
import { Flame, Target, TrendingUp, Clock, CheckCircle2, Zap, Bell, Plus, Sparkles, BarChart3, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ORANGE_GRADIENT = "linear-gradient(135deg, #ff6a3d 0%, #ff3d00 100%)";

// ───────────────────────── Momentum (orange hero) ─────────────────────────
export function MomentumWidget({
  totalCompleted,
  total,
  maxStreak,
  completions,
}: {
  totalCompleted: number;
  total: number;
  maxStreak: number;
  completions: Array<{ completed_date: string }>;
}) {
  const pct = total > 0 ? Math.round((totalCompleted / total) * 100) : 0;
  const radius = 24;
  const c = 2 * Math.PI * radius;
  const offset = c * (1 - pct / 100);

  const days: { label: string; date: string; dayNum: number; isToday: boolean }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dn = ["S", "M", "T", "W", "T", "F", "S"];
    days.push({
      label: dn[d.getDay()],
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      dayNum: d.getDate(),
      isToday: i === 0,
    });
  }
  const map = new Map<string, number>();
  completions.forEach((c) => map.set(c.completed_date, (map.get(c.completed_date) || 0) + 1));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl p-5 shadow-xl text-white"
      style={{ background: ORANGE_GRADIENT }}
    >
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-8 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />

      <div className="relative flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">Today's Momentum</p>
          <h2 className="text-2xl font-display font-bold mt-1">
            {totalCompleted}<span className="text-white/70 text-lg">/{total}</span>
            <span className="text-white/85 text-sm font-medium ml-1.5">habits</span>
          </h2>
        </div>
        <div className="relative w-[60px] h-[60px] flex items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r={radius} stroke="rgba(255,255,255,0.22)" strokeWidth="4" fill="none" />
            <motion.circle
              cx="28" cy="28" r={radius} stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"
              strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </svg>
          <div className="text-white font-display font-bold text-xs">{pct}%</div>
        </div>
      </div>

      <div className="relative grid grid-cols-3 gap-2 mb-4">
        {[
          { icon: Flame, label: "Streak", value: `${maxStreak}d` },
          { icon: Target, label: "Done", value: String(totalCompleted) },
          { icon: TrendingUp, label: "Active", value: String(total) },
        ].map((s) => (
          <div key={s.label} className="backdrop-blur-md bg-white/15 rounded-xl px-2.5 py-2 flex items-center gap-1.5">
            <s.icon className="h-3.5 w-3.5" />
            <div className="leading-none">
              <p className="text-[8px] uppercase tracking-wider text-white/75 font-bold">{s.label}</p>
              <p className="text-sm font-bold mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="relative flex justify-between gap-1">
        {days.map((d) => {
          const count = map.get(d.date) || 0;
          const dpct = total > 0 ? Math.min(count / total, 1) : 0;
          return (
            <div key={d.date} className="flex flex-col items-center flex-1">
              <span className="text-[9px] text-white/75 font-bold">{d.label}</span>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold mt-1 ${
                  d.isToday ? "bg-white text-[#ff3d00] shadow-lg" : dpct >= 1 ? "bg-white/30" : dpct > 0 ? "bg-white/15" : "bg-white/5 text-white/60"
                }`}
              >
                {d.dayNum}
              </div>
              <div className="flex gap-0.5 mt-1">
                {[0.33, 0.66, 1].map((t, i) => (
                  <div key={i} className={`w-1 h-1 rounded-full ${dpct >= t ? "bg-white" : "bg-white/25"}`} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ───────────────────────── Current Streak (white) ─────────────────────────
export function CurrentStreakWidget({ streak, sparkline }: { streak: number; sparkline: number[] }) {
  const max = Math.max(...sparkline, 1);
  const pts = sparkline.map((v, i) => `${(i / (sparkline.length - 1)) * 100},${100 - (v / max) * 80 - 10}`).join(" ");
  const area = `0,100 ${pts} 100,100`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-5 bg-card border border-border/50 shadow-sm"
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Current Streak</p>
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-end gap-2">
          <Flame className="h-9 w-9 text-primary" />
          <div className="leading-none">
            <p className="text-4xl font-display font-bold text-foreground">{streak}</p>
            <p className="text-xs text-muted-foreground mt-1">days</p>
          </div>
        </div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-14 flex-1 max-w-[140px]">
          <defs>
            <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff6a3d" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ff6a3d" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={area} fill="url(#sparkFill)" />
          <polyline points={pts} fill="none" stroke="#ff3d00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {sparkline.length > 0 && (
            <circle
              cx={100}
              cy={100 - (sparkline[sparkline.length - 1] / max) * 80 - 10}
              r="2.5"
              fill="#ff3d00"
            />
          )}
        </svg>
      </div>
      <p className="text-xs font-semibold text-primary mt-2">Keep it up! 🔥</p>
    </motion.div>
  );
}

// ───────────────────────── Quick Stats Row ─────────────────────────
export function QuickStatsWidget({ done, pending, score, xp }: { done: number; pending: number; score: number; xp: number }) {
  const items = [
    { icon: CheckCircle2, value: done, label: "Done", color: "text-success" },
    { icon: Clock, value: pending, label: "Pending", color: "text-primary" },
    { icon: TrendingUp, value: `${score}%`, label: "Score", color: "text-foreground" },
    { icon: Zap, value: `+${xp}`, label: "XP", color: "text-yellow-500" },
  ];
  return (
    <div className="rounded-3xl p-4 bg-card border border-border/50 grid grid-cols-4 gap-2">
      {items.map((s) => (
        <div key={s.label} className="flex flex-col items-center gap-1 text-center">
          <s.icon className={`h-4 w-4 ${s.color}`} />
          <p className="text-base font-display font-bold text-foreground leading-none">{s.value}</p>
          <p className="text-[10px] text-muted-foreground font-medium">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ───────────────────────── Habits Mini List ─────────────────────────
export function HabitsListWidget({ habits, onToggle }: { habits: any[]; onToggle: (h: any) => void }) {
  const navigate = useNavigate();
  const top = habits.slice(0, 3);
  const priorityColor = (p: string) =>
    p === "high" ? "bg-primary/15 text-primary" : p === "medium" ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400" : "bg-muted text-muted-foreground";

  return (
    <div className="rounded-3xl p-4 bg-card border border-border/50 space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground">Habits</p>
        <button onClick={() => navigate("/habits")} className="text-[10px] font-semibold text-primary">View all</button>
      </div>
      {top.length === 0 && <p className="text-xs text-muted-foreground py-3 text-center">No habits yet</p>}
      {top.map((h) => (
        <div key={h.id} className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center text-lg shrink-0">
            <span>{h.icon}</span>
            {!h.completed_today && <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-primary" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-foreground truncate">{h.name}</p>
              {h.reminder_enabled && <Bell className="h-3 w-3 text-muted-foreground shrink-0" />}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${priorityColor((h as any).priority || "low")}`}>
                {((h as any).priority || "low").slice(0, 3).toUpperCase()}
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Flame className="h-2.5 w-2.5" /> {h.streak}
              </span>
            </div>
          </div>
          <button
            onClick={() => onToggle(h)}
            className={`w-6 h-6 rounded-full border-2 transition-all shrink-0 ${
              h.completed_today ? "bg-success border-success" : "border-muted-foreground/40"
            }`}
            aria-label="toggle"
          >
            {h.completed_today && <CheckCircle2 className="w-4 h-4 text-white mx-auto" />}
          </button>
        </div>
      ))}
    </div>
  );
}

// ───────────────────────── To-Do List ─────────────────────────
export function TodoListWidget({ todos }: { todos: any[] }) {
  const navigate = useNavigate();
  const done = todos.filter((t) => t.completed).length;
  const pct = todos.length > 0 ? Math.round((done / todos.length) * 100) : 0;
  const tagColor = (cat?: string) => {
    if (cat === "Work") return "bg-purple-500/15 text-purple-500";
    if (cat === "Study") return "bg-blue-500/15 text-blue-500";
    if (cat === "Health") return "bg-green-500/15 text-green-500";
    return "bg-muted text-muted-foreground";
  };
  return (
    <div onClick={() => navigate("/todos")} className="rounded-3xl p-4 bg-card border border-border/50 space-y-3 cursor-pointer">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground">To-Do List</p>
        <span className="text-[10px] font-semibold text-muted-foreground">{done}/{todos.length} done</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: "easeOut" }}
          className="h-full rounded-full" style={{ background: ORANGE_GRADIENT }}
        />
      </div>
      <p className="text-right text-[10px] font-bold text-primary -mt-1">{pct}%</p>
      <div className="space-y-2">
        {todos.slice(0, 3).map((t) => (
          <div key={t.id} className="flex items-start gap-2.5">
            <div className={`w-4 h-4 rounded-md border-2 mt-0.5 shrink-0 flex items-center justify-center ${
              t.completed ? "bg-success border-success" : "border-muted-foreground/40"
            }`}>
              {t.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${t.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{t.text}</p>
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">📅 Today</span>
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">↻ daily</span>
                {t.category && <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${tagColor(t.category)}`}>{t.category}</span>}
              </div>
            </div>
          </div>
        ))}
        {todos.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No tasks yet</p>}
      </div>
    </div>
  );
}

// ───────────────────────── Daily Reflection ─────────────────────────
const MOODS = [
  { v: "great", icon: "😄", l: "Great" },
  { v: "good", icon: "🙂", l: "Good" },
  { v: "neutral", icon: "😐", l: "Okay" },
  { v: "low", icon: "😔", l: "Low" },
  { v: "bad", icon: "😞", l: "Rough" },
];
export function ReflectionWidget() {
  const navigate = useNavigate();
  return (
    <div className="rounded-3xl p-4 bg-card border border-border/50 space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-foreground">Daily Reflection</p>
      <p className="text-sm text-muted-foreground">How are you feeling?</p>
      <div className="flex justify-between gap-1.5">
        {MOODS.map((m, i) => (
          <button
            key={m.v}
            onClick={() => navigate("/journal")}
            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border transition-all ${
              i === 2 ? "border-primary bg-primary/10" : "border-border hover:bg-muted/40"
            }`}
          >
            <span className="text-xl">{m.icon}</span>
            <span className="text-[9px] font-semibold text-muted-foreground">{m.l}</span>
          </button>
        ))}
      </div>
      <button
        onClick={() => navigate("/journal")}
        className="w-full text-left rounded-xl border border-border bg-muted/30 px-3 py-3"
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Reflection</span>
        </div>
        <p className="text-xs text-muted-foreground">Write about your day…</p>
      </button>
    </div>
  );
}

// ───────────────────────── Goals ─────────────────────────
export function GoalsWidget({ goals }: { goals: any[] }) {
  const navigate = useNavigate();
  const active = goals.filter((g) => !g.completed).length;
  const done = goals.filter((g) => g.completed).length;
  const total = goals.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="rounded-3xl p-4 bg-card border border-border/50 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground">Goals</p>
        <span className="text-[10px] font-bold text-primary">{pct}%</span>
      </div>
      <div className="space-y-2.5">
        {[
          { icon: Target, label: "Active", value: active, max: total || 1, color: "bg-muted-foreground/40" },
          { icon: CheckCircle2, label: "Done", value: done, max: total || 1, color: "bg-success" },
          { icon: Flame, label: "Total", value: total, max: total || 1, color: "" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <s.icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs font-semibold text-foreground w-12">{s.label}</span>
            <span className="text-xs font-bold text-foreground w-4">{s.value}</span>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${(s.value / s.max) * 100}%` }}
                transition={{ duration: 0.7 }}
                className={`h-full rounded-full ${s.color}`}
                style={!s.color ? { background: ORANGE_GRADIENT } : undefined}
              />
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => navigate("/goals")}
        className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-primary py-2 rounded-xl bg-primary/10 hover:bg-primary/15"
      >
        <Plus className="h-3.5 w-3.5" /> New Goal
      </button>
    </div>
  );
}

// ───────────────────────── Streak Fire (orange) ─────────────────────────
export function StreakFireWidget({ streak }: { streak: number }) {
  const days: { label: string; dayNum: number; isToday: boolean }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dn = ["S", "M", "T", "W", "T", "F", "S"];
    days.push({ label: dn[d.getDay()], dayNum: d.getDate(), isToday: i === 0 });
  }
  return (
    <div className="relative overflow-hidden rounded-3xl p-4 text-white shadow-xl" style={{ background: ORANGE_GRADIENT }}>
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex justify-between gap-1 mb-3">
        {days.map((d, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <span className="text-[9px] text-white/75 font-bold">{d.label}</span>
            <div className={`w-6 h-6 rounded-lg mt-1 flex items-center justify-center text-[10px] font-bold ${
              d.isToday ? "bg-white text-[#ff3d00]" : "bg-white/15"
            }`}>{d.dayNum}</div>
          </div>
        ))}
      </div>
      <div className="relative flex items-end justify-between">
        <div>
          <p className="text-4xl font-display font-bold leading-none">{streak}</p>
          <p className="text-sm text-white/85 mt-1">day streak</p>
        </div>
        <div className="text-3xl">🔥</div>
      </div>
    </div>
  );
}

// ───────────────────────── Weekly Report ─────────────────────────
export function WeeklyReportWidget({ habitsCompleted, focusMinutes, streak, weekLabel, dailyBreakdown }: {
  habitsCompleted: number; focusMinutes: number; streak: number; weekLabel: string; dailyBreakdown: { day: string; completions: number }[];
}) {
  const navigate = useNavigate();
  const max = Math.max(...dailyBreakdown.map((d) => d.completions), 1);
  const total = dailyBreakdown.reduce((s, d) => s + d.completions, 0);
  const pct = Math.min(Math.round((total / (dailyBreakdown.length * (habitsCompleted || 1))) * 100), 100);

  return (
    <div onClick={() => navigate("/weekly-report")} className="rounded-3xl p-4 bg-card border border-border/50 space-y-3 cursor-pointer">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-foreground">Weekly Report</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{weekLabel}</p>
        </div>
        <div className="relative w-10 h-10">
          <svg viewBox="0 0 40 40" className="-rotate-90">
            <circle cx="20" cy="20" r="16" stroke="hsl(var(--muted))" strokeWidth="3" fill="none" />
            <circle cx="20" cy="20" r="16" stroke="#ff3d00" strokeWidth="3" fill="none" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 16} strokeDashoffset={2 * Math.PI * 16 * (1 - pct / 100)} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">{pct}%</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Target, label: "Habits", value: habitsCompleted },
          { icon: Clock, label: "Focus", value: `${focusMinutes}m` },
          { icon: Flame, label: "Streak", value: `${streak}d` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-muted/40 px-2 py-2">
            <div className="flex items-center gap-1 text-muted-foreground">
              <s.icon className="h-3 w-3" /><span className="text-[9px] font-bold uppercase">{s.label}</span>
            </div>
            <p className="text-sm font-bold text-foreground mt-1">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="flex items-end justify-between gap-1.5 h-12">
        {dailyBreakdown.map((d, i) => {
          const h = (d.completions / max) * 100;
          const isMax = d.completions === max && max > 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <div
                className={`w-full rounded-md ${isMax ? "" : "bg-muted"}`}
                style={{ height: `${Math.max(h, 6)}%`, ...(isMax ? { background: ORANGE_GRADIENT } : {}) }}
              />
              <span className="text-[8px] text-muted-foreground font-semibold">{d.day.slice(0, 3)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ───────────────────────── Consistency ─────────────────────────
export function ConsistencyWidget({ activeDays, totalDays }: { activeDays: number; totalDays: number }) {
  const pct = totalDays > 0 ? Math.round((activeDays / totalDays) * 100) : 0;
  const r = 32; const c = 2 * Math.PI * r;
  return (
    <div className="rounded-3xl p-4 bg-card border border-border/50 flex items-center gap-3">
      <div className="relative w-20 h-20 shrink-0">
        <svg viewBox="0 0 80 80" className="-rotate-90">
          <circle cx="40" cy="40" r={r} stroke="hsl(var(--muted))" strokeWidth="6" fill="none" />
          <motion.circle cx="40" cy="40" r={r} stroke="#ff3d00" strokeWidth="6" fill="none" strokeLinecap="round"
            strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct / 100) }}
            transition={{ duration: 0.8, ease: "easeOut" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-base font-display font-bold text-foreground">{pct}%</div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground">Consistency</p>
        <p className="text-sm font-semibold text-foreground mt-1">{activeDays}/{totalDays} days active</p>
        <p className="text-[11px] text-muted-foreground mt-1">
          {pct >= 70 ? "Crushing it! 🚀" : pct >= 40 ? "Steady progress." : "Room to improve. Show up more! 📈"}
        </p>
      </div>
    </div>
  );
}

// ───────────────────────── Star Habit ─────────────────────────
export function StarHabitWidget({ habit, count }: { habit: any | null; count: number }) {
  if (!habit) {
    return (
      <div className="rounded-3xl p-4 bg-card border border-border/50">
        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground">Star Habit</p>
        <p className="text-xs text-muted-foreground mt-3">Complete habits this week to see your star.</p>
      </div>
    );
  }
  return (
    <div className="rounded-3xl p-4 bg-card border border-border/50 space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-foreground">Star Habit</p>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">{habit.icon}</div>
        <div>
          <p className="text-base font-display font-bold text-foreground">{habit.name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Completed {count} time{count !== 1 ? "s" : ""} this week</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-primary">
        <Award className="h-3.5 w-3.5" />
        <span className="text-xs font-bold">Current streak: {habit.streak} days</span>
      </div>
    </div>
  );
}

// ───────────────────────── Focus Time (purple) ─────────────────────────
export function FocusTimeWidget({ minutes }: { minutes: number }) {
  const navigate = useNavigate();
  const h = Math.floor(minutes / 60), m = minutes % 60;
  const display = h > 0 ? `${h}h ${m}m` : `${m}m`;
  return (
    <div onClick={() => navigate("/timer")} className="rounded-3xl p-4 bg-purple-500/10 border border-purple-500/20 cursor-pointer">
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-purple-700 dark:text-purple-300">Focus Time</p>
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <Clock className="h-5 w-5 text-purple-600 dark:text-purple-300" />
        </div>
      </div>
      <p className="text-3xl font-display font-bold text-foreground mt-2">{display}</p>
      <p className="text-xs text-muted-foreground mt-1">this week</p>
      <div className="border-t border-purple-500/20 mt-3 pt-3">
        <p className="text-[11px] text-muted-foreground">Best time to focus:</p>
        <p className="text-[11px] font-semibold text-foreground mt-0.5">
          {minutes > 30 ? "Morning peaks 🌅" : "Not enough data yet"}
        </p>
      </div>
    </div>
  );
}
