import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Coffee, Volume2, VolumeX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePomodoroSessions } from "@/lib/supabase-hooks";

type Mode = "focus" | "shortBreak" | "longBreak";

const MODES: Record<Mode, { label: string; minutes: number }> = {
  focus: { label: "Focus", minutes: 25 },
  shortBreak: { label: "Short Break", minutes: 5 },
  longBreak: { label: "Long Break", minutes: 15 },
};

const SOUNDS = [
  { name: "None", url: "" },
  { name: "Rain 🌧️", url: "https://cdn.pixabay.com/audio/2022/05/13/audio_257112ce99.mp3" },
  { name: "Forest 🌲", url: "https://cdn.pixabay.com/audio/2022/08/04/audio_2dae668d83.mp3" },
  { name: "White Noise", url: "https://cdn.pixabay.com/audio/2022/03/10/audio_4dedf5bf94.mp3" },
];

export default function TimerPage() {
  const [mode, setMode] = useState<Mode>("focus");
  const [timeLeft, setTimeLeft] = useState(MODES.focus.minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [soundIdx, setSoundIdx] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { sessions, addSession } = usePomodoroSessions();

  const todaySessions = sessions.filter((s) => s.session_type === "focus").length;

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setFocusMode(false);
      if (mode === "focus") {
        addSession({ duration_minutes: MODES.focus.minutes, session_type: "focus" });
      }
      stopSound();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft, mode]);

  const playSound = (idx: number) => {
    stopSound();
    if (SOUNDS[idx].url) {
      audioRef.current = new Audio(SOUNDS[idx].url);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch(() => {});
    }
  };

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const toggleSound = (idx: number) => {
    setSoundIdx(idx);
    if (isRunning) playSound(idx);
  };

  const startTimer = () => {
    setIsRunning(true);
    if (mode === "focus") setFocusMode(true);
    if (SOUNDS[soundIdx].url) playSound(soundIdx);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    stopSound();
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setTimeLeft(MODES[m].minutes * 60);
    setIsRunning(false);
    setFocusMode(false);
    stopSound();
  };

  const reset = () => {
    setTimeLeft(MODES[mode].minutes * 60);
    setIsRunning(false);
    setFocusMode(false);
    stopSound();
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalSeconds = MODES[mode].minutes * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  const quotes = [
    "Focus is the new IQ. — Cal Newport",
    "Start where you are. Use what you have. Do what you can.",
    "Small daily improvements over time lead to stunning results.",
    "The secret of getting ahead is getting started. — Mark Twain",
  ];
  const quote = quotes[todaySessions % quotes.length];

  return (
    <div className={`max-w-lg mx-auto space-y-6 ${focusMode ? "animate-pulse-subtle" : ""}`}>
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

        {focusMode && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground text-center italic max-w-xs">
            "{quote}"
          </motion.p>
        )}

        <div className="flex gap-3">
          <Button
            size="lg"
            onClick={isRunning ? pauseTimer : startTimer}
            className={`px-8 ${isRunning ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-gradient-primary text-primary-foreground shadow-glow-primary"}`}
          >
            {isRunning ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
            {isRunning ? "Pause" : "Start"}
          </Button>
          <Button size="lg" variant="outline" onClick={reset}>
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>

        {mode === "focus" && (
          <div className="flex flex-wrap justify-center gap-2">
            {SOUNDS.map((s, i) => (
              <Button
                key={s.name}
                variant={soundIdx === i ? "default" : "outline"}
                size="sm"
                onClick={() => toggleSound(i)}
                className={soundIdx === i ? "bg-gradient-primary text-primary-foreground" : ""}
              >
                {soundIdx === i && i > 0 ? <Volume2 className="h-3 w-3 mr-1" /> : i > 0 ? <VolumeX className="h-3 w-3 mr-1" /> : null}
                {s.name}
              </Button>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4 text-center">
        <p className="text-sm text-muted-foreground">Sessions completed today</p>
        <div className="flex justify-center gap-2 mt-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`w-6 h-6 rounded-full ${
                i < todaySessions ? "bg-gradient-primary shadow-glow-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="mt-2 font-display font-semibold text-lg">{todaySessions} / 8</p>
      </Card>
    </div>
  );
}
