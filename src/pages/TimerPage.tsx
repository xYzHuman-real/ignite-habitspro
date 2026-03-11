import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Timer, Music, Square } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { usePomodoroSessions } from "@/lib/supabase-hooks";
import { SmartBreakPopup } from "@/components/SmartBreakPopup";
import { FocusExitConfirmDialog } from "@/components/FocusModeOverlay";
import { PageTransition } from "@/components/PageTransition";
import { TaskLinkPopup } from "@/components/TaskLinkPopup";
import { useNavigate } from "react-router-dom";

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

const TIMER_STORAGE_KEY = "timer_state";

interface LinkedTask {
  type: "task" | "subject";
  label: string;
  id?: string;
}

interface TimerState {
  endTime: number;
  mode: Mode;
  customMinutes: number;
  initialSeconds: number;
  soundIdx: number;
  paused?: boolean;
  pausedTimeLeft?: number;
  linkedTask?: LinkedTask | null;
}

function saveTimerState(state: TimerState | null) {
  if (state) {
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
  } else {
    localStorage.removeItem(TIMER_STORAGE_KEY);
  }
}

function loadTimerState(): TimerState | null {
  try {
    const stored = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!stored) return null;
    const state: TimerState = JSON.parse(stored);
    if (state.endTime <= Date.now()) return null;
    return state;
  } catch {
    return null;
  }
}

