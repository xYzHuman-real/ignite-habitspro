import { motion, AnimatePresence } from "framer-motion";
import { Coffee, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SmartBreakPopupProps {
  show: boolean;
  focusMinutes: number;
  onStartBreak: (breakMinutes: number) => void;
  onDismiss: () => void;
}

function getBreakSuggestion(focusMinutes: number): { breakMinutes: number; label: string } {
  if (focusMinutes >= 90) return { breakMinutes: 15, label: "long break" };
  if (focusMinutes >= 60) return { breakMinutes: 10, label: "break" };
  if (focusMinutes >= 45) return { breakMinutes: 7, label: "break" };
  return { breakMinutes: 5, label: "short break" };
}

export function SmartBreakPopup({ show, focusMinutes, onStartBreak, onDismiss }: SmartBreakPopupProps) {
  const { breakMinutes, label } = getBreakSuggestion(focusMinutes);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Card className="p-6 max-w-sm text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-5xl"
              >
                🎉
              </motion.div>
              <h2 className="font-display font-bold text-xl">Great Work!</h2>
              <p className="text-muted-foreground">
                You focused for <span className="font-semibold text-foreground">{focusMinutes} minutes</span>.
                Take a {breakMinutes} minute {label}.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => onStartBreak(breakMinutes)}
                  className="bg-gradient-primary text-primary-foreground shadow-glow-primary"
                >
                  <Coffee className="h-4 w-4 mr-2" />
                  Start {breakMinutes}m Break
                </Button>
                <Button variant="outline" onClick={onDismiss}>
                  Skip
                </Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
