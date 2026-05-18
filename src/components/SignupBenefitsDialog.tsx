import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles, Cloud, Users, Trophy, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

const SHOWN_KEY = "signup_prompt_shown_at";
const GUEST_KEY = "guest_mode";

export function isGuest() {
  return typeof window !== "undefined" && localStorage.getItem(GUEST_KEY) === "1" && !localStorage.getItem("sb-access-token");
}

export function enterGuestMode() {
  localStorage.setItem(GUEST_KEY, "1");
  localStorage.setItem("guest_started_at", Date.now().toString());
}

export function exitGuestMode() {
  localStorage.removeItem(GUEST_KEY);
  localStorage.removeItem("guest_started_at");
  localStorage.removeItem(SHOWN_KEY);
}

interface Props {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  force?: boolean;
}

export function SignupBenefitsDialog({ open: controlledOpen, onOpenChange, force }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (controlledOpen !== undefined) {
      setOpen(controlledOpen);
      return;
    }
    if (user || force) return;
    if (!isGuest()) return;
    const startedAt = parseInt(localStorage.getItem("guest_started_at") || "0", 10);
    const shownAt = parseInt(localStorage.getItem(SHOWN_KEY) || "0", 10);
    const now = Date.now();
    const tenMin = 10 * 60 * 1000;
    const sixHr = 6 * 60 * 60 * 1000;

    const maybeShow = () => {
      if (Date.now() - startedAt >= tenMin && (!shownAt || Date.now() - shownAt > sixHr)) {
        setOpen(true);
        localStorage.setItem(SHOWN_KEY, Date.now().toString());
      }
    };

    if (now - startedAt < tenMin) {
      const t = setTimeout(maybeShow, tenMin - (now - startedAt));
      return () => clearTimeout(t);
    }
    maybeShow();
  }, [user, controlledOpen, force]);

  useEffect(() => {
    if (force) setOpen(true);
  }, [force]);

  const handleSignup = () => {
    setOpen(false);
    onOpenChange?.(false);
    navigate("/auth");
  };

  const handleClose = (v: boolean) => {
    setOpen(v);
    onOpenChange?.(v);
  };

  if (user) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="rounded-2xl bg-gradient-primary p-6 text-primary-foreground shadow-glow-primary"
        >
          <button
            onClick={() => handleClose(false)}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/15 hover:bg-white/25"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-6 w-6" />
            <h2 className="text-xl font-display font-bold">Save your progress</h2>
          </div>
          <p className="text-sm text-primary-foreground/90 mb-5">
            You're using Ignite as a guest. Create a free account to unlock everything below.
          </p>

          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-3">
              <Cloud className="h-5 w-5 mt-0.5 shrink-0" />
              <span className="text-sm">Sync habits, todos & streaks across all your devices</span>
            </li>
            <li className="flex items-start gap-3">
              <Users className="h-5 w-5 mt-0.5 shrink-0" />
              <span className="text-sm">Join the community, focus rooms, and partner up</span>
            </li>
            <li className="flex items-start gap-3">
              <Trophy className="h-5 w-5 mt-0.5 shrink-0" />
              <span className="text-sm">Earn XP, climb the leaderboard, and shop rewards</span>
            </li>
          </ul>

          <div className="flex gap-2">
            <Button onClick={handleSignup} className="flex-1 bg-white text-primary hover:bg-white/90 font-semibold">
              Create free account
            </Button>
            <Button onClick={() => handleClose(false)} variant="ghost" className="text-primary-foreground hover:bg-white/15">
              Later
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