export default function TimerPage() {
  const navigate = useNavigate();
  const savedState = useRef(loadTimerState());
  const [mode, setMode] = useState<Mode>(savedState.current?.mode || "focus");
  const [customMinutes, setCustomMinutes] = useState(savedState.current?.customMinutes || 60);
  const [initialSeconds, setInitialSeconds] = useState(
    savedState.current?.initialSeconds || PRESET_MODES.focus.minutes * 60
  );
  const [timeLeft, setTimeLeft] = useState(() => {
    if (savedState.current) {
      return Math.max(0, Math.ceil((savedState.current.endTime - Date.now()) / 1000));
    }
    return PRESET_MODES.focus.minutes * 60;
  });
  const [isRunning, setIsRunning] = useState(!!savedState.current);
  const [focusMode, setFocusMode] = useState(
    savedState.current ? (savedState.current.mode === "focus" || savedState.current.mode === "custom") : false
  );
  const [soundIdx, setSoundIdx] = useState(savedState.current?.soundIdx || 0);
  const [showSounds, setShowSounds] = useState(false);
  const [confirmSwitch, setConfirmSwitch] = useState<Mode | null>(null);
  const [showBreakPopup, setShowBreakPopup] = useState(false);
  const [completedFocusMinutes, setCompletedFocusMinutes] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [timerCompleteAnimation, setTimerCompleteAnimation] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const endTimeRef = useRef<number>(savedState.current?.endTime || 0);
  const { sessions, addSession } = usePomodoroSessions();

  const todaySessions = sessions.filter((s) => s.session_type === "focus").length;
  const todayMinutes = sessions
    .filter((s) => s.session_type === "focus")
    .reduce((sum, s) => sum + s.duration_minutes, 0);

  // Background-safe timer
  useEffect(() => {
    if (isRunning) {
      const tick = () => {
        const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining <= 0) {
          setIsRunning(false);
          setFocusMode(false);
          saveTimerState(null);
          const durationMinutes = mode === "custom" ? customMinutes : PRESET_MODES[mode as Exclude<Mode, "custom">].minutes;
          if (mode === "focus" || mode === "custom") {
            addSession({ duration_minutes: durationMinutes, session_type: "focus" });
            setCompletedFocusMinutes(durationMinutes);
            setShowBreakPopup(true);
            setTimerCompleteAnimation(true);
            setTimeout(() => setTimerCompleteAnimation(false), 2000);
          }
          stopSound();
        }
      };
      tick();
      intervalRef.current = window.setInterval(tick, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode, customMinutes]);

  // Resume sound on mount
  useEffect(() => {
    if (isRunning && soundIdx > 0 && SOUNDS[soundIdx]?.url) {
      playSound(soundIdx);
    }
    return () => stopSound();
  }, []);

  const playSound = useCallback((idx: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (idx > 0 && SOUNDS[idx]?.url) {
      const audio = new Audio(SOUNDS[idx].url);
      audio.loop = true;
      audio.volume = 0.3;
      audio.play().catch(() => {});
      audioRef.current = audio;
    }
  }, []);

  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
  }, []);

  const toggleSound = (idx: number) => {
    setSoundIdx(idx);
    if (isRunning) {
      playSound(idx);
      if (endTimeRef.current > Date.now()) {
        saveTimerState({ endTime: endTimeRef.current, mode, customMinutes, initialSeconds, soundIdx: idx });
      }
    }
  };

  const startTimer = () => {
    const endTime = Date.now() + timeLeft * 1000;
    endTimeRef.current = endTime;
    setIsRunning(true);
    if (mode === "focus" || mode === "custom") setFocusMode(true);
    saveTimerState({ endTime, mode, customMinutes, initialSeconds, soundIdx });
    if (SOUNDS[soundIdx]?.url) playSound(soundIdx);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    saveTimerState(null);
    stopSound();
  };

  const stopTimer = () => {
    setIsRunning(false);
    setFocusMode(false);
    saveTimerState(null);
    stopSound();
    const dur = mode === "custom" ? customMinutes * 60 : PRESET_MODES[mode as Exclude<Mode, "custom">].minutes * 60;
    setTimeLeft(dur);
    setInitialSeconds(dur);
  };

  const attemptSwitchMode = (m: Mode) => {
    if (isRunning && mode === "custom" && m !== "custom") {
      setConfirmSwitch(m);
      return;
    }
    doSwitchMode(m);
  };

  const doSwitchMode = (m: Mode) => {
    setMode(m);
    const dur = m === "custom" ? customMinutes * 60 : PRESET_MODES[m].minutes * 60;
    setTimeLeft(dur);
    setInitialSeconds(dur);
    setIsRunning(false);
    setFocusMode(false);
    saveTimerState(null);
    stopSound();
    setConfirmSwitch(null);
  };

  const applyCustomTime = () => {
    const clamped = Math.max(1, Math.min(240, customMinutes));
    setCustomMinutes(clamped);
    const dur = clamped * 60;
    setTimeLeft(dur);
    setInitialSeconds(dur);
  };

  const reset = () => {
    const dur = mode === "custom" ? customMinutes * 60 : PRESET_MODES[mode as Exclude<Mode, "custom">].minutes * 60;
    setTimeLeft(dur);
    setInitialSeconds(dur);
    setIsRunning(false);
    setFocusMode(false);
    saveTimerState(null);
    stopSound();
  };

  const handleStartBreak = (breakMinutes: number) => {
    setShowBreakPopup(false);
    const shortOrLong = breakMinutes <= 7 ? "shortBreak" : "longBreak";
    doSwitchMode(shortOrLong);
    // Auto-start the break
    setTimeout(() => {
      const endTime = Date.now() + breakMinutes * 60 * 1000;
      endTimeRef.current = endTime;
      setIsRunning(true);
      setTimeLeft(breakMinutes * 60);
      setInitialSeconds(breakMinutes * 60);
      saveTimerState({ endTime, mode: shortOrLong, customMinutes, initialSeconds: breakMinutes * 60, soundIdx });
    }, 100);
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

  // Deep Focus Mode: show minimal UI when running
  if (focusMode && isRunning) {
    return (
      <div className="fixed inset-0 z-[80] bg-background flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-8"
        >
          <div className="relative w-64 h-64 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" className="stroke-muted" strokeWidth="3" />
              <motion.circle
                cx="50" cy="50" r="45" fill="none"
                className="stroke-primary"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={Math.PI * 90}
                animate={{ strokeDashoffset: Math.PI * 90 * (1 - progress / 100) }}
                transition={{ duration: 0.5 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                key={timeLeft}
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                className="text-6xl font-display font-bold tabular-nums"
              >
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </motion.span>
              <span className="text-sm text-muted-foreground mt-2">Deep Focus</span>
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-muted-foreground italic max-w-xs mx-auto"
          >
            "{quote}"
          </motion.p>

          <div className="flex gap-3 justify-center">
            <Button
              size="lg"
              onClick={pauseTimer}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Pause className="h-5 w-5 mr-2" /> Pause
            </Button>
            <Button size="lg" variant="outline" onClick={() => setShowExitConfirm(true)}>
              <Square className="h-5 w-5 mr-2" /> Stop
            </Button>
          </div>

          {/* Sound indicator */}
          {soundIdx > 0 && (
            <button
              onClick={() => toggleSound(0)}
              className="text-xs text-muted-foreground flex items-center gap-1 mx-auto hover:text-foreground transition-colors"
            >
              <Volume2 className="h-3 w-3" /> {SOUNDS[soundIdx].name}
            </button>
          )}
        </motion.div>

        <FocusExitConfirmDialog
          showExitConfirm={showExitConfirm}
          onContinue={() => setShowExitConfirm(false)}
          onExit={() => { setShowExitConfirm(false); stopTimer(); }}
        />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-3xl font-display font-bold text-center">Focus Timer</h1>

        {/* Mode tabs */}
        <div className="flex justify-center gap-2 flex-wrap">
          {(["focus", "shortBreak", "longBreak"] as const).map((m) => (
            <Button
              key={m}
              variant={mode === m ? "default" : "outline"}
              size="sm"
              onClick={() => attemptSwitchMode(m)}
              className={mode === m ? "bg-gradient-primary text-primary-foreground" : ""}
            >
              {PRESET_MODES[m].label}
            </Button>
          ))}
          <Button
            variant={mode === "custom" ? "default" : "outline"}
            size="sm"
            onClick={() => attemptSwitchMode("custom")}
            className={mode === "custom" ? "bg-gradient-primary text-primary-foreground" : ""}
          >
            <Timer className="h-3.5 w-3.5 mr-1" /> Custom
          </Button>
        </div>

        {/* Custom timer switch confirmation */}
        <AlertDialog open={!!confirmSwitch} onOpenChange={(o) => !o && setConfirmSwitch(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display">Stop Custom Session?</AlertDialogTitle>
              <AlertDialogDescription>
                You are currently in a Custom Focus Session. Do you want to stop this session and start a break?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>No, Continue</AlertDialogCancel>
              <AlertDialogAction onClick={() => confirmSwitch && doSwitchMode(confirmSwitch)} className="bg-gradient-primary text-primary-foreground">
                Yes, Switch
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Custom time input */}
        <AnimatePresence>
          {mode === "custom" && !isRunning && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
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
        </AnimatePresence>

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

          {/* Timer completion animation */}
          <AnimatePresence>
            {timerCompleteAnimation && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.3, 1], opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="text-4xl"
              >
                🎉
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3">
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                onClick={isRunning ? pauseTimer : startTimer}
                className={`px-8 ${isRunning ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-gradient-primary text-primary-foreground shadow-glow-primary"}`}
              >
                {isRunning ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
                {isRunning ? "Pause" : "Start"}
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button size="lg" variant="outline" onClick={reset}>
                <RotateCcw className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>

          {/* Sounds toggle */}
          {isFocusMode && (
            <div className="w-full space-y-3">
              <Button
                variant={showSounds ? "default" : "outline"}
                size="sm"
                onClick={() => setShowSounds(!showSounds)}
                className={`w-full ${showSounds ? "bg-gradient-primary text-primary-foreground" : ""}`}
              >
                <Music className="h-3.5 w-3.5 mr-1.5" />
                {soundIdx > 0 ? `🎵 ${SOUNDS[soundIdx].name}` : "Sounds"}
                {soundIdx > 0 && !showSounds && (
                  <span className="ml-1.5 w-2 h-2 rounded-full bg-success inline-block" />
                )}
              </Button>
              <AnimatePresence>
                {showSounds && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {SOUNDS.map((s, i) => (
                        <Button
                          key={s.name}
                          variant={soundIdx === i ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleSound(i)}
                          className={`justify-start ${soundIdx === i ? "bg-gradient-primary text-primary-foreground" : ""}`}
                        >
                          {soundIdx === i && i > 0 ? <Volume2 className="h-3.5 w-3.5 mr-1.5" /> : i > 0 ? <VolumeX className="h-3.5 w-3.5 mr-1.5" /> : null}
                          {s.name}
                        </Button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
              <motion.div
                key={i}
                initial={i === todaySessions - 1 ? { scale: 0 } : false}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400 }}
                className={`w-5 h-5 rounded-full ${
                  i < todaySessions ? "bg-gradient-primary shadow-glow-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </Card>

        {/* Smart Break Popup */}
        <SmartBreakPopup
          show={showBreakPopup}
          focusMinutes={completedFocusMinutes}
          onStartBreak={handleStartBreak}
          onDismiss={() => setShowBreakPopup(false)}
        />
      </div>
    </PageTransition>
  );
}
