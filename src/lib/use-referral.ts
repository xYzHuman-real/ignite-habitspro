import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

const REF_KEY = "pending_referral_code";

/** Stash a `?ref=CODE` from any URL so we can apply it after signup/login. */
export function captureReferralFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref && ref.length >= 4 && ref.length <= 10) {
      localStorage.setItem(REF_KEY, ref.toUpperCase());
    }
  } catch {/* ignore */}
}

/** Apply a stored referral code once the user is signed in. Safe to call repeatedly. */
export function useReferralAutoApply() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const applied = useRef(false);

  useEffect(() => {
    if (!user || applied.current) return;
    const code = localStorage.getItem(REF_KEY);
    if (!code) return;
    applied.current = true;

    (async () => {
      const { data, error } = await supabase.rpc("apply_referral" as any, { code });
      localStorage.removeItem(REF_KEY);
      if (error) {
        // Silent failure — user may already be referred, or code invalid. Don't nag.
        return;
      }
      await qc.invalidateQueries({ queryKey: ["profile", user.id] });
      toast({
        title: "🎉 Welcome bonus unlocked!",
        description: `Thanks to ${data ?? "your friend"}, you got 1 month of Premium free.`,
      });
    })();
  }, [user, qc]);
}
