import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, Volume2, VolumeX, Timer, Music, Square, Palette, Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { usePomodoroSessions, useProfile } from "@/lib/supabase-hooks";
import { SmartBreakPopup } from "@/components/SmartBreakPopup";
import { FocusExitConfirmDialog } from "@/components/FocusModeOverlay";
import { PageTransition } from "@/components/PageTransition";
import { TaskLinkPopup } from "@/components/TaskLinkPopup";
import { FocusSettingsHub } from "@/components/FocusSettingsHub";
import { FocusFeedbackForm } from "@/components/FocusFeedbackForm";
import { useFocusThemes } from "@/lib/use-focus-themes";
import { useFocusSettings } from "@/lib/use-focus-settings";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type Mode = "focus" | "shortBreak" | "longBreak" | "custom";

const PRESET_MODES: Record<Exclude<Mode, "custom">, { label: string; minutes: number }> = {
  focus: { label: "Focus", minutes: 25 },
  shortBreak: { label: "Short Break", minutes: 5 },
  longBreak: { label: "Long Break", minutes: 15 },
};

const SOUNDS = [
  { name: "None", url: "", icon: "🔇" },
  { name: "Rain", url: "https://cdn.pixabay.com/audio/2022/05/13/audio_257112ce99.mp3", icon: "🌧️" },
  { name: "Forest", url: "https://cdn.pixabay.com/audio/2022/08/04/audio_2dae668d83.mp3", icon: "🌲" },
  { name: "Library", url: "https://cdn.pixabay.com/audio/2022/10/30/audio_a583db4755.mp3", icon: "📖" },
  { name: "White Noise", url: "https://cdn.pixabay.com/audio/2022/03/10/audio_4dedf5bf94.mp3", icon: "📻" },
  { name: "Lofi Chill", url: "https://cdn.pixabay.com/audio/2024/11/04/audio_4956b4edd1.mp3", icon: "🎵" },
  { name: "Lofi Study", url: "https://cdn.pixabay.com/audio/2024/09/26/audio_38cc6d8882.mp3", icon: "📚" },
  { name: "Piano", url: "https://cdn.pixabay.com/audio/2023/10/30/audio_4ab1e7250f.mp3", icon: "🎹" },
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
  startedAt?: number;
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
    if (state.paused && state.pausedTimeLeft && state.pausedTimeLeft > 0) return state;
    if (state.endTime <= Date.now()) return null;
    return state;
  } catch {
    return null;
  }
}

// Calculate focus reward points: 1 point per 3 minutes, 0 if < 10 min
function calculateFocusPoints(minutes: number): number {
  if (minutes < 10) return 0;
  return Math.floor(minutes / 3);
}

