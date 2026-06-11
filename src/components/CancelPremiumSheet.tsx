import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Check, Loader2, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import appLogo from "@/assets/app-logo.png";

type Stage = "review" | "confirm" | "processing" | "done";

export type CancelResult = {
  receiptId: string;
  reason?: string;
  /** ISO date — when Premium access actually ends. */
  accessEndsAt: string;
};

interface CancelPremiumSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: "monthly" | "yearly" | null;
  /** Current premium expiry — shown so user knows when access ends. */
  premiumUntil: Date | null;
  /** Called with a fake Play receipt + access end date when cancellation confirmed. */
  onConfirm: (result: CancelResult) => Promise<void> | void;
}

const REASONS = [
  "Too expensive",
  "Not using it enough",
  "Missing a feature",
  "Found an alternative",
  "Just testing — will resubscribe",
  "Other",
];

function generateReceiptId() {
  const part = (n: number) => Math.floor(Math.random() * Math.pow(10, n)).toString().padStart(n, "0");
  return `GPA.CXL-${part(4)}-${part(4)}-${part(5)}`;
}

/**
 * Play-style cancellation sheet. Mirrors FakePlayPurchaseSheet visuals so users
 * recognize the flow. On confirm, calls onConfirm — caller is responsible for
 * downgrading the user's subscription_tier and logging history.
 */
export function CancelPremiumSheet({ open, onOpenChange, plan, premiumUntil, onConfirm }: CancelPremiumSheetProps) {
  const [stage, setStage] = useState<Stage>("review");
  const [reason, setReason] = useState<string>("");

  useEffect(() => {
    if (open) {
      setStage("review");
      setReason("");
    }
  }, [open]);

  const dismissable = stage === "review" || stage === "confirm" || stage === "done";

  const handleConfirm = async () => {
    setStage("processing");
    const receiptId = generateReceiptId();
    const accessEndsAt = (premiumUntil ?? new Date()).toISOString();
    await new Promise((r) => setTimeout(r, 1200));
    await onConfirm({ receiptId, reason, accessEndsAt });
    setStage("done");
    await new Promise((r) => setTimeout(r, 1800));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => dismissable && onOpenChange(v)}>
      <DialogContent className="max-w-sm p-0 overflow-hidden border-0 bg-white dark:bg-zinc-900 rounded-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path fill="#00C853" d="M3 20.5V3.5a1 1 0 0 1 1.5-.87L19 12 4.5 21.37A1 1 0 0 1 3 20.5z" />
              <path fill="#FFD600" d="M19 12 4.5 2.63 14.5 8.5 19 12z" />
              <path fill="#FF3D00" d="M14.5 8.5 4.5 2.63 14.5 8.5 11.5 12l3-3.5z" />
              <path fill="#2962FF" d="M14.5 15.5 4.5 21.37 11.5 12l3 3.5z" />
            </svg>
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200">Google Play · Subscriptions</span>
          </div>
          {dismissable && (
            <button onClick={() => onOpenChange(false)} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <X className="h-4 w-4 text-zinc-500" />
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {stage === "review" && (
            <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <img src={appLogo} alt="" className="w-12 h-12 rounded-xl" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">Ignite Premium {plan ? `(${plan})` : ""}</p>
                  <p className="text-xs text-zinc-500">Manage your subscription</p>
                </div>
              </div>

              <div className="py-3 border-y border-zinc-200 dark:border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Status</span>
                  <span className="text-xs font-semibold text-[#01875F]">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Access ends</span>
                  <span className="text-xs text-zinc-800 dark:text-zinc-100">
                    {premiumUntil ? premiumUntil.toLocaleDateString() : "—"}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-900/10 border border-amber-300/60">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-snug">
                  You'll keep Premium until your access ends, then return to the Free plan. No further charges.
                </p>
              </div>

              <button
                onClick={() => setStage("confirm")}
                className="w-full mt-4 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-colors"
              >
                Cancel subscription
              </button>
              <button
                onClick={() => onOpenChange(false)}
                className="w-full mt-2 py-2.5 rounded-full text-zinc-600 dark:text-zinc-300 font-medium text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Keep Premium
              </button>
            </motion.div>
          )}

          {stage === "confirm" && (
            <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Why are you cancelling?</p>
              <p className="text-xs text-zinc-500 mt-1 mb-3">Optional — helps us improve.</p>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setReason(r)}
                    className={`w-full text-left text-xs px-3 py-2.5 rounded-xl border transition-colors ${
                      reason === r
                        ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <button
                onClick={handleConfirm}
                className="w-full mt-4 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-colors"
              >
                Confirm cancellation
              </button>
              <button
                onClick={() => setStage("review")}
                className="w-full mt-2 py-2.5 rounded-full text-zinc-600 dark:text-zinc-300 font-medium text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Back
              </button>
            </motion.div>
          )}

          {stage === "processing" && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 text-center">
              <Loader2 className="w-10 h-10 text-red-600 animate-spin mx-auto mb-4" />
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Cancelling subscription</p>
              <p className="text-xs text-zinc-500 mt-1">Contacting Google Play…</p>
            </motion.div>
          )}

          {stage === "done" && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-14 h-14 rounded-full bg-zinc-700 mx-auto flex items-center justify-center mb-4"
              >
                <Check className="h-7 w-7 text-white" strokeWidth={3} />
              </motion.div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Subscription cancelled</p>
              <p className="text-xs text-zinc-500 mt-1 mb-2">
                Premium has been turned off. You won't be charged again.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
