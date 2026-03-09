import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Timer, Music } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePomodoroSessions } from "@/lib/supabase-hooks";

type Mode = "focus" | "shortBreak" | "longBreak" | "custom";

const PRESET_MODES: Record<Exclude<Mode, "custom">, { label: string; minutes: number }> = {
  focus: { label: "Focus", minutes: 25 },
  shortBreak: { label: "Short Break", minutes: 5 },
  longBreak: { label: "Long Break", minutes: 15 },
};

const SOUNDS = [
  { name: "None", url: "" },
  { name: "Rain 🌧️", url: "https://cdn.pixabay.com/audio/2022/05/13/audio_257112ce99.mp3" },
  { name: "Forest 🌲", url: "https://cdn.pixabay.com/audio/2022/08/04/audio_2dae668d83.mp3" },
  { name: "White Noise", url: "https://cdn.pixabay.com/audio/2022/03/10/audio_4dedf5bf94.mp3" },
  { name: "Lofi Chill 🎵", url: "https://cdn.pixabay.com/audio/2024/11/04/audio_4956b4edd1.mp3" },
  { name: "Lofi Study 📚", url: "https://cdn.pixabay.com/audio/2024/09/26/audio_38cc6d8882.mp3" },
  { name: "Piano Calm 🎹", url: "https://cdn.pixabay.com/audio/2023/10/30/audio_4ab1e7250f.mp3" },
  { name: "Coffee Shop ☕", url: "https://cdn.pixabay.com/audio/2022/10/30/audio_a583db4755.mp3" },
];

export default function TimerPage() {
  const [mode, setMode] = useState<Mode>("focus");
  const [customMinutes, setCustomMinutes] = useState(60);
  const [initialSeconds, setInitialSeconds] = useState(PRESET_MODES.focus.minutes * 60);
  const [timeLeft, setTimeLeft] = useState(PRESET_MODES.focus.minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [soundIdx, setSoundIdx] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { sessions, addSession } = usePomodoroSessions();

  const todaySessions = sessions.filter((s) => s.session_type === "focus").length;
  const todayMinutes = sessions
    .filter((s) => s.session_type === "focus")
    .reduce((sum, s) => sum + s.duration_minutes, 0);

  const getModeDuration = () => {
    if (mode === "custom") return customMinutes * 60;
    return PRESET_MODES[mode].minutes * 60;
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setFocusMode(false);
      const durationMinutes = mode === "custom" ? customMinutes : PRESET_MODES[mode as Exclude<Mode, "custom">].minutes;
      if (mode === "focus" || mode === "custom") {
        addSession({ duration_minutes: durationMinutes, session_type: "focus" });
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
    if (mode === "focus" || mode === "custom") setFocusMode(true);
    if (SOUNDS[soundIdx].url) playSound(soundIdx);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    stopSound();
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    const dur = m === "custom" ? customMinutes * 60 : PRESET_MODES[m].minutes * 60;
    setTimeLeft(dur);
    setInitialSeconds(dur);
    setIsRunning(false);
    setFocusMode(false);
    stopSound();
  };

  const applyCustomTime = () => {
    const clamped = Math.max(1, Math.min(240, customMinutes));
    setCustomMinutes(clamped);
    const dur = clamped * 60;
    setTimeLeft(dur);
    setInitialSeconds(dur);
  };

  const reset = () => {
    const dur = getModeDuration();
    setTimeLeft(dur);
    setInitialSeconds(dur);
    setIsRunning(false);
    setFocusMode(false);
    stopSound();
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = initialSeconds > 0 ? ((initialSeconds - timeLeft) / initialSeconds) * 100 : 0;

  const quotes = [
    "Focus is the new IQ. — Cal Newport",
    "Start where you are. Use what you have. Do what you can.",
    "Small daily improvements over time lead to stunning results.",
    "The secret of getting ahead is getting started. — Mark Twain",
  ];
  const quote = quotes[todaySessions % quotes.length];

  const isFocusMode = mode === "focus" || mode === "custom";

  return (
    <div className={`max-w-lg mx-auto space-y-6 ${focusMode ? "animate-pulse-subtle" : ""}`}>
      <h1 className="text-3xl font-display font-bold text-center">Focus Timer</h1>

      {/* Mode tabs */}
      <div className="flex justify-center gap-2 flex-wrap">
        {(["focus", "shortBreak", "longBreak"] as const).map((m) => (
          <Button
            key={m}
            variant={mode === m ? "default" : "outline"}
            size="sm"
            onClick={() => switchMode(m)}
            className={mode === m ? "bg-gradient-primary text-primary-foreground" : ""}
          >
            {PRESET_MODES[m].label}
          </Button>
        ))}
        <Button
          variant={mode === "custom" ? "default" : "outline"}
          size="sm"
          onClick={() => switchMode("custom")}
          className={mode === "custom" ? "bg-gradient-primary text-primary-foreground" : ""}
        >
          <Timer className="h-3.5 w-3.5 mr-1" /> Custom
        </Button>
      </div>

      {/* Custom time input */}
      {mode === "custom" && !isRunning && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="overflow-hidden"
        >
          <Card className="p-4">
            <p className="text-sm font-medium text-muted-foreground mb-3">Set your study duration (minutes):</p>
            <div className="flex gap-2 flex-wrap">
              {[30, 45, 60, 90, 120, 180].map((m) => (
                <Button
                  key={m}
                  variant={customMinutes === m ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setCustomMinutes(m);
                    setTimeLeft(m * 60);
                    setInitialSeconds(m * 60);
                  }}
                  className={customMinutes === m ? "bg-gradient-primary text-primary-foreground" : ""}
                >
                  {m >= 60 ? `${m / 60}h` : `${m}m`}
                </Button>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Input
                type="number"
                min={1}
                max={240}
                value={customMinutes}
                onChange={(e) => setCustomMinutes(parseInt(e.target.value) || 1)}
                className="w-24"
                placeholder="Minutes"
              />
              <Button variant="outline" size="sm" onClick={applyCustomTime}>
                Set Timer
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

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
            <span className="text-sm text-muted-foreground mt-1">
              {mode === "custom" ? `Custom (${customMinutes}m)` : PRESET_MODES[mode].label}
            </span>
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

        {isFocusMode && (
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

      <Card className="p-4 text-center space-y-3">
        <p className="text-sm text-muted-foreground">Today's focus</p>
        <div className="flex justify-center gap-6">
          <div>
            <p className="font-display font-bold text-2xl text-primary">{todaySessions}</p>
            <p className="text-xs text-muted-foreground">Sessions</p>
          </div>
          <div>
            <p className="font-display font-bold text-2xl text-accent-foreground">
              {todayMinutes >= 60 ? `${(todayMinutes / 60).toFixed(1)}h` : `${todayMinutes}m`}
            </p>
            <p className="text-xs text-muted-foreground">Total Focus</p>
          </div>
        </div>
        <div className="flex justify-center gap-2 mt-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`w-5 h-5 rounded-full ${
                i < todaySessions ? "bg-gradient-primary shadow-glow-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
