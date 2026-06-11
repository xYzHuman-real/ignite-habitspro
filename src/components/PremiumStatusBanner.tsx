import { motion } from "framer-motion";
import { Sparkles, Crown, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePremium } from "@/lib/use-premium";

/** Compact banner shown on Dashboard while trial is active or to nudge free users to upgrade. */
export function PremiumStatusBanner() {
  const navigate = useNavigate();
  const { isTrial, trialDaysLeft, isPaid, loading } = usePremium();

  if (loading || isPaid) return null;

  if (isTrial) {
    return (
      <motion.button
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => navigate("/pricing")}
        className="w-full p-3 rounded-xl bg-gradient-to-r from-primary/15 via-accent/10 to-primary/5 border border-primary/30 flex items-center gap-3 hover:border-primary/60 transition-colors text-left"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow-primary shrink-0">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">
            {trialDaysLeft} {trialDaysLeft === 1 ? "day" : "days"} left of Premium trial
          </p>
          <p className="text-xs text-muted-foreground">Subscribe to keep unlimited access</p>
        </div>
        <ArrowRight className="h-4 w-4 text-primary shrink-0" />
      </motion.button>
    );
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate("/pricing")}
      className="w-full p-3 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 flex items-center gap-3 hover:border-primary/50 transition-colors text-left"
    >
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
        <Crown className="h-4 w-4 text-primary-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">Go Premium — from ₹83/mo</p>
        <p className="text-xs text-muted-foreground">Unlimited habits, AI planner, no ads</p>
      </div>
      <ArrowRight className="h-4 w-4 text-primary shrink-0" />
    </motion.button>
  );
}
