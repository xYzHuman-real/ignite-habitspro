import { motion } from "framer-motion";
import { Flame, Target, CheckCircle2, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { defaultHabits, defaultTodos } from "@/lib/store";

const stats = [
  { label: "Current Streak", value: "52", icon: Flame, gradient: "bg-gradient-accent", glow: "shadow-glow-accent" },
  { label: "Habits Today", value: "2/5", icon: Target, gradient: "bg-gradient-primary", glow: "shadow-glow-primary" },
  { label: "Tasks Done", value: "1/5", icon: CheckCircle2, gradient: "bg-gradient-success", glow: "" },
  { label: "Weekly Score", value: "87%", icon: TrendingUp, gradient: "bg-gradient-primary", glow: "shadow-glow-primary" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Dashboard() {
  const completedHabits = defaultHabits.filter((h) => h.completedToday).length;
  const completedTodos = defaultTodos.filter((t) => t.completed).length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-5xl mx-auto">
      <motion.div variants={item}>
        <h1 className="text-3xl font-display font-bold">
          Good morning, Alex! <span className="inline-block animate-streak-fire">🔥</span>
        </h1>
        <p className="text-muted-foreground mt-1">Keep your momentum going. You're on a 52-day streak!</p>
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
          {defaultHabits.map((habit) => (
            <div key={habit.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{habit.icon}</span>
                <div>
                  <p className={`text-sm font-medium ${habit.completedToday ? "line-through text-muted-foreground" : ""}`}>
                    {habit.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{habit.streak} day streak</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={(habit.current / habit.target) * 100} className="w-16 h-2" />
                {habit.completedToday && <CheckCircle2 className="h-4 w-4 text-success" />}
              </div>
            </div>
          ))}
        </Card>

        <Card className="p-5 space-y-4">
          <h2 className="font-display font-semibold text-lg">To-Do List</h2>
          {defaultTodos.map((todo) => (
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

      <motion.div variants={item}>
        <Card className="p-5">
          <h2 className="font-display font-semibold text-lg mb-3">Weekly Progress</h2>
          <div className="flex gap-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
              const progress = [100, 80, 100, 60, 90, 40, 0][i];
              const isToday = i === 6;
              return (
                <div key={day} className="flex-1 text-center">
                  <div className="h-24 bg-muted rounded-lg relative overflow-hidden mb-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${progress}%` }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                      className={`absolute bottom-0 w-full rounded-lg ${progress === 100 ? "bg-gradient-success" : "bg-gradient-primary"}`}
                    />
                  </div>
                  <span className={`text-xs ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>{day}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
