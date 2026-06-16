import { motion } from "framer-motion";

interface HabitMomentumHeaderProps {
  habits: Array<{ completed_today: boolean; streak: number }>;
  completions: Array<{ completed_date: string; habit_id: string }>;
}

export default function HabitMomentumHeader({ habits }: HabitMomentumHeaderProps) {
  const total = habits.length;
  const completed = habits.filter((h) => h.completed_today).length;
  const remaining = Math.max(total - completed, 0);
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Ring geometry
  const size = 132;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="pt-2">
      <h1 className="text-[28px] font-display font-semibold tracking-tight text-foreground">
        Habits
      </h1>
      <p className="text-[13px] text-muted-foreground mt-0.5">
        {total === 0
          ? "Add your first habit to start tracking."
          : completed === total
          ? "All done for today. Nice work."
          : "Stay consistent — one habit at a time."}
      </p>

      {/* Premium progress block */}
      <div className="mt-6 flex items-center gap-6">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke="hsl(var(--muted))"
              strokeWidth={stroke}
              fill="none"
            />
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke="#F97316"
              strokeWidth={stroke}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={c}
              initial={{ strokeDashoffset: c }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[30px] font-display font-semibold text-foreground tabular-nums leading-none">
              {pct}%
            </span>
            <span className="text-[11px] text-muted-foreground mt-1.5 uppercase tracking-wider">
              Today
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              Completed
            </p>
            <p className="text-[22px] font-display font-semibold text-foreground tabular-nums leading-tight">
              {completed}
            </p>
          </div>
          <div className="h-px bg-border/60" />
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              Remaining
            </p>
            <p className="text-[22px] font-display font-semibold text-foreground tabular-nums leading-tight">
              {remaining}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
