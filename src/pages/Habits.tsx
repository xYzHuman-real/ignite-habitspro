import { motion, AnimatePresence } from "framer-motion";
import { Plus, Flame, Check, Trash2, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { useHabits } from "@/lib/supabase-hooks";
import { Skeleton } from "@/components/ui/skeleton";

const TEMPLATES = [
  { name: "Morning Routine", icon: "🌅", target: 1, difficulty: "medium" },
  { name: "Study Session", icon: "📚", target: 1, difficulty: "hard" },
  { name: "Exercise", icon: "💪", target: 1, difficulty: "medium" },
  { name: "Meditation", icon: "🧘", target: 1, difficulty: "easy" },
  { name: "Water Intake", icon: "💧", target: 8, difficulty: "easy" },
  { name: "Reading", icon: "📖", target: 1, difficulty: "easy" },
  { name: "Journaling", icon: "📝", target: 1, difficulty: "easy" },
  { name: "No Social Media", icon: "📵", target: 1, difficulty: "hard" },
];

export default function Habits() {
  const { habits, isLoading, addHabit, toggleHabit, deleteHabit } = useHabits();
  const [newHabit, setNewHabit] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [dialogOpen, setDialogOpen] = useState(false);

  const [customTarget, setCustomTarget] = useState(1);

  const handleAdd = () => {
    if (!newHabit.trim()) return;
    const emojis = ["🎯", "⚡", "🌟", "🎨", "🎵", "🏃", "🍎"];
    addHabit({
      name: newHabit,
      icon: emojis[Math.floor(Math.random() * emojis.length)],
      target: customTarget,
      difficulty,
    });
    setNewHabit("");
    setCustomTarget(1);
    setDialogOpen(false);
  };

  const handleTemplate = (t: typeof TEMPLATES[0]) => {
    addHabit(t);
    setDialogOpen(false);
  };

  const totalCompleted = habits.filter((h) => h.completed_today).length;
  const allCompleted = totalCompleted === habits.length && habits.length > 0;

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <Skeleton className="h-12 w-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Habits</h1>
          <p className="text-muted-foreground">
            {totalCompleted}/{habits.length} completed today
            {allCompleted && habits.length > 0 && " — Streak +1! 🔥"}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary shadow-glow-primary text-primary-foreground">
              <Plus className="h-4 w-4 mr-1" /> Add Habit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">New Habit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Drink water"
                  value={newHabit}
                  onChange={(e) => setNewHabit(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  className="flex-1"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Daily Target</label>
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    value={customTarget}
                    onChange={(e) => setCustomTarget(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Difficulty</label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAdd} className="w-full bg-gradient-primary text-primary-foreground">Add Custom Habit</Button>

              <div className="border-t pt-3">
                <p className="text-sm font-medium text-muted-foreground mb-2">Or use a template:</p>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATES.map((t) => (
                    <Button key={t.name} variant="outline" size="sm" onClick={() => handleTemplate(t)} className="justify-start gap-2 text-xs">
                      <span>{t.icon}</span> {t.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {allCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl bg-gradient-accent text-accent-foreground text-center font-display font-semibold shadow-glow-accent"
        >
          🎉 All habits completed! Daily streak increased!
        </motion.div>
      )}

      {habits.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No habits yet. Tap "Add Habit" to start building your routine! 🌱</p>
        </Card>
      )}

      <div className="space-y-3">
        <AnimatePresence>
          {habits.map((habit) => (
            <motion.div
              key={habit.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
            >
              <Card
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  habit.completed_today ? "border-success/30 bg-success/5" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl cursor-pointer" onClick={() => toggleHabit(habit)}>{habit.icon}</span>
                  <div className="flex-1 min-w-0" onClick={() => toggleHabit(habit)}>
                    <div className="flex items-center gap-2">
                      <p className={`font-medium ${habit.completed_today ? "line-through text-muted-foreground" : ""}`}>
                        {habit.name}
                      </p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        habit.difficulty === "hard" ? "bg-destructive/10 text-destructive" :
                        habit.difficulty === "easy" ? "bg-success/10 text-success" :
                        "bg-accent/30 text-accent-foreground"
                      }`}>{habit.difficulty}</span>
                      <div className="flex items-center gap-1 text-xs text-streak-foreground bg-streak/20 px-2 py-0.5 rounded-full">
                        <Flame className="h-3 w-3 text-primary" />
                        {habit.streak}
                      </div>
                    </div>
                    <Progress value={(habit.current / habit.target) * 100} className="h-1.5 mt-2" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      onClick={() => toggleHabit(habit)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        habit.completed_today
                          ? "bg-success text-success-foreground"
                          : "border-2 border-muted-foreground/30"
                      }`}
                    >
                      {habit.completed_today && <Check className="h-4 w-4" />}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteHabit(habit.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
