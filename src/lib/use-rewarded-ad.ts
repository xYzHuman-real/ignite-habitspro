import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { celebratePremium } from "@/lib/celebrate";
import { hapticSuccess } from "@/lib/haptics";
import { ADMOB_CONFIG, getRewardedAdUnitId, initAdMob, isNativeAdMob, useTestAds } from "@/lib/admob";

type Status = "idle" | "loading" | "showing" | "claiming";

const isReactNativeWebView = () =>
  typeof window !== "undefined" && typeof (window as any).ReactNativeWebView?.postMessage === "function";

function postToNative(message: object) {
  try {
    (window as any).ReactNativeWebView?.postMessage(JSON.stringify(message));
  } catch {}
}

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
          description: result?.reason === "daily_limit" ? "Come back tomorrow to earn more bonus points." : "This ad has already been rewarded.",
        });
        return;
      }
      await qc.invalidateQueries({ queryKey: ["profile", user?.id] });
      hapticSuccess();
      celebratePremium();
      toast({ title: `🎉 +${result.points ?? ADMOB_CONFIG.rewardPoints} Points earned!`, description: "Your points balance has been updated." });
    },
    [qc, toast, user?.id],
  );

  const watchAd = useCallback(async () => {
    if (status !== "idle") return;
    if (!available) {
      toast({ title: "Available in the mobile app", description: "Rewarded ads run inside the Ignite Habit Pro Android app." });
      return;
    }

    const impressionId = `ad_${crypto.randomUUID()}`;

    try {
      setStatus("loading");
      const ready = await initAdMob();
      if (!ready) throw new Error("sdk");

      if (isReactNativeWebView()) {
        setStatus("showing");
        const reward = await new Promise<{ amount: number; type?: string } | null>((resolve) => {
          let settled = false;
          const finish = (value: { amount: number; type?: string } | null) => {
            if (settled) return;
            settled = true;
            window.removeEventListener("igniteNativeMessage", onMessage as EventListener);
            resolve(value);
          };
          const onMessage = (event: Event) => {
            const detail = (event as CustomEvent).detail;
            if (detail?.type === "rewarded_result") {
              finish(detail.rewarded === true ? { amount: Number(detail.amount ?? 1), type: detail.rewardType } : null);
            }
          };
          window.addEventListener("igniteNativeMessage", onMessage as EventListener);
          postToNative({ type: "show_rewarded", impression_id: impressionId, use_test_ads: useTestAds });
          window.setTimeout(() => finish(null), 60000);
        });

        if (!reward) {
          setStatus("idle");
          toast({ title: "No reward earned", description: "You need to watch the full ad to earn points." });
          return;
        }

        await claim(impressionId);
        return;
      }

      const { AdMob } = await import("@capacitor-community/admob");
      await AdMob.prepareRewardVideoAd({ adId: getRewardedAdUnitId(), isTesting: useTestAds });
      setStatus("showing");
      const reward = await AdMob.showRewardVideoAd();
      if (!reward || typeof reward.amount !== "number") {
        setStatus("idle");
        toast({ title: "No reward earned", description: "You need to watch the full ad to earn points." });
        return;
      }
      await claim(impressionId);
    } catch (err) {
      console.warn("[AdMob] rewarded ad error", err);
      toast({ title: "Ad unavailable right now", description: "No points were awarded. Please try again in a bit.", variant: "destructive" });
    } finally {
      setStatus("idle");
    }
  }, [available, claim, status, toast]);

  return { watchAd, available, status, busy: status !== "idle", rewardPoints: ADMOB_CONFIG.rewardPoints };
}
