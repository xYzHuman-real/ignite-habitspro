import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from "framer-motion";
import { Check, Flame, Bell, Trash2 } from "lucide-react";
import { useState } from "react";

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  very_important: { label: "Very Important", color: "text-destructive", bg: "bg-destructive/10" },
  important: { label: "Important", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30" },
  less_important: { label: "Less Important", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
};

interface Habit {
  id: string;
  name: string;
  icon: string;
  streak: number;
  completed_today: boolean;
  current: number;
  target: number;
  priority: string;
  difficulty: string;
  reminder_enabled: boolean;
  longest_streak: number;
}

interface HabitCardProps {
  habit: Habit;
  onToggle: (habit: Habit) => void;
  onDelete: (id: string) => void;
  isDragging?: boolean;
}

export default function HabitCard({ habit, onToggle, onDelete, isDragging }: HabitCardProps) {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const [swiped, setSwiped] = useState(false);

  const bgOpacity = useTransform(x, [0, 100], [0, 1]);
  const checkScale = useTransform(x, [0, 100], [0.5, 1]);

  const priority = PRIORITY_CONFIG[habit.priority] || PRIORITY_CONFIG.important;

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 100 && !habit.completed_today) {
      setSwiped(true);
      controls.start({ x: 0, transition: { type: "spring", stiffness: 500, damping: 30 } });
      onToggle(habit);
      setTimeout(() => setSwiped(false), 500);
    } else {
      controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 25 } });
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Swipe background */}
      <motion.div
        className="absolute inset-0 bg-success/20 rounded-2xl flex items-center pl-6"
        style={{ opacity: bgOpacity }}
      >
        <motion.div style={{ scale: checkScale }}>
          <Check className="h-6 w-6 text-success" />
        </motion.div>
      </motion.div>

      <motion.div
        style={{ x }}
        animate={controls}
        drag={habit.completed_today ? false : "x"}
        dragConstraints={{ left: 0, right: 120 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        whileTap={isDragging ? { scale: 1.03, boxShadow: "0 8px 30px rgba(0,0,0,0.12)" } : {}}
        className={`relative bg-card rounded-2xl p-4 shadow-sm border border-border/50 transition-all ${
          habit.completed_today ? "opacity-60" : ""
        } ${isDragging ? "z-50" : ""}`}
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <span className="text-2xl">{habit.icon}</span>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`font-medium text-foreground ${habit.completed_today ? "line-through text-muted-foreground" : ""}`}>
                {habit.name}
              </p>
              {habit.reminder_enabled && (
                <Bell className="h-3.5 w-3.5 text-primary/60" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${priority.bg} ${priority.color}`}>
                {priority.label}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Flame className="h-3 w-3 text-primary" />
                {habit.streak}
              </div>
              {habit.target > 1 && (
                <span className="text-[10px] text-muted-foreground">
                  {habit.current}/{habit.target}
                </span>
              )}
            </div>
          </div>

          {/* Completion button */}
          <button
            onClick={() => onToggle(habit)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
              habit.completed_today
                ? "bg-success text-success-foreground shadow-md"
                : "border-2 border-muted-foreground/20 hover:border-primary/50"
            }`}
          >
            {habit.completed_today && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              >
                <Check className="h-5 w-5" />
              </motion.div>
            )}
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(habit.id)}
            className="text-muted-foreground/40 hover:text-destructive transition-colors p-1"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
