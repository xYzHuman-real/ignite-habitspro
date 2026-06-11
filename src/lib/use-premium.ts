import { useProfile } from "@/lib/supabase-hooks";

export type PremiumStatus = {
  isPremium: boolean;
  isTrial: boolean;
  isPaid: boolean;
  plan: "monthly" | "yearly" | null;
  trialDaysLeft: number;
  premiumUntil: Date | null;
  loading: boolean;
};

export function usePremium(): PremiumStatus {
  const { profile, isLoading } = useProfile();

  const now = Date.now();
  const trialEnds = profile?.trial_ends_at ? new Date(profile.trial_ends_at).getTime() : 0;
  const premiumUntil = profile?.premium_until ? new Date(profile.premium_until).getTime() : 0;

  const isTrial = trialEnds > now && profile?.subscription_tier !== "premium";
  const isPaid = profile?.subscription_tier === "premium" && premiumUntil > now;
  const isPremium = isTrial || isPaid;

  const trialDaysLeft = isTrial ? Math.ceil((trialEnds - now) / (1000 * 60 * 60 * 24)) : 0;

  return {
    isPremium,
    isTrial,
    isPaid,
    plan: (profile?.subscription_plan as "monthly" | "yearly" | null) ?? null,
    trialDaysLeft,
    premiumUntil: premiumUntil ? new Date(premiumUntil) : null,
    loading: isLoading,
  };
}

// Feature flags — gate any premium feature through this map.
export const PREMIUM_FEATURES = {
  aiPlanner: "AI Daily Planner",
  unlimitedHabits: "Unlimited Habits (Free: 5)",
  unlimitedFocusRooms: "Unlimited Focus Rooms",
  advancedReports: "Advanced Weekly Reports",
  customThemes: "Custom Focus Themes",
  exportData: "Data Export",
  prioritySupport: "Priority Support",
  adFree: "Ad-Free Experience",
} as const;

export const FREE_HABIT_LIMIT = 5;
