import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

// Checkmark animation for habit completion
export function CheckmarkAnimation({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <motion.span
            initial={{ scale: 1.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="text-2xl"
          >
            ✅
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Fire animation for streak increase
export function FireAnimation({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          initial={{ scale: 0, y: 10 }}
          animate={{ scale: [0, 1.3, 1], y: [10, -5, 0] }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-block"
        >
          🔥
        </motion.span>
      )}
    </AnimatePresence>
  );
}

// Floating points animation
export function FloatingPoints({ points, show }: { points: number; show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -40 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute -top-2 right-0 text-sm font-bold text-primary pointer-events-none z-50"
        >
          +{points} pts
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Celebration animation for level up
export function CelebrationAnimation({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1] }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-[200]"
        >
          <div className="text-6xl">🎉</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Button with ripple/bounce effect
export function AnimatedButton({
  children,
  onClick,
  className,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </motion.button>
  );
}
