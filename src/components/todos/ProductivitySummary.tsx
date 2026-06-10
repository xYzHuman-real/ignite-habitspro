import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, Zap, TrendingUp } from "lucide-react";
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
    const pct = todos.length > 0 ? Math.round((completedToday.length / Math.max(todayTodos.length, completedToday.length, 1)) * 100) : 0;
    const xpEarned = completedToday.reduce((sum, t) => sum + (POINTS_MAP[t.priority] || 10), 0);
    return { completed: completedToday.length, pending: pending.length, pct: Math.min(pct, 100), xpEarned };
  }, [todos]);

  const items = [
    { icon: CheckCircle, label: "Done", value: String(stats.completed), color: "text-success" },
    { icon: Clock, label: "Pending", value: String(stats.pending), color: "text-teal-500" },
    { icon: TrendingUp, label: "Score", value: `${stats.pct}%`, color: "text-primary" },
    { icon: Zap, label: "XP", value: `+${stats.xpEarned}`, color: "text-accent" },
  ];

  return (
    <div className="bg-card rounded-2xl border border-border/30 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Today</h3>
        <span className="text-xs font-bold text-primary">{stats.pct}%</span>
      </div>
      <Progress value={stats.pct} className="h-1.5 mb-4" />
      <div className="grid grid-cols-4 gap-1">
        {items.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="text-center">
            <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
            <p className="text-sm font-bold text-foreground">{value}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
