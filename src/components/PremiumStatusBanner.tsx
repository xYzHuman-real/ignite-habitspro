import { motion } from "framer-motion";
import { Sparkles, Crown, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePremium } from "@/lib/use-premium";

/** Compact banner shown on Dashboard while trial is active or to nudge free users to upgrade. */
export function PremiumStatusBanner() {
  const navigate = useNavigate();
  const { isTrial, trialDaysLeft, isPaid, loading } = usePremium();

  if (loading || isPaid) return null;

  const trial = isTrial;
  const Icon = trial ? Sparkles : Crown;
  const title = trial
    ? `${trialDaysLeft} ${trialDaysLeft === 1 ? "day" : "days"} left of Premium trial`
    : "Go Premium";
  const sub = trial ? "Subscribe to keep unlimited access" : "Unlimited habits, AI planner, no ads";

  return (
    <motion.button
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={() => navigate("/pricing")}
      className="w-full p-3.5 rounded-2xl bg-card border border-border/60 flex items-center gap-3 hover:border-primary/40 transition-colors text-left"
    >
      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-foreground">{title}</p>
        <p className="text-[12px] text-muted-foreground mt-0.5">{sub}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </motion.button>
  );
}
