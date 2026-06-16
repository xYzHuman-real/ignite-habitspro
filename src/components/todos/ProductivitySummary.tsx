import { useMemo } from "react";
import type { Todo } from "@/lib/use-enhanced-todos";

const POINTS_MAP: Record<string, number> = { high: 15, medium: 10, low: 5 };

interface Props {
  todos: Todo[];
}

export function ProductivitySummary({ todos }: Props) {
  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayTodos = todos.filter(t => t.created_at.startsWith(today) || (t.due_date && t.due_date.startsWith(today)));
    const completedToday = todos.filter(t => t.completed && t.updated_at.startsWith(today));
    const pending = todos.filter(t => !t.completed);
    const pct = todos.length > 0
      ? Math.round((completedToday.length / Math.max(todayTodos.length, completedToday.length, 1)) * 100)
      : 0;
    const xpEarned = completedToday.reduce((sum, t) => sum + (POINTS_MAP[t.priority] || 10), 0);
    return { completed: completedToday.length, pending: pending.length, pct: Math.min(pct, 100), xpEarned };
  }, [todos]);

  const items: Array<{ label: string; value: string }> = [
    { label: "Done", value: String(stats.completed) },
    { label: "Pending", value: String(stats.pending) },
    { label: "Score", value: `${stats.pct}%` },
    { label: "XP", value: `+${stats.xpEarned}` },
  ];

  return (
    <div className="flex items-stretch divide-x divide-border/60 rounded-2xl border border-border/60 bg-card">
      {items.map((it) => (
        <div key={it.label} className="flex-1 px-2 py-3 text-center">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{it.label}</p>
          <p className="mt-1 text-[16px] font-display font-semibold text-foreground tabular-nums">{it.value}</p>
        </div>
      ))}
    </div>
  );
}
