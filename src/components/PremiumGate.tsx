import { useState, ReactNode } from "react";
import { Lock, Sparkles } from "lucide-react";
import { usePremium } from "@/lib/use-premium";
import { UpgradeModal } from "@/components/UpgradeModal";
import { cn } from "@/lib/utils";

interface PremiumGateProps {
  featureName: string;
  reason?: string;
  children: ReactNode;
  /** When true, blur and intercept clicks instead of replacing children */
  mode?: "replace" | "overlay";
  className?: string;
}

/** Wrap any premium-only UI. Renders an upgrade affordance if user isn't Premium. */
export function PremiumGate({ featureName, reason, children, mode = "overlay", className }: PremiumGateProps) {
  const { isPremium, loading } = usePremium();
  const [open, setOpen] = useState(false);

  if (loading || isPremium) return <>{children}</>;

  if (mode === "replace") {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "w-full rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-5 text-left hover:border-primary/60 transition-colors",
            className,
          )}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Premium</span>
          </div>
          <h3 className="font-display font-bold text-base mb-1">{featureName}</h3>
          <p className="text-xs text-muted-foreground">{reason ?? "Upgrade to unlock this feature."}</p>
        </button>
        <UpgradeModal open={open} onOpenChange={setOpen} featureName={featureName} reason={reason} />
      </>
    );
  }

  return (
    <>
      <div className={cn("relative", className)}>
        <div className="pointer-events-none select-none blur-sm opacity-60" aria-hidden>
          {children}
        </div>
        <button
          onClick={() => setOpen(true)}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-background/40 backdrop-blur-[2px] hover:bg-background/50 transition-colors"
        >
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow-primary">
            <Lock className="h-5 w-5 text-primary-foreground" />
          </div>
          <p className="text-sm font-semibold">Unlock {featureName}</p>
          <p className="text-xs text-muted-foreground">Tap to upgrade</p>
        </button>
      </div>
      <UpgradeModal open={open} onOpenChange={setOpen} featureName={featureName} reason={reason} />
    </>
  );
}

/** Inline lock badge for menu items / list rows */
export function PremiumBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary/15 to-accent/15 text-primary text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5",
        className,
      )}
    >
      <Sparkles className="h-2.5 w-2.5" />
      Pro
    </span>
  );
}
