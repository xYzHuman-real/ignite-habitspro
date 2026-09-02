import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { celebratePremium } from "@/lib/celebrate";
import { hapticSuccess } from "@/lib/haptics";
import { ADMOB_CONFIG, getRewardedAdUnitId, initAdMob, isNativeAdMob, useTestAds } from "@/lib/admob";

type Status = "idle" | "loading" | "showing" | "claiming";

/**
 * Rewarded ad flow: load → show → AdMob confirms reward → server grants points.
 * Points are only awarded by the secure `claim_ad_reward` function, once per impression.
 */
export function useRewardedAd() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [status, setStatus] = useState<Status>("idle");

  const available = isNativeAdMob();

  const claim = useCallback(
    async (impressionId: string) => {
      setStatus("claiming");
      const { data, error } = await supabase.rpc("claim_ad_reward", { _impression_id: impressionId });
      if (error) throw error;
      const result = data as { awarded: boolean; reason?: string; points?: number };
      if (!result?.awarded) {
        toast({
          title: result?.reason === "daily_limit" ? "Daily ad limit reached" : "Reward already claimed",
          description:
            result?.reason === "daily_limit"
              ? "Come back tomorrow to earn more bonus points."
              : "This ad has already been rewarded.",
        });
        return;
      }
      await qc.invalidateQueries({ queryKey: ["profile", user?.id] });
      hapticSuccess();
      celebratePremium();
      toast({
        title: `🎉 +${result.points ?? ADMOB_CONFIG.rewardPoints} Points earned!`,
        description: "Your points balance has been updated.",
      });
    },
    [qc, toast, user?.id],
  );

  const watchAd = useCallback(async () => {
    if (status !== "idle") return;

    if (!available) {
      toast({
        title: "Available in the mobile app",
        description: "Rewarded ads run inside the Ignite Habit Pro Android app.",
      });
      return;
    }

    const impressionId = `ad_${crypto.randomUUID()}`;

    try {
      setStatus("loading");
      const ready = await initAdMob();
      if (!ready) throw new Error("sdk");

      const { AdMob } = await import("@capacitor-community/admob");
      await AdMob.prepareRewardVideoAd({
        adId: getRewardedAdUnitId(),
        isTesting: useTestAds,
      });

      setStatus("showing");
      const reward = await AdMob.showRewardVideoAd();

      // Only a real reward object means AdMob confirmed the ad was completed.
      if (!reward || typeof reward.amount !== "number") {
        setStatus("idle");
        toast({
          title: "No reward earned",
          description: "You need to watch the full ad to earn points.",
        });
        return;
      }

      await claim(impressionId);
    } catch (err) {
      console.warn("[AdMob] rewarded ad error", err);
      toast({
        title: "Ad unavailable right now",
        description: "No points were awarded. Please try again in a bit.",
        variant: "destructive",
      });
    } finally {
      setStatus("idle");
    }
  }, [available, claim, status, toast]);

  return {
    watchAd,
    available,
    status,
    busy: status !== "idle",
    rewardPoints: ADMOB_CONFIG.rewardPoints,
  };
}
