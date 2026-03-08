import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Coffee } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Mode = "focus" | "shortBreak" | "longBreak";

const MODES: Record<Mode, { label: string; minutes: number; icon: React.ReactNode }> = {
  focus: { label: "Focus", minutes: 25, icon: "🎯" },
  shortBreak: { label: "Short Break", minutes: 5, icon: <Coffee className="h-4 w-4" /> },
  longBreak: { label: "Long Break", minutes: 15, icon: "☕" },
};

export default function TimerPage() {
  const [mode, setMode] = useState<Mode>("focus");
  const [timeLeft, setTimeLeft] = useState(MODES.focus.minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      if (mode === "focus") setSessions((s) => s + 1);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft, mode]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setTimeLeft(MODES[m].minutes * 60);
    setIsRunning(false);
  };

  const reset = () => {
    setTimeLeft(MODES[mode].minutes * 60);
    setIsRunning(false);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalSeconds = MODES[mode].minutes * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-3xl font-display font-bold text-center">Pomodoro Timer</h1>

      <div className="flex justify-center gap-2">
        {(Object.keys(MODES) as Mode[]).map((m) => (
          <Button
            key={m}
            variant={mode === m ? "default" : "outline"}
            size="sm"
            onClick={() => switchMode(m)}
            className={mode === m ? "bg-gradient-primary text-primary-foreground" : ""}
          >
            {MODES[m].label}
          </Button>
        ))}
      </div>

      <Card className="p-8 flex flex-col items-center gap-6">
        <div className="relative w-56 h-56">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" className="stroke-muted" strokeWidth="4" />
            <motion.circle
              cx="50" cy="50" r="45" fill="none"
              className="stroke-primary"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={Math.PI * 90}
              animate={{ strokeDashoffset: Math.PI * 90 * (1 - progress / 100) }}
              transition={{ duration: 0.5 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-display font-bold tabular-nums">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
            <span className="text-sm text-muted-foreground mt-1">{MODES[mode].label}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            size="lg"
            onClick={() => setIsRunning(!isRunning)}
            className={`px-8 ${isRunning ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-gradient-primary text-primary-foreground shadow-glow-primary"}`}
          >
            {isRunning ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
            {isRunning ? "Pause" : "Start"}
          </Button>
          <Button size="lg" variant="outline" onClick={reset}>
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>
      </Card>

      <Card className="p-4 text-center">
        <p className="text-sm text-muted-foreground">Sessions completed today</p>
        <div className="flex justify-center gap-2 mt-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`w-6 h-6 rounded-full ${
                i < sessions ? "bg-gradient-primary shadow-glow-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="mt-2 font-display font-semibold text-lg">{sessions} / 8</p>
      </Card>
    </div>
  );
}
