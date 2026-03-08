import { motion } from "framer-motion";
import { Flame, Target, CheckCircle2, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useHabits, useTodos, useProfile } from "@/lib/supabase-hooks";
import { Skeleton } from "@/components/ui/skeleton";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Dashboard() {
  const { habits, isLoading: habitsLoading } = useHabits();
  const { todos, isLoading: todosLoading } = useTodos();
  const { profile, isLoading: profileLoading } = useProfile();

  const completedHabits = habits.filter((h) => h.completed_today).length;
  const completedTodos = todos.filter((t) => t.completed).length;
  const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);
  const weeklyScore = habits.length > 0 ? Math.round((completedHabits / habits.length) * 100) : 0;

  const displayName = profile?.display_name || "there";

  if (habitsLoading || todosLoading || profileLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Best Streak", value: String(maxStreak), icon: Flame, gradient: "bg-gradient-accent", glow: "shadow-glow-accent" },
    { label: "Habits Today", value: `${completedHabits}/${habits.length}`, icon: Target, gradient: "bg-gradient-primary", glow: "shadow-glow-primary" },
    { label: "Tasks Done", value: `${completedTodos}/${todos.length}`, icon: CheckCircle2, gradient: "bg-gradient-success", glow: "" },
    { label: "Daily Score", value: `${weeklyScore}%`, icon: TrendingUp, gradient: "bg-gradient-primary", glow: "shadow-glow-primary" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-5xl mx-auto">
      <motion.div variants={item}>
        <h1 className="text-3xl font-display font-bold">
          Hey, {displayName}! <span className="inline-block animate-streak-fire">🔥</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          {maxStreak > 0 ? `Keep your momentum going. Best streak: ${maxStreak} days!` : "Start building your streaks today!"}
        </p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className={`p-4 ${s.gradient} ${s.glow} border-0`}>
            <div className="flex items-center gap-2 text-primary-foreground/80 mb-2">
              <s.icon className="h-4 w-4" />
              <span className="text-xs font-medium">{s.label}</span>
            </div>
            <p className="text-2xl font-display font-bold text-primary-foreground">{s.value}</p>
          </Card>
        ))}
      </motion.div>

      <motion.div variants={item} className="grid md:grid-cols-2 gap-6">
        <Card className="p-5 space-y-4">
          <h2 className="font-display font-semibold text-lg">Today's Habits</h2>
          {habits.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No habits yet. Create one to get started!</p>
          ) : habits.map((habit) => (
            <div key={habit.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{habit.icon}</span>
                <div>
                  <p className={`text-sm font-medium ${habit.completed_today ? "line-through text-muted-foreground" : ""}`}>
                    {habit.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{habit.streak} day streak</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={(habit.current / habit.target) * 100} className="w-16 h-2" />
                {habit.completed_today && <CheckCircle2 className="h-4 w-4 text-success" />}
              </div>
            </div>
          ))}
        </Card>

        <Card className="p-5 space-y-4">
          <h2 className="font-display font-semibold text-lg">To-Do List</h2>
          {todos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No tasks yet. Add one to stay productive!</p>
          ) : todos.slice(0, 5).map((todo) => (
            <div key={todo.id} className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                todo.completed ? "bg-success border-success" : "border-muted-foreground"
              }`}>
                {todo.completed && <CheckCircle2 className="h-3 w-3 text-success-foreground" />}
              </div>
              <span className={`text-sm ${todo.completed ? "line-through text-muted-foreground" : ""}`}>
                {todo.text}
              </span>
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                todo.priority === "high" ? "bg-destructive/10 text-destructive" :
                todo.priority === "medium" ? "bg-accent/30 text-accent-foreground" :
                "bg-muted text-muted-foreground"
              }`}>
                {todo.priority}
              </span>
            </div>
          ))}
        </Card>
      </motion.div>
    </motion.div>
  );
}
