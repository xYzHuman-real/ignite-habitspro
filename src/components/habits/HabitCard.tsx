import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from "framer-motion";
import { Check, Flame, Bell, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { hapticLight, hapticSuccess } from "@/lib/haptics";

const PRIORITY_CONFIG: Record<string, { label: string; dot: string; chip: string }> = {
  very_important: { label: "High", dot: "bg-destructive", chip: "bg-destructive/10 text-destructive" },
  important: { label: "Med", dot: "bg-orange-500", chip: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  less_important: { label: "Low", dot: "bg-blue-500", chip: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
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
  const [, setSwiped] = useState(false);

  const bgOpacity = useTransform(x, [0, 100], [0, 1]);
  const checkScale = useTransform(x, [0, 100], [0.5, 1]);

  const priority = PRIORITY_CONFIG[habit.priority] || PRIORITY_CONFIG.important;
  const progressPct = habit.target > 0 ? Math.min((habit.current / habit.target) * 100, 100) : 0;

  const crossed = useRef(false);
  x.on("change", (v) => {
    if (v > 60 && !crossed.current) { crossed.current = true; hapticLight(); }
    else if (v < 40 && crossed.current) { crossed.current = false; }
  });

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 90 && !habit.completed_today) {
      setSwiped(true);
      controls.start({ x: 0, transition: { type: "spring", stiffness: 500, damping: 40 } });
      hapticSuccess();
      onToggle(habit);
      setTimeout(() => setSwiped(false), 200);
    } else {
      controls.start({ x: 0, transition: { type: "spring", stiffness: 500, damping: 40 } });
    }
    crossed.current = false;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Swipe background */}
      <motion.div
        className="absolute inset-0 rounded-2xl flex items-center pl-6"
        style={{
          opacity: bgOpacity,
          background: "linear-gradient(90deg, rgba(34,197,94,0.25) 0%, rgba(34,197,94,0.1) 100%)",
        }}
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
        dragElastic={0.05}
        dragDirectionLock
        onDragEnd={handleDragEnd}
        className={`relative bg-card rounded-2xl p-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)] border border-border/40 transition-all ${
          habit.completed_today ? "opacity-60" : ""
        } ${isDragging ? "z-50 shadow-xl scale-[1.02]" : ""}`}
      >
        <div className="flex items-center gap-3">
          {/* Icon with soft tinted background */}
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0">
            <span className="text-2xl">{habit.icon}</span>
            <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-card ${priority.dot}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className={`font-semibold text-[15px] text-foreground truncate ${habit.completed_today ? "line-through text-muted-foreground" : ""}`}>
                {habit.name}
              </p>
              {habit.reminder_enabled && (
                <Bell className="h-3 w-3 text-primary/60 shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${priority.chip}`}>
                {priority.label}
              </span>
              <div className="flex items-center gap-0.5 text-[11px] text-muted-foreground font-medium">
                <Flame className="h-3 w-3 text-primary" />
                {habit.streak}
              </div>
              {habit.target > 1 && (
                <span className="text-[11px] text-muted-foreground font-medium">
                  {habit.current}/{habit.target}
                </span>
              )}
            </div>
            {/* Mini progress bar for multi-target habits */}
            {habit.target > 1 && (
              <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: "linear-gradient(90deg, #F97316 0%, #EA580C 100%)",
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            )}
          </div>

          {/* Completion button */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => { hapticSuccess(); onToggle(habit); }}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shrink-0 ${
              habit.completed_today
                ? "text-white shadow-md"
                : "border-2 border-muted-foreground/20 hover:border-primary/50"
            }`}
            style={
              habit.completed_today
                ? { background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" }
                : undefined
            }
          >
            {habit.completed_today && <Check className="h-5 w-5" strokeWidth={3} />}
          </motion.button>

          {/* Delete */}
          <button
            onClick={() => onDelete(habit.id)}
            className="text-muted-foreground/30 hover:text-destructive transition-colors p-1 -mr-1"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
