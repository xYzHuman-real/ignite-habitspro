import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ArrowLeft } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { startBlockedAppMonitor } from "@/lib/blocked-app-monitor";

const TIMER_STORAGE_KEY = "timer_state";

const MESSAGES = [
  "Your future self will thank you.",
  "You started this session for a reason.",
  "Stay focused. You're doing great.",
  "One distraction less. One step closer.",
  "Deep work is a superpower. Keep going.",
];

function isFocusActive(): boolean {
  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!raw) return false;
    const state = JSON.parse(raw) as { endTime: number; mode: string; paused?: boolean };
    if (state.paused) return false;
    if (state.mode !== "focus" && state.mode !== "custom") return false;
    return state.endTime > Date.now();
  } catch {
    return false;
  }
}

function endFocusSession() {
  try { localStorage.removeItem(TIMER_STORAGE_KEY); } catch {}
  window.dispatchEvent(new CustomEvent("focus-protection:end"));
}

export function FocusProtectionOverlay() {
  const [visible, setVisible] = useState(false);
  const [wasHidden, setWasHidden] = useState(false);
  const monitorStopRef = useRef<null | (() => void)>(null);
  const message = useMemo(
    () => MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
    [visible]
  );

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        setWasHidden(true);
      } else if (wasHidden) {
        setWasHidden(false);
        if (isFocusActive()) setVisible(true);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    let cleanup: (() => void) | undefined;
    if (Capacitor.isNativePlatform()) {
      import("@capacitor/app").then(({ App }) => {
        const sub = App.addListener("appStateChange", ({ isActive }) => {
          if (!isActive) setWasHidden(true);
          else if (wasHidden) {
            setWasHidden(false);
            if (isFocusActive()) setVisible(true);
          }
        });
        cleanup = () => { sub.then(s => s.remove()); };
      }).catch(() => {});
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      cleanup?.();
    };
  }, [wasHidden]);

  // Native blocked-app monitor: poll foreground app while a focus session is
  // active and surface the overlay when a blocked package is opened.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      const active = isFocusActive();
      if (active && !monitorStopRef.current) {
        monitorStopRef.current = await startBlockedAppMonitor(() => setVisible(true));
      } else if (!active && monitorStopRef.current) {
        monitorStopRef.current();
        monitorStopRef.current = null;
      }
    };
    tick();
    const interval = window.setInterval(tick, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      monitorStopRef.current?.();
      monitorStopRef.current = null;
    };
  }, []);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="focus-protect"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[10000] flex flex-col items-center justify-center px-6 text-white"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, #1f1408 0%, #0a0604 70%, #000 100%)",
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[420px] h-[420px] rounded-full bg-primary/30 blur-[140px]" />
        </div>

        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-20 h-20 rounded-3xl flex items-center justify-center mb-8"
          style={{
            background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
            boxShadow: "0 30px 60px -20px rgba(249,115,22,0.6)",
          }}
        >
          <Shield className="h-10 w-10 text-white" strokeWidth={2} />
        </motion.div>

        <motion.p
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="relative z-10 text-[11px] font-semibold tracking-[0.22em] uppercase text-primary/90 mb-3"
        >
          Focus Protected
        </motion.p>

        <motion.h1
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="relative z-10 text-[28px] leading-[1.15] font-display font-bold tracking-tight text-center max-w-sm"
        >
          {message}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="relative z-10 mt-3 text-[15px] text-white/60 text-center max-w-xs"
        >
          You're in a focus session. Get back to what matters.
        </motion.p>

        <div className="relative z-10 mt-10 w-full max-w-sm space-y-3">
          <button
            onClick={() => setVisible(false)}
            className="w-full h-14 rounded-2xl text-[16px] font-semibold tracking-tight text-white shadow-[0_10px_30px_-10px_rgba(249,115,22,0.7)]"
            style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" }}
          >
            Return to Focus
          </button>
          <button
            onClick={() => { endFocusSession(); setVisible(false); }}
            className="w-full h-12 rounded-2xl text-[14px] font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            End Session
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
