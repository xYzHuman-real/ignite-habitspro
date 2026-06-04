import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, Volume2, Timer, Music, Square, Coffee, Zap, Clock, Shield } from "lucide-react";
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
import { FocusStatsTab } from "@/components/FocusStatsTab";
import { MotivationalQuotes } from "@/components/MotivationalQuotes";


import { useFocusThemes } from "@/lib/use-focus-themes";
import { useFocusSettings } from "@/lib/use-focus-settings";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type Mode = "focus" | "shortBreak" | "custom";

const PRESET_MODES: Record<Exclude<Mode, "custom">, { label: string; minutes: number }> = {
  focus: { label: "Focus", minutes: 25 },
  shortBreak: { label: "Short Break", minutes: 5 },
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
  if (state) localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
  else localStorage.removeItem(TIMER_STORAGE_KEY);
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

function calculateFocusPoints(minutes: number): number {
  if (minutes < 10) return 0;
  return Math.floor(minutes / 3);
}

export default function TimerPage() {
  const navigate = useNavigate();

  const { user } = useAuth();
  const savedState = useRef(loadTimerState());
  const [activeTab, setActiveTab] = useState<"focus" | "stats">("focus");
  const [mode, setMode] = useState<Mode>(savedState.current?.mode || "focus");
  const [customMinutes, setCustomMinutes] = useState(savedState.current?.customMinutes || 60);
  const [initialSeconds, setInitialSeconds] = useState(
    savedState.current?.initialSeconds || PRESET_MODES.focus.minutes * 60
  );
  const [timeLeft, setTimeLeft] = useState(() => {
    if (savedState.current) {
      if (savedState.current.paused && savedState.current.pausedTimeLeft) return savedState.current.pausedTimeLeft;
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

  useEffect(() => {
    if (isRunning) {
      const tick = () => {
        const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining <= 0) handleSessionComplete();
      };
      tick();
      intervalRef.current = window.setInterval(tick, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, mode, customMinutes]);

  useEffect(() => {
    if (isRunning && soundIdx > 0 && SOUNDS[soundIdx]?.url) playSound(soundIdx);
    return () => stopSound();
  }, []);

  const handleSessionComplete = useCallback(() => {
    setIsRunning(false);
    setFocusMode(false);
    saveTimerState(null);
    const durationMinutes = mode === "custom" ? customMinutes : PRESET_MODES[mode as Exclude<Mode, "custom">].minutes;
    if (mode === "focus" || mode === "custom") {
      addSession({ duration_minutes: durationMinutes, session_type: "focus", linked_task: linkedTask?.label || null, linked_subject: linkedTask?.type === "subject" ? linkedTask.label : null });
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
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; audioRef.current = null; }
    if (idx > 0 && SOUNDS[idx]?.url) {
      const audio = new Audio(SOUNDS[idx].url);
      audio.loop = true;
      audio.volume = settings.soundVolume;
      audio.play().catch(() => {});
      audioRef.current = audio;
    }
  }, [settings.soundVolume]);

  const stopSound = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; audioRef.current = null; }
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
    if (isFocus && !linkedTask) { setShowTaskLink(true); return; }
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
    if (isRunning && mode === "custom" && m !== "custom") { setConfirmSwitch(m); return; }
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
    setTimeLeft(clamped * 60);
    setInitialSeconds(clamped * 60);
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
    doSwitchMode("shortBreak");
    setTimeout(() => {
      const endTime = Date.now() + breakMinutes * 60 * 1000;
      endTimeRef.current = endTime;
      setIsRunning(true);
      setTimeLeft(breakMinutes * 60);
      setInitialSeconds(breakMinutes * 60);
      saveTimerState({ endTime, mode: "shortBreak", customMinutes, initialSeconds: breakMinutes * 60, soundIdx });
    }, 100);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = initialSeconds > 0 ? ((initialSeconds - timeLeft) / initialSeconds) * 100 : 0;

  const quotes = [
    "Focus is the new IQ. — Cal Newport",
    "Start where you are. Use what you have.",
    "Small daily improvements lead to stunning results.",
    "The secret of getting ahead is getting started.",
    "Discipline is choosing what you want most over what you want now.",
  ];
  const quote = quotes[todaySessions % quotes.length];

  const isFocusMode = mode === "focus" || mode === "custom";
  const focusPoints = calculateFocusPoints(mode === "custom" ? customMinutes : (isFocusMode ? PRESET_MODES.focus.minutes : 0));

  // SVG circle params
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress / 100);

  // ===== DEEP FOCUS LOCKDOWN =====
  if (focusMode && isRunning) {
    const actualMinutesElapsed = sessionStartedAt > 0 ? Math.round((Date.now() - sessionStartedAt) / 60000) : 0;
    const estimatedPoints = calculateFocusPoints(actualMinutesElapsed);
    const lockdownRadius = 46;
    const lockdownCircumference = 2 * Math.PI * lockdownRadius;
    const lockdownOffset = lockdownCircumference * (1 - progress / 100);

    return (
      <div className="fixed inset-0 z-[200] flex flex-col transition-all duration-500" style={{ background: currentTheme.gradient }}>
        {/* Ambient particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 4 + Math.random() * 6,
                height: 4 + Math.random() * 6,
                background: `hsla(${16 + Math.random() * 20}, 85%, 58%, ${0.1 + Math.random() * 0.15})`,
              }}
              initial={{ x: Math.random() * 400, y: Math.random() * 800, opacity: 0 }}
              animate={{ y: [Math.random() * 800, -20], opacity: [0, 0.4, 0] }}
              transition={{ duration: 8 + Math.random() * 6, repeat: Infinity, delay: i * 1.2 }}
            />
          ))}
          {/* Subtle radial glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-[0.06]"
            style={{ background: "radial-gradient(circle, hsl(16 85% 58%), transparent 70%)" }} />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-[env(safe-area-inset-top,16px)] pb-2">
          <div>
            <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-medium">Deep Focus</p>
          </div>
          <div className="flex items-center gap-2">
            {soundIdx > 0 && (
              <button onClick={() => toggleSound(0)} className="text-[10px] text-white/40 flex items-center gap-1 hover:text-white/60 transition-colors px-2 py-1 rounded-full bg-white/5">
                <Volume2 className="h-3 w-3" /> {SOUNDS[soundIdx].icon}
              </button>
            )}
            <button onClick={() => setShowSounds(!showSounds)} className="text-[10px] text-white/40 flex items-center gap-1 hover:text-white/60 transition-colors px-2 py-1 rounded-full bg-white/5">
              <Music className="h-3 w-3" /> Sounds
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
          {/* Timer Ring */}
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-72 h-72 mb-6">
            {/* Outer glow */}
            <div className="absolute inset-[-8px] rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, hsl(16 85% 58%) 0%, transparent 70%)" }} />
            
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background ring */}
              <circle cx="50" cy="50" r={lockdownRadius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
              {/* Progress ring */}
              <motion.circle
                cx="50" cy="50" r={lockdownRadius} fill="none"
                stroke="url(#lockdownGrad)"
                strokeWidth="3.5" strokeLinecap="round"
                strokeDasharray={lockdownCircumference}
                animate={{ strokeDashoffset: lockdownOffset }}
                transition={{ duration: 0.5 }}
              />
              <defs>
                <linearGradient id="lockdownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(16, 85%, 58%)" />
                  <stop offset="100%" stopColor="hsl(0, 85%, 55%)" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-display font-bold tabular-nums text-white tracking-tight">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </span>
              <span className="text-xs text-white/40 mt-2 font-medium tracking-wide uppercase">Focus Session</span>
              {linkedTask && (
                <span className="text-xs text-white/50 mt-1.5 flex items-center gap-1">
                  🎯 {linkedTask.label}
                </span>
              )}
            </div>
          </motion.div>

          {/* Points earned */}
          {estimatedPoints > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/5 mb-4">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-white/60 font-medium">+{estimatedPoints} pts earned</span>
            </motion.div>
          )}

          {/* Quote */}
          <p className="text-xs text-white/30 italic max-w-[280px] text-center mb-8 leading-relaxed">"{quote}"</p>

          {/* End Session button */}
          <motion.div whileTap={{ scale: 0.95 }} className="relative z-20">
            <Button
              size="lg"
              onClick={() => setShowExitConfirm(true)}
              className="border border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white px-8 rounded-2xl h-12 backdrop-blur-sm"
              variant="ghost"
            >
              <Square className="h-4 w-4 mr-2" /> End Session
            </Button>
          </motion.div>

          {/* Sounds panel */}
          <AnimatePresence>
            {showSounds && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 gap-2 max-w-xs mx-auto overflow-hidden mt-6 relative z-20">
                {SOUNDS.map((s, i) => (
                  <button key={s.name} onClick={() => { toggleSound(i); setShowSounds(false); }}
                    className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${soundIdx === i ? "bg-primary/20 text-white border border-primary/30" : "bg-white/5 text-white/50 hover:bg-white/10 border border-transparent"}`}>
                    {s.icon} {s.name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative z-20 mt-4">
            <FocusFeedbackForm />
          </div>
        </div>

        <FocusExitConfirmDialog
          showExitConfirm={showExitConfirm}
          onContinue={() => setShowExitConfirm(false)}
          onExit={() => { setShowExitConfirm(false); endSessionEarly(); }}
        />

        <SmartBreakPopup
          show={showBreakPopup}
          focusMinutes={completedFocusMinutes}
          onStartBreak={handleStartBreak}
          onDismiss={() => setShowBreakPopup(false)}
        />
      </div>
    );
  }

  // ===== NORMAL UI =====
  return (
    <PageTransition>
      <div className="max-w-lg mx-auto pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-display font-bold tracking-tight">Focus Timer</h1>
        </div>


        {/* Settings & Feedback pills */}
        <div className="flex items-center gap-2 mb-5">
          <FocusSettingsHub />
          <FocusFeedbackForm />
        </div>

        {/* Focus / Stats toggle */}
        <div className="flex p-1 rounded-2xl bg-muted/60 mb-5">
          {(["focus", "stats"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                activeTab === tab ? "text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="timerTabBg"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-[hsl(0,85%,50%)] shadow-md"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 capitalize">{tab}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "stats" ? (
            <motion.div key="stats" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <FocusStatsTab />
            </motion.div>
          ) : (
            <motion.div key="focus" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="space-y-4">

              {/* Mode selector */}
              <div className="flex p-1 rounded-2xl bg-muted/40 gap-1">
                {([
                  { key: "focus" as Mode, label: "Focus", icon: <Zap className="h-3.5 w-3.5" /> },
                  { key: "shortBreak" as Mode, label: "Break", icon: <Coffee className="h-3.5 w-3.5" /> },
                  { key: "custom" as Mode, label: "Custom", icon: <Clock className="h-3.5 w-3.5" /> },
                ]).map((m) => (
                  <button
                    key={m.key}
                    onClick={() => attemptSwitchMode(m.key)}
                    className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all duration-300 ${
                      mode === m.key ? "text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {mode === m.key && (
                      <motion.div
                        layoutId="modeBg"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-[hsl(0,85%,50%)] shadow-sm"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1">{m.icon} {m.label}</span>
                  </button>
                ))}
              </div>

              {/* Custom time input */}
              <AnimatePresence>
                {mode === "custom" && !isRunning && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="rounded-2xl bg-card border border-border/50 p-4 shadow-sm">
                      <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Set Duration</p>
                      <div className="flex gap-2 flex-wrap">
                        {[30, 45, 60, 90, 120].map((m) => (
                          <button key={m}
                            onClick={() => { setCustomMinutes(m); setTimeLeft(m * 60); setInitialSeconds(m * 60); }}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                              customMinutes === m
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-muted/60 text-muted-foreground hover:bg-muted"
                            }`}>
                            {m >= 60 ? `${m / 60}h` : `${m}m`}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Input type="number" min={1} max={240} value={customMinutes}
                          onChange={(e) => setCustomMinutes(parseInt(e.target.value) || 1)}
                          className="w-24 rounded-xl" />
                        <Button variant="outline" size="sm" onClick={applyCustomTime} className="rounded-xl">Set</Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Points message */}
              {isFocusMode && !isRunning && focusPoints > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-1.5 py-2">
                  <span className="text-xs text-muted-foreground">
                    🔥 Complete this session to earn <span className="font-bold text-primary">+{focusPoints} points</span>
                  </span>
                </motion.div>
              )}

              {/* Main Timer Card */}
              <div className="relative rounded-3xl bg-card border border-border/40 shadow-lg overflow-hidden">
                {/* Subtle top glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 opacity-[0.08] pointer-events-none"
                  style={{ background: "radial-gradient(ellipse, hsl(16 85% 58%), transparent 70%)" }} />

                <div className="p-6 flex flex-col items-center gap-4">
                  {/* Timer circle */}
                  <div className="relative w-60 h-60">
                    {/* Outer glow ring */}
                    <div className="absolute inset-[-6px] rounded-full opacity-20 pointer-events-none"
                      style={{ background: `radial-gradient(circle, hsl(16 85% 58%) 0%, transparent 70%)` }} />

                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      {/* Track */}
                      <circle cx="50" cy="50" r={radius} fill="none" className="stroke-muted/50" strokeWidth="4" />
                      {/* Progress */}
                      <motion.circle
                        cx="50" cy="50" r={radius} fill="none"
                        stroke="url(#timerGradient)"
                        strokeWidth="4.5" strokeLinecap="round"
                        strokeDasharray={circumference}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 0.5, ease: "linear" }}
                      />
                      <defs>
                        <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="hsl(16, 85%, 58%)" />
                          <stop offset="100%" stopColor="hsl(0, 85%, 50%)" />
                        </linearGradient>
                      </defs>
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-display font-bold tabular-nums tracking-tight">
                        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                      </span>
                      <span className="text-xs text-muted-foreground mt-1.5 font-medium">
                        {mode === "custom" ? `Custom (${customMinutes}m)` : PRESET_MODES[mode as Exclude<Mode, "custom">]?.label || "Focus"}
                      </span>
                      {linkedTask && (
                        <span className="text-[10px] text-primary mt-1 font-semibold truncate max-w-[160px]">🎯 {linkedTask.label}</span>
                      )}
                    </div>
                  </div>

                  {/* Completion animation */}
                  <AnimatePresence>
                    {timerCompleteAnimation && (
                      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.3, 1], opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="text-4xl">
                        🎉
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Start + Reset + Stop (during break) */}
                  <div className="flex items-center gap-3">
                    {isRunning && mode === "shortBreak" ? (
                      <motion.div whileTap={{ scale: 0.95 }}>
                        <Button size="lg" onClick={reset}
                          className="px-10 h-12 rounded-2xl bg-destructive text-destructive-foreground shadow-lg font-semibold text-sm">
                          <Square className="h-4 w-4 mr-2" /> Stop Break
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div whileTap={{ scale: 0.95 }}>
                        <Button size="lg" onClick={requestStart} disabled={isRunning}
                          className="px-10 h-12 rounded-2xl bg-gradient-to-r from-primary to-[hsl(0,85%,50%)] text-primary-foreground shadow-lg font-semibold text-sm">
                          <Play className="h-4 w-4 mr-2" /> {mode === "shortBreak" ? "Start Break" : "Start Focus"}
                        </Button>
                      </motion.div>
                    )}
                    <motion.div whileTap={{ scale: 0.9 }}>
                      <button onClick={reset}
                        className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Ambient Sounds card */}
              {isFocusMode && (
                <div className="rounded-2xl bg-card border border-border/40 shadow-sm overflow-hidden">
                  <button onClick={() => setShowSounds(!showSounds)}
                    className="w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-muted/30">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Music className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">Ambient Sounds</p>
                      <p className="text-xs text-muted-foreground">
                        {soundIdx > 0 ? `${SOUNDS[soundIdx].icon} ${SOUNDS[soundIdx].name} playing` : "Choose background sounds"}
                      </p>
                    </div>
                    {soundIdx > 0 && <span className="w-2 h-2 rounded-full bg-[hsl(var(--success))]" />}
                  </button>
                  <AnimatePresence>
                    {showSounds && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="grid grid-cols-2 gap-2 p-4 pt-0">
                          {SOUNDS.map((s, i) => (
                            <button key={s.name} onClick={() => toggleSound(i)}
                              className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                                soundIdx === i
                                  ? "bg-primary/15 text-primary border border-primary/20"
                                  : "bg-muted/40 text-muted-foreground hover:bg-muted/70 border border-transparent"
                              }`}>
                              {s.icon} {s.name}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Blocked apps card */}
              {isFocusMode && settings.blockedApps.length > 0 && (
                <div className="rounded-2xl bg-card border border-border/40 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <Shield className="h-3.5 w-3.5 text-destructive" />
                    </div>
                    <p className="text-sm font-semibold">Blocked During Focus</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {settings.blockedApps.slice(0, 8).map((app) => (
                      <span key={app} className="px-2.5 py-1 text-[10px] font-medium rounded-full bg-destructive/8 text-destructive/80 border border-destructive/10">
                        {app}
                      </span>
                    ))}
                    {settings.blockedApps.length > 8 && (
                      <span className="px-2.5 py-1 text-[10px] font-medium rounded-full bg-muted text-muted-foreground">
                        +{settings.blockedApps.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Today's Focus card */}
              <div className="rounded-2xl bg-card border border-border/40 shadow-sm p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 text-center">Today's Focus</p>
                <div className="flex justify-center gap-8 mb-4">
                  <div className="text-center">
                    <p className="font-display font-bold text-3xl text-primary">{todaySessions}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Sessions</p>
                  </div>
                  <div className="w-px bg-border/60" />
                  <div className="text-center">
                    <p className="font-display font-bold text-3xl">
                      {todayMinutes >= 60 ? `${(todayMinutes / 60).toFixed(1)}h` : `${todayMinutes}m`}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Total Focus</p>
                  </div>
                </div>
                {/* Progress dots */}
                <div className="flex justify-center gap-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <motion.div key={i}
                      initial={i === todaySessions - 1 ? { scale: 0 } : false}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                      className={`w-4 h-4 rounded-full transition-colors ${
                        i < todaySessions
                          ? "bg-gradient-to-br from-primary to-[hsl(0,85%,50%)] shadow-sm"
                          : "bg-muted/60"
                      }`}
                    />
                  ))}
                </div>
                {/* Mini progress bar */}
                <div className="mt-3 h-1 rounded-full bg-muted/50 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-[hsl(0,85%,50%)]"
                    animate={{ width: `${Math.min(100, (todaySessions / 8) * 100)}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Motivational Quotes */}
              <MotivationalQuotes />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dialogs */}
        <AlertDialog open={!!confirmSwitch} onOpenChange={(o) => !o && setConfirmSwitch(null)}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display">Stop Custom Session?</AlertDialogTitle>
              <AlertDialogDescription>You are currently in a Custom Focus Session. Switch modes?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">No, Continue</AlertDialogCancel>
              <AlertDialogAction onClick={() => confirmSwitch && doSwitchMode(confirmSwitch)} className="bg-gradient-to-r from-primary to-[hsl(0,85%,50%)] text-primary-foreground rounded-xl">Yes, Switch</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <SmartBreakPopup show={showBreakPopup} focusMinutes={completedFocusMinutes} onStartBreak={handleStartBreak} onDismiss={() => setShowBreakPopup(false)} />

        <TaskLinkPopup open={showTaskLink} onSelect={handleTaskLinkSelect} onClose={() => setShowTaskLink(false)} />
      </div>
    </PageTransition>
  );
}
