import { motion } from "framer-motion";
import { Gift, Loader2, PlayCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRewardedAd } from "@/lib/use-rewarded-ad";
import { usePremium } from "@/lib/use-premium";
import { cn } from "@/lib/utils";

interface RewardedAdCardProps {
  className?: string;
  /** Hide while a focus session is running */
  disabled?: boolean;
}

export function RewardedAdCard({ className, disabled }: RewardedAdCardProps) {
  const { watchAd, busy, status, rewardPoints, available } = useRewardedAd();
  const { isPremium, loading } = usePremium();

  if (loading || isPremium || disabled) return null;

  const label =
    status === "loading" ? "Loading ad…" : status === "showing" ? "Watching…" : status === "claiming" ? "Adding points…" : `Watch Ad → Earn ${rewardPoints} Points`;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }}>
      <Card className={cn("p-4 rounded-2xl border-primary/20 bg-gradient-to-br from-primary/5 to-transparent", className)}>
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Gift className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-tight">Free bonus points</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Watch a short video ad and earn <span className="font-medium text-foreground">{rewardPoints} points</span> once it finishes. Totally optional.
            </p>
            <Button onClick={watchAd} disabled={busy} className="mt-3 w-full rounded-xl" size="sm">
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlayCircle className="h-4 w-4 mr-2" />}
              {label}
            </Button>
            {!available && (
              <p className="text-[11px] text-muted-foreground mt-2">Available in the Android app.</p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default RewardedAdCard;
