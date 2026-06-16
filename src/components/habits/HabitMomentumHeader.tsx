interface HabitMomentumHeaderProps {
  habits: Array<{ completed_today: boolean; streak: number }>;
  completions: Array<{ completed_date: string; habit_id: string }>;
}

export default function HabitMomentumHeader({ habits }: HabitMomentumHeaderProps) {
  const totalCompleted = habits.filter(h => h.completed_today).length;
  const total = habits.length;
  const maxStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak), 0) : 0;
  const pctToday = total > 0 ? Math.round((totalCompleted / total) * 100) : 0;

  const stats: Array<{ label: string; value: string }> = [
    { label: "Today", value: total > 0 ? `${totalCompleted}/${total}` : "—" },
    { label: "Streak", value: maxStreak > 0 ? `${maxStreak}d` : "—" },
    { label: "Progress", value: `${pctToday}%` },
  ];

  return (
    <div className="pt-2 pb-1">
      <h1 className="text-[28px] font-display font-semibold tracking-tight text-foreground">
        Habits
      </h1>
      <p className="text-[13px] text-muted-foreground mt-0.5">
        {total === 0
          ? "Add your first habit to start tracking."
          : totalCompleted === total
          ? "All done for today. Nice work."
          : `${total - totalCompleted} left for today.`}
      </p>

      <div className="mt-4 flex items-stretch divide-x divide-border/60 rounded-2xl border border-border/60 bg-card">
        {stats.map((s) => (
          <div key={s.label} className="flex-1 px-3 py-3 text-center">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              {s.label}
            </p>
            <p className="mt-1 text-[18px] font-display font-semibold text-foreground tabular-nums">
              {s.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
