import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";

const ICONS = ["🎯", "📚", "💪", "🧘", "💧", "📖", "📝", "📵", "🌅", "🏃", "🍎", "🎨", "🎵", "⚡", "🌟", "🧠", "🫀", "🏋️", "🛏️", "🥗"];

const DAYS = [
  { key: "sun", label: "S" },
  { key: "mon", label: "M" },
  { key: "tue", label: "T" },
  { key: "wed", label: "W" },
  { key: "thu", label: "T" },
  { key: "fri", label: "F" },
  { key: "sat", label: "S" },
];

const PRIORITIES = [
  { key: "very_important", label: "Very Important", color: "bg-destructive text-destructive-foreground" },
  { key: "important", label: "Important", color: "bg-orange-500 text-white" },
  { key: "less_important", label: "Less Important", color: "bg-blue-500 text-white" },
];

interface AddHabitDrawerProps {
  onAdd: (habit: {
    name: string;
    icon: string;
    target: number;
    difficulty: string;
    priority: string;
    reminder_enabled: boolean;
    reminder_time: string | null;
    reminder_days: string[];
  }) => void;
}

export default function AddHabitDrawer({ onAdd }: AddHabitDrawerProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🎯");
  const [priority, setPriority] = useState("important");
  const [target, setTarget] = useState(1);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("08:00");
  const [repeatDays, setRepeatDays] = useState<string[]>(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);

  const toggleDay = (day: string) => {
    setRepeatDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    const difficulty = priority === "very_important" ? "hard" : priority === "important" ? "medium" : "easy";
    onAdd({
      name: name.trim(),
      icon,
      target,
      difficulty,
      priority,
      reminder_enabled: reminderEnabled,
      reminder_time: reminderEnabled ? reminderTime : null,
      reminder_days: repeatDays,
    });
    // Reset
    setName("");
    setIcon("🎯");
    setPriority("important");
    setTarget(1);
    setReminderEnabled(false);
    setReminderTime("08:00");
    setRepeatDays(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-14 h-14 rounded-full bg-gradient-primary text-primary-foreground shadow-glow-primary flex items-center justify-center"
        >
          <Plus className="h-6 w-6" />
        </motion.button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="font-display text-lg">New Habit</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 space-y-5 overflow-y-auto">
          {/* Name */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Habit Name</label>
            <Input
              placeholder="e.g., Morning meditation"
              value={name}
              onChange={e => setName(e.target.value)}
              className="rounded-xl"
            />
          </div>

          {/* Icon Picker */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Icon</label>
            <div className="grid grid-cols-10 gap-1.5">
              {ICONS.map(ic => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${
                    icon === ic ? "bg-primary/15 ring-2 ring-primary scale-110" : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Priority</label>
            <div className="flex gap-2">
              {PRIORITIES.map(p => (
                <button
                  key={p.key}
                  onClick={() => setPriority(p.key)}
                  className={`flex-1 text-xs font-semibold py-2 rounded-xl transition-all ${
                    priority === p.key
                      ? `${p.color} shadow-md scale-105`
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Target */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Daily Target</label>
            <Input
              type="number"
              min={1}
              max={99}
              value={target}
              onChange={e => setTarget(Math.max(1, parseInt(e.target.value) || 1))}
              className="rounded-xl w-24"
            />
          </div>

          {/* Repeat Days */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Repeat Days</label>
            <div className="flex gap-2">
              {DAYS.map(d => (
                <button
                  key={d.key}
                  onClick={() => toggleDay(d.key)}
                  className={`w-9 h-9 rounded-full text-xs font-semibold transition-all ${
                    repeatDays.includes(d.key)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reminder */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Daily Reminder</label>
              <p className="text-xs text-muted-foreground">Get notified at a set time</p>
            </div>
            <Switch checked={reminderEnabled} onCheckedChange={setReminderEnabled} />
          </div>

          <AnimatePresence>
            {reminderEnabled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Reminder Time</label>
                <Input
                  type="time"
                  value={reminderTime}
                  onChange={e => setReminderTime(e.target.value)}
                  className="rounded-xl w-32"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Create Button */}
          <Button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="w-full bg-gradient-primary text-primary-foreground rounded-xl h-12 text-base font-semibold shadow-glow-primary"
          >
            Create Habit
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
