import { usePremium } from "@/lib/use-premium";
import { cn } from "@/lib/utils";

interface AdSlotProps {
  /** Slot identifier — match this to an AdMob/AdSense unit later */
  slotId: string;
  size?: "banner" | "rectangle";
  className?: string;
}

/**
 * Placeholder ad slot. Hides automatically for Premium users (including trial).
 * Wire real AdMob/AdSense units inside the inner div when ready — the gating logic
 * around this component stays the same.
 */
export function AdSlot({ slotId, size = "banner", className }: AdSlotProps) {
  const { isPremium, loading } = usePremium();
  if (loading || isPremium) return null;

  const heights = { banner: "h-14", rectangle: "h-[250px]" };

  return (
    <div
      data-ad-slot={slotId}
      className={cn(
        "w-full rounded-xl border border-dashed border-muted-foreground/20 bg-muted/30 flex items-center justify-center text-[10px] uppercase tracking-wider text-muted-foreground/60",
        heights[size],
        className,
      )}
    >
      Ad · {slotId}
    </div>
  );
}
