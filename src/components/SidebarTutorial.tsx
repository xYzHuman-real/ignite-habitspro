import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft } from "lucide-react";

const KEY = "sidebar_tutorial_seen";

export function SidebarTutorial() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(KEY)) {
      const t = setTimeout(() => setShow(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(KEY, "1");
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="fixed top-16 left-3 z-[80] max-w-[260px]"
        >
          <div className="relative rounded-xl bg-gradient-primary p-3 pr-8 text-primary-foreground shadow-glow-primary">
            <button
              onClick={dismiss}
              className="absolute top-1.5 right-1.5 p-1 rounded hover:bg-white/20"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-start gap-2">
              <ArrowLeft className="h-4 w-4 mt-0.5 shrink-0 animate-pulse" />
              <p className="text-xs leading-snug">
                Tap the menu icon to open the sidebar — Goals, Journal, AI Planner, Community and more live there.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
