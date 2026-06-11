import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Check,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Brain,
  Shield,
  BarChart3,
  Palette,
  Users,
  Rocket,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExplore?: () => void;
};

const UNLOCKED = [
  "Unlimited Habits",
  "Unlimited Goals",
  "AI Daily Planner Pro",
  "Advanced Focus Protection",
  "Premium Focus Rooms",
  "Shared Streak Premium Features",
  "Advanced Analytics & Insights",
  "Exclusive Themes & Customization",
  "Ad-Free Experience",
  "Priority Access to New Features",
];

const CARDS = [
  {
    icon: Brain,
    title: "AI Daily Planner Pro",
    desc: "Generate personalized schedules based on your goals and routine.",
    gradient: "from-amber-400 via-orange-500 to-rose-500",
  },
  {
    icon: Shield,
    title: "Advanced Focus Protection",
    desc: "Stay focused by blocking distractions during focus sessions.",
    gradient: "from-indigo-500 via-purple-500 to-pink-500",
  },
  {
    icon: BarChart3,
    title: "Premium Analytics",
    desc: "Track habits, goals, streaks, and productivity trends in detail.",
    gradient: "from-emerald-400 via-teal-500 to-cyan-500",
  },
  {
    icon: Palette,
    title: "Exclusive Themes",
    desc: "Unlock premium themes and personalization options.",
    gradient: "from-fuchsia-500 via-pink-500 to-rose-500",
  },
  {
    icon: Users,
    title: "Shared Streaks Pro",
    desc: "Build accountability with friends and maintain streaks together.",
    gradient: "from-sky-400 via-blue-500 to-indigo-600",
  },
];

export function PremiumWelcomeDialog({ open, onOpenChange, onExplore }: Props) {
  const [card, setCard] = useState(0);
  const [dir, setDir] = useState(1);

  useEffect(() => {
    if (open) setCard(0);
  }, [open]);

  // Optional premium success sound
  useEffect(() => {
    if (!open) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
      notes.forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = freq;
        const start = ctx.currentTime + i * 0.12;
        g.gain.setValueAtTime(0, start);
        g.gain.linearRampToValueAtTime(0.18, start + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(start);
        o.stop(start + 0.55);
      });
    } catch {
      // ignore
    }
  }, [open]);

  const next = () => {
    setDir(1);
    setCard((c) => (c + 1) % CARDS.length);
  };
  const prev = () => {
    setDir(-1);
    setCard((c) => (c - 1 + CARDS.length) % CARDS.length);
  };

  const ActiveIcon = CARDS[card].icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-background via-background to-background border border-amber-400/30">
          {/* Glow background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -left-20 w-72 h-72 bg-amber-400/20 blur-3xl rounded-full" />
            <div className="absolute -top-10 -right-20 w-72 h-72 bg-fuchsia-500/20 blur-3xl rounded-full" />
          </div>

          <div className="relative max-h-[85vh] overflow-y-auto px-5 pt-6 pb-5 space-y-5">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="text-center space-y-2"
            >
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
                className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-500 to-orange-600 flex items-center justify-center shadow-[0_10px_40px_-5px_rgba(251,191,36,0.6)]"
              >
                <Crown className="w-8 h-8 text-white drop-shadow" />
              </motion.div>
              <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                🎉 Welcome to Ignite Habit Pro Premium
              </h2>
              <p className="text-sm text-muted-foreground">
                You've unlocked the complete productivity experience.
              </p>
            </motion.div>

            {/* Unlocked features card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
              className="rounded-xl p-4 border border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold">Everything Unlocked</span>
              </div>
              <ul className="grid grid-cols-1 gap-2">
                {UNLOCKED.map((feat, i) => (
                  <motion.li
                    key={feat}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: 0.2 + i * 0.04, ease: "easeOut" }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-emerald-400" />
                    </span>
                    <span className="text-foreground/90">{feat}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* What's new — swipeable */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <Rocket className="w-4 h-4 text-amber-400" /> What's New?
                </h3>
                <span className="text-xs text-muted-foreground">
                  {card + 1} / {CARDS.length}
                </span>
              </div>

              <div className="relative h-[170px] overflow-hidden rounded-xl">
                <AnimatePresence custom={dir} mode="wait">
                  <motion.div
                    key={card}
                    custom={dir}
                    initial={{ opacity: 0, x: dir * 60 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: dir * -60 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.25}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -60) next();
                      else if (info.offset.x > 60) prev();
                    }}
                    className={cn(
                      "absolute inset-0 rounded-xl p-4 text-white flex flex-col justify-between cursor-grab active:cursor-grabbing",
                      "bg-gradient-to-br shadow-lg",
                      CARDS[card].gradient
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                        <ActiveIcon className="w-5 h-5" />
                      </div>
                      <h4 className="font-semibold text-base">{CARDS[card].title}</h4>
                    </div>
                    <p className="text-sm text-white/90 leading-relaxed">
                      {CARDS[card].desc}
                    </p>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={prev}
                        className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition"
                        aria-label="Previous"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <div className="flex gap-1.5">
                        {CARDS.map((_, i) => (
                          <span
                            key={i}
                            className={cn(
                              "h-1.5 rounded-full transition-all",
                              i === card ? "w-6 bg-white" : "w-1.5 bg-white/40"
                            )}
                          />
                        ))}
                      </div>
                      <button
                        onClick={next}
                        className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition"
                        aria-label="Next"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Button
                size="lg"
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:opacity-95 text-white border-0 shadow-[0_8px_30px_-5px_rgba(251,146,60,0.6)]"
                onClick={() => {
                  onOpenChange(false);
                  onExplore?.();
                }}
              >
                🚀 Start Exploring Premium
              </Button>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
