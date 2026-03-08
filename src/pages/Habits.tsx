import { motion, AnimatePresence } from "framer-motion";
import { Plus, Flame, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { useHabits, type Habit } from "@/lib/store";

export default function Habits() {
  const [habits, setHabits] = useHabits();
  const [newHabit, setNewHabit] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggleHabit = (id: string) => {
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id
          ? {
              ...h,
              current: h.completedToday ? 0 : h.target,
              completedToday: !h.completedToday,
              streak: !h.completedToday ? h.streak + 1 : Math.max(0, h.streak - 1),
            }
          : h
      )
    );
  };

  const addHabit = () => {
    if (!newHabit.trim()) return;
    const emojis = ["🎯", "⚡", "🌟", "🎨", "🎵", "🏃", "🍎"];
    setHabits((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: newHabit,
        icon: emojis[Math.floor(Math.random() * emojis.length)],
        streak: 0,
        completedToday: false,
        history: [],
        target: 1,
        current: 0,
      },
    ]);
    setNewHabit("");
    setDialogOpen(false);
  };

  const totalCompleted = habits.filter((h) => h.completedToday).length;
  const allCompleted = totalCompleted === habits.length && habits.length > 0;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Habits</h1>
          <p className="text-muted-foreground">
            {totalCompleted}/{habits.length} completed today
            {allCompleted && " — Streak +1! 🔥"}
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
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="e.g., Drink water"
                value={newHabit}
                onChange={(e) => setNewHabit(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addHabit()}
              />
              <Button onClick={addHabit} className="bg-gradient-primary text-primary-foreground">Add</Button>
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
                  habit.completedToday ? "border-success/30 bg-success/5" : ""
                }`}
                onClick={() => toggleHabit(habit.id)}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{habit.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium ${habit.completedToday ? "line-through text-muted-foreground" : ""}`}>
                        {habit.name}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-streak-foreground bg-streak/20 px-2 py-0.5 rounded-full">
                        <Flame className="h-3 w-3 text-primary" />
                        {habit.streak}
                      </div>
                    </div>
                    <Progress value={(habit.current / habit.target) * 100} className="h-1.5 mt-2" />
                  </div>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      habit.completedToday
                        ? "bg-success text-success-foreground"
                        : "border-2 border-muted-foreground/30"
                    }`}
                  >
                    {habit.completedToday && <Check className="h-4 w-4" />}
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
