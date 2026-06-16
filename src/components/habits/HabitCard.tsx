import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from "framer-motion";
import { Check, Flame, Bell, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { hapticLight, hapticSuccess } from "@/lib/haptics";

const PRIORITY_BAR: Record<string, string> = {
  very_important: "bg-destructive",
  important: "bg-orange-500",
  less_important: "bg-blue-500",
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
  const checkScale = useTransform(x, [0, 100], [0.6, 1]);

  const barColor = PRIORITY_BAR[habit.priority] || PRIORITY_BAR.important;
  const progressPct = habit.target > 0 ? Math.min((habit.current / habit.target) * 100, 100) : 0;

  const crossed = useRef(false);
  x.on("change", (v) => {
    if (v > 60 && !crossed.current) { crossed.current = true; hapticLight(); }
    else if (v < 40 && crossed.current) { crossed.current = false; }
  });

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 90 && !habit.completed_today) {
      setSwiped(true);
      controls.start({ x: 0, transition: { duration: 0.25, ease: "easeOut" } });
      hapticSuccess();
      onToggle(habit);
      setTimeout(() => setSwiped(false), 200);
    } else {
      controls.start({ x: 0, transition: { duration: 0.25, ease: "easeOut" } });
    }
    crossed.current = false;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Swipe-to-complete background — subtle green tint, no gradient */}
      <motion.div
        className="absolute inset-0 rounded-2xl flex items-center pl-6 bg-success/10"
        style={{ opacity: bgOpacity }}
      >
        <motion.div style={{ scale: checkScale }}>
          <Check className="h-5 w-5 text-success" />
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
        className={`relative bg-card rounded-2xl border border-border/60 transition-opacity ${
          habit.completed_today ? "opacity-55" : ""
        } ${isDragging ? "z-50 shadow-md scale-[1.01]" : ""}`}
      >
        {/* Priority bar removed for cleaner Apple-style appearance */}

        <div className="flex items-center gap-3 pl-4 pr-3 py-3">
          {/* Plain emoji, no tinted bubble */}
          <span className="text-[22px] leading-none w-7 text-center shrink-0">{habit.icon}</span>

          {/* Title + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p
                className={`text-[15px] font-medium text-foreground truncate ${
                  habit.completed_today ? "line-through" : ""
                }`}
              >
                {habit.name}
              </p>
              {habit.reminder_enabled && (
                <Bell className="h-3 w-3 text-muted-foreground/60 shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-[12px] text-muted-foreground">
              {habit.streak > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Flame className="h-3 w-3 text-primary" />
                  <span className="tabular-nums">{habit.streak}</span>
                </span>
              )}
              {habit.target > 1 && (
                <span className="tabular-nums">{habit.current}/{habit.target}</span>
              )}
            </div>
            {habit.target > 1 && (
              <div className="mt-2 h-[2px] rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                />
              </div>
            )}
          </div>

          {/* Completion circle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { hapticSuccess(); onToggle(habit); }}
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
              habit.completed_today
                ? "bg-primary text-primary-foreground"
                : "border border-border hover:border-primary/50"
            }`}
            aria-label={habit.completed_today ? "Completed" : "Mark complete"}
          >
            {habit.completed_today && <Check className="h-4 w-4" strokeWidth={2.8} />}
          </motion.button>

          {/* Delete — tertiary */}
          <button
            onClick={() => onDelete(habit.id)}
            className="text-muted-foreground/30 hover:text-destructive transition-colors p-1 -mr-1"
            aria-label="Delete habit"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
