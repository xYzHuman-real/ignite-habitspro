import { useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Sparkles, Target, Focus, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Slide {
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  body: string;
  accent: string; // tailwind gradient
}

const SLIDES: Slide[] = [
  {
    icon: Target,
    eyebrow: "Daily Rituals",
    title: "Build Better Habits",
    body: "Create habits, stay consistent, and track your progress every day.",
    accent: "from-orange-400/30 to-amber-300/10",
  },
  {
    icon: Focus,
    eyebrow: "Deep Work",
    title: "Focus Without Distractions",
    body: "Block distractions, stay focused, and build deep work sessions.",
    accent: "from-rose-400/25 to-orange-300/10",
  },
  {
    icon: Trophy,
    eyebrow: "Your Best Self",
    title: "Become Your Best Self",
    body: "Habits, goals, focus sessions, accountability, and productivity — all in one place.",
    accent: "from-amber-400/30 to-orange-300/10",
  },
];

const STORAGE_KEY = "onboarding_completed_v1";

export function hasSeenOnboarding() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

interface Props {
  onFinish: () => void;
}

export function OnboardingCarousel({ onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const total = SLIDES.length;
  const isLast = index === total - 1;

  const finish = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    onFinish();
  };

  const next = () => (isLast ? finish() : setIndex((i) => i + 1));

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 && !isLast) setIndex((i) => i + 1);
    else if (info.offset.x > 60 && index > 0) setIndex((i) => i - 1);
  };

  const slide = SLIDES[index];
  const Icon = slide.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[9998] bg-background flex flex-col"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-4">
        <div className="flex items-center gap-1.5 text-primary">
          <Sparkles className="h-4 w-4" />
          <span className="text-[13px] font-semibold tracking-tight">Ignite</span>
        </div>
        <button
          onClick={finish}
          className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors py-1.5 px-2 -mr-2"
        >
          Skip
        </button>
      </div>

      {/* Slide content */}
      <motion.div
        className="flex-1 flex flex-col items-center justify-center px-8 select-none"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        onDragEnd={handleDragEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm flex flex-col items-center text-center"
          >
            {/* Illustration */}
            <div className="relative w-56 h-56 mb-10 flex items-center justify-center">
              <motion.div
                className={`absolute inset-0 rounded-[2.5rem] bg-gradient-to-br ${slide.accent} blur-2xl`}
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
                className="relative w-40 h-40 rounded-[2rem] bg-card border border-border/60 shadow-[0_30px_60px_-20px_rgba(249,115,22,0.35)] flex items-center justify-center"
              >
                <div className="absolute inset-3 rounded-[1.5rem] bg-gradient-to-br from-primary/10 to-primary/0" />
                <Icon className="relative h-16 w-16 text-primary" strokeWidth={1.6} />
              </motion.div>
            </div>

            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-primary/80 mb-3">
              {slide.eyebrow}
            </p>
            <h1 className="text-[30px] leading-[1.1] font-display font-bold tracking-tight text-foreground mb-3">
              {slide.title}
            </h1>
            <p className="text-[15px] leading-relaxed text-muted-foreground max-w-[20rem]">
              {slide.body}
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Footer: dots + next */}
      <div className="px-6 pb-8 pt-4 space-y-6">
        <div className="flex items-center justify-center gap-2">
          {SLIDES.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setIndex(i)}
              className="h-1.5 rounded-full bg-muted overflow-hidden"
              animate={{ width: i === index ? 28 : 8 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            >
              {i === index && (
                <motion.div
                  layoutId="onb-dot"
                  className="h-full w-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #F97316, #EA580C)" }}
                />
              )}
            </motion.button>
          ))}
        </div>

        <Button
          onClick={next}
          className="w-full h-14 rounded-2xl text-[16px] font-semibold tracking-tight text-white shadow-[0_10px_30px_-10px_rgba(249,115,22,0.6)]"
          style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" }}
        >
          {isLast ? "Get Started" : "Continue"}
        </Button>
      </div>
    </motion.div>
  );
}