export default function TimerPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const savedState = useRef(loadTimerState());
  const [mode, setMode] = useState<Mode>(savedState.current?.mode || "focus");
  const [customMinutes, setCustomMinutes] = useState(savedState.current?.customMinutes || 60);
  const [initialSeconds, setInitialSeconds] = useState(
    savedState.current?.initialSeconds || PRESET_MODES.focus.minutes * 60
  );
  const [timeLeft, setTimeLeft] = useState(() => {
    if (savedState.current) {
      if (savedState.current.paused && savedState.current.pausedTimeLeft) {
        return savedState.current.pausedTimeLeft;
      }
      return Math.max(0, Math.ceil((savedState.current.endTime - Date.now()) / 1000));
    }
    return PRESET_MODES.focus.minutes * 60;
  });
  const [isRunning, setIsRunning] = useState(() => {
    if (!savedState.current) return false;
    return !savedState.current.paused && savedState.current.endTime > Date.now();
  });
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
  const [showTaskLink, setShowTaskLink] = useState(false);
  const [linkedTask, setLinkedTask] = useState<LinkedTask | null>(savedState.current?.linkedTask || null);
  const [sessionStartedAt, setSessionStartedAt] = useState<number>(savedState.current?.startedAt || 0);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const endTimeRef = useRef<number>(savedState.current?.endTime || 0);
  const { sessions, addSession } = usePomodoroSessions();
  const { currentTheme, ownedThemes, selectTheme } = useFocusThemes();
  const { settings } = useFocusSettings();

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
          handleSessionComplete();
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

  const handleSessionComplete = useCallback(() => {
    setIsRunning(false);
    setFocusMode(false);
    saveTimerState(null);
    const durationMinutes = mode === "custom" ? customMinutes : PRESET_MODES[mode as Exclude<Mode, "custom">].minutes;
    if (mode === "focus" || mode === "custom") {
      addSession({ duration_minutes: durationMinutes, session_type: "focus", linked_task: linkedTask?.label || null, linked_subject: linkedTask?.type === "subject" ? linkedTask.label : null });
      // Award focus points
      awardFocusPoints(durationMinutes);
      setCompletedFocusMinutes(durationMinutes);
      setShowBreakPopup(true);
      setTimerCompleteAnimation(true);
      setTimeout(() => setTimerCompleteAnimation(false), 2000);
    }
    stopSound();
  }, [mode, customMinutes, linkedTask]);

  const awardFocusPoints = async (minutes: number) => {
    if (!user) return;
    const points = calculateFocusPoints(minutes);
    if (points <= 0) return;
    const { data: profile } = await supabase.from("profiles").select("leaderboard_points, coins").eq("user_id", user.id).single();
    if (profile) {
      await supabase.from("profiles").update({
        leaderboard_points: profile.leaderboard_points + points,
        coins: (profile.coins || 0) + points,
      }).eq("user_id", user.id);
    }
  };

  const playSound = useCallback((idx: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (idx > 0 && SOUNDS[idx]?.url) {
      const audio = new Audio(SOUNDS[idx].url);
      audio.loop = true;
      audio.volume = settings.soundVolume;
      audio.play().catch(() => {});
      audioRef.current = audio;
    }
  }, [settings.soundVolume]);

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
        saveTimerState({ endTime: endTimeRef.current, mode, customMinutes, initialSeconds, soundIdx: idx, startedAt: sessionStartedAt });
      }
    }
  };

  const requestStart = () => {
    const isFocus = mode === "focus" || mode === "custom";
    if (isFocus && !linkedTask) {
      setShowTaskLink(true);
      return;
    }
    doStartTimer();
  };

  const handleTaskLinkSelect = (task: LinkedTask | null) => {
    setLinkedTask(task);
    setShowTaskLink(false);
    setTimeout(() => doStartTimer(task), 50);
  };

  const doStartTimer = (taskOverride?: LinkedTask | null) => {
    const endTime = Date.now() + timeLeft * 1000;
    const startedAt = Date.now();
    endTimeRef.current = endTime;
    setIsRunning(true);
    setSessionStartedAt(startedAt);
    if (mode === "focus" || mode === "custom") setFocusMode(true);
    const task = taskOverride !== undefined ? taskOverride : linkedTask;
    saveTimerState({ endTime, mode, customMinutes, initialSeconds, soundIdx, linkedTask: task, startedAt });
    if (SOUNDS[soundIdx]?.url) playSound(soundIdx);
  };

  // End session early - save actual time studied
  const endSessionEarly = () => {
    setIsRunning(false);
    setFocusMode(false);
    const actualSecondsStudied = sessionStartedAt > 0 ? Math.floor((Date.now() - sessionStartedAt) / 1000) : (initialSeconds - timeLeft);
    const actualMinutes = Math.max(1, Math.round(actualSecondsStudied / 60));
    saveTimerState(null);
    stopSound();

    if (mode === "focus" || mode === "custom") {
      addSession({ duration_minutes: actualMinutes, session_type: "focus", linked_task: linkedTask?.label || null, linked_subject: linkedTask?.type === "subject" ? linkedTask.label : null });
      awardFocusPoints(actualMinutes);
      setCompletedFocusMinutes(actualMinutes);
      setShowBreakPopup(true);
    }
    setLinkedTask(null);
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
    "Discipline is choosing what you want most over what you want now.",
  ];
  const quote = quotes[todaySessions % quotes.length];

  const isFocusMode = mode === "focus" || mode === "custom";
  const focusPoints = calculateFocusPoints(
    mode === "custom" ? customMinutes : (isFocusMode ? PRESET_MODES.focus.minutes : 0)
  );

  // ===== DEEP FOCUS MODE (LOCKDOWN) =====
  if (focusMode && isRunning) {
    const actualMinutesElapsed = sessionStartedAt > 0 ? Math.round((Date.now() - sessionStartedAt) / 60000) : 0;
    const estimatedPoints = calculateFocusPoints(actualMinutesElapsed);

    return (
      <div
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center transition-all duration-500"
        style={{ background: currentTheme.gradient }}
      >
        {/* Subtle animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-white/10"
              initial={{ x: Math.random() * 400, y: Math.random() * 800, opacity: 0 }}
              animate={{
                y: [Math.random() * 800, -20],
                opacity: [0, 0.3, 0],
              }}
              transition={{
                duration: 8 + Math.random() * 4,
                repeat: Infinity,
                delay: i * 1.5,
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6 relative z-10"
        >
          {/* Timer Ring */}
          <div className="relative w-64 h-64 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
              <motion.circle
                cx="50" cy="50" r="45" fill="none"
                stroke="rgba(255,255,255,0.8)"
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
                initial={{ scale: 1.02 }}
                animate={{ scale: 1 }}
                className="text-6xl font-display font-bold tabular-nums text-white"
              >
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </motion.span>
              <span className="text-sm text-white/60 mt-2 font-medium">Deep Focus</span>
              {linkedTask && (
                <span className="text-xs text-white/70 mt-1 font-medium">🎯 {linkedTask.label}</span>
              )}
            </div>
          </div>

          {/* Points earned so far */}
          {estimatedPoints > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 text-white/70"
            >
              <span className="text-sm">🔥 +{estimatedPoints} pts earned</span>
            </motion.div>
          )}

          {/* Quote */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-white/50 italic max-w-xs mx-auto"
          >
            "{quote}"
          </motion.p>

          {/* Only End Session button - no pause/stop */}
          <div className="flex flex-col gap-3 items-center">
            <Button
              size="lg"
              onClick={() => setShowExitConfirm(true)}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 hover:text-white px-8"
            >
              <Square className="h-5 w-5 mr-2" /> End Session
            </Button>
          </div>

          {/* Sound indicator */}
          <div className="flex items-center justify-center gap-4">
            {soundIdx > 0 && (
              <button
                onClick={() => toggleSound(0)}
                className="text-xs text-white/50 flex items-center gap-1 hover:text-white/70 transition-colors"
              >
                <Volume2 className="h-3 w-3" /> {SOUNDS[soundIdx].icon} {SOUNDS[soundIdx].name}
              </button>
            )}
            {/* Sound selection in focus mode */}
            <button
              onClick={() => setShowSounds(!showSounds)}
              className="text-xs text-white/50 flex items-center gap-1 hover:text-white/70 transition-colors"
            >
              <Music className="h-3 w-3" /> Sounds
            </button>
          </div>

          {/* Inline sound picker in focus mode */}
          <AnimatePresence>
            {showSounds && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 gap-2 max-w-xs mx-auto overflow-hidden"
              >
                {SOUNDS.map((s, i) => (
                  <button
                    key={s.name}
                    onClick={() => { toggleSound(i); setShowSounds(false); }}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      soundIdx === i
                        ? "bg-white/20 text-white"
                        : "bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {s.icon} {s.name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feedback in focus mode */}
          <div className="pt-2">
            <FocusFeedbackForm />
          </div>
        </motion.div>

        {/* Exit confirmation */}
        <FocusExitConfirmDialog
          showExitConfirm={showExitConfirm}
          onContinue={() => setShowExitConfirm(false)}
          onExit={() => { setShowExitConfirm(false); endSessionEarly(); }}
        />

        {/* Smart Break Popup */}
        <SmartBreakPopup
          show={showBreakPopup}
          focusMinutes={completedFocusMinutes}
          onStartBreak={handleStartBreak}
          onDismiss={() => setShowBreakPopup(false)}
        />
      </div>
    );
  }

  // ===== NORMAL TIMER UI =====
  return (
    <PageTransition>
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-display font-bold">Focus Timer</h1>
          <div className="flex items-center gap-2">
            <FocusSettingsHub />
            <FocusFeedbackForm />
          </div>
        </div>

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

        {/* Focus Theme Preview */}
        {isFocusMode && !isRunning && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-display font-semibold flex items-center gap-1.5">
                <Palette className="h-4 w-4 text-accent" /> Focus Theme
              </h3>
              <span className="text-xs text-muted-foreground">{currentTheme.icon} {currentTheme.name}</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {ownedThemes.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => selectTheme(theme.value)}
                  className={`flex-shrink-0 w-16 h-10 rounded-lg border-2 transition-all ${
                    currentTheme.value === theme.value ? "border-primary shadow-glow-primary" : "border-border"
                  }`}
                  style={{ background: theme.gradient }}
                  title={theme.name}
                />
              ))}
            </div>
          </Card>
        )}

        {/* Focus points preview */}
        {isFocusMode && !isRunning && focusPoints > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            🔥 Complete this session to earn <span className="font-semibold text-primary">+{focusPoints} points</span>
          </div>
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
              {linkedTask && (
                <span className="text-xs text-primary mt-1 font-medium truncate max-w-[180px]">
                  🎯 {linkedTask.label}
                </span>
              )}
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
                onClick={requestStart}
                className="px-8 bg-gradient-primary text-primary-foreground shadow-glow-primary"
                disabled={isRunning}
              >
                <Play className="h-5 w-5 mr-2" /> Start Focus
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
                {soundIdx > 0 ? `${SOUNDS[soundIdx].icon} ${SOUNDS[soundIdx].name}` : "Ambient Sounds"}
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
                          {s.icon} {s.name}
                        </Button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </Card>

        {/* Distraction blocklist preview */}
        {isFocusMode && settings.blockedApps.length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-display font-semibold mb-2 flex items-center gap-1.5">
              🚫 Blocked During Focus
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {settings.blockedApps.slice(0, 8).map((app) => (
                <span key={app} className="px-2 py-0.5 text-xs rounded-full bg-destructive/10 text-destructive">
                  {app}
                </span>
              ))}
              {settings.blockedApps.length > 8 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                  +{settings.blockedApps.length - 8} more
                </span>
              )}
            </div>
          </Card>
        )}

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

        {/* Task Link Popup */}
        <TaskLinkPopup
          open={showTaskLink}
          onSelect={handleTaskLinkSelect}
          onClose={() => setShowTaskLink(false)}
        />
      </div>
    </PageTransition>
  );
}
