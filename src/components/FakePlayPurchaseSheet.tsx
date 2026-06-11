import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Shield, X, AlertTriangle, Copy } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import appLogo from "@/assets/app-logo.png";

type Stage = "review" | "auth" | "processing" | "success" | "failed";

export type PurchaseResult = {
  status: "success" | "failed";
  receiptId: string;
  failureReason?: string;
  failureCode?: string;
};

interface FakePlayPurchaseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: "monthly" | "yearly";
  priceInr: number;
  /** Called with the final purchase result. Premium should only unlock when status === "success". */
  onConfirm: (result: PurchaseResult) => Promise<void> | void;
}

/** Build a fake Google Play-style order ID, e.g. GPA.3372-1234-9988-12345 */
function generateReceiptId() {
  const part = (n: number) => Math.floor(Math.random() * Math.pow(10, n)).toString().padStart(n, "0");
  return `GPA.${part(4)}-${part(4)}-${part(4)}-${part(5)}`;
}

const FAILURE_SCENARIOS = [
  { code: "BILLING_UNAVAILABLE", reason: "Your payment method was declined by the issuer." },
  { code: "ITEM_UNAVAILABLE", reason: "This subscription isn't available in your region right now." },
  { code: "NETWORK_ERROR", reason: "Couldn't reach Google Play. Check your connection and try again." },
  { code: "USER_CANCELED", reason: "Purchase cancelled before authorization completed." },
];

/**
 * Visual simulation of the Google Play Billing native sheet.
 * Includes a "Simulate failure" toggle so Premium gating can be tested
 * end-to-end without unlocking the account.
 */
export function FakePlayPurchaseSheet({ open, onOpenChange, plan, priceInr, onConfirm }: FakePlayPurchaseSheetProps) {
  const [stage, setStage] = useState<Stage>("review");
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [result, setResult] = useState<PurchaseResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setStage("review");
      setResult(null);
      setCopied(false);
    }
  }, [open]);

  const advance = async () => {
    const receiptId = generateReceiptId();

    setStage("auth");
    await new Promise((r) => setTimeout(r, 900));
    setStage("processing");
    await new Promise((r) => setTimeout(r, 1400));

    if (simulateFailure) {
      const scenario = FAILURE_SCENARIOS[Math.floor(Math.random() * FAILURE_SCENARIOS.length)];
      const failed: PurchaseResult = {
        status: "failed",
        receiptId,
        failureCode: scenario.code,
        failureReason: scenario.reason,
      };
      setResult(failed);
      await onConfirm(failed);
      setStage("failed");
      return; // keep sheet open so user can read the error
    }

    const ok: PurchaseResult = { status: "success", receiptId };
    setResult(ok);
    await onConfirm(ok);
    setStage("success");
    await new Promise((r) => setTimeout(r, 1800));
    onOpenChange(false);
  };

  const planLabel = plan === "yearly" ? "Yearly" : "Monthly";
  const billingLabel = plan === "yearly" ? "year" : "month";

  const copyReceipt = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.receiptId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const dismissable = stage === "review" || stage === "failed";

  return (
    <Dialog open={open} onOpenChange={(v) => dismissable && onOpenChange(v)}>
      <DialogContent className="max-w-sm p-0 overflow-hidden border-0 bg-white dark:bg-zinc-900 rounded-2xl">
        {/* Play Store header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 relative">
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path fill="#00C853" d="M3 20.5V3.5a1 1 0 0 1 1.5-.87L19 12 4.5 21.37A1 1 0 0 1 3 20.5z" />
                <path fill="#FFD600" d="M19 12 4.5 2.63 14.5 8.5 19 12z" />
                <path fill="#FF3D00" d="M14.5 8.5 4.5 2.63 14.5 8.5 11.5 12l3-3.5z" />
                <path fill="#2962FF" d="M14.5 15.5 4.5 21.37 11.5 12l3 3.5z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200">Google Play</span>
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
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">Ignite Premium ({planLabel})</p>
                  <p className="text-xs text-zinc-500">Ignite HabitPro · In-app subscription</p>
                </div>
              </div>

              <div className="space-y-3 py-3 border-y border-zinc-200 dark:border-zinc-800">
                <Row label="7-day free trial" value="₹0.00" />
                <Row label={`Then ₹${priceInr} / ${billingLabel}`} value={`₹${priceInr}.00`} muted />
                <Row label="Total due today" value="₹0.00" bold />
              </div>

              <div className="flex items-start gap-2 mt-4 text-[11px] text-zinc-500 leading-relaxed">
                <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <p>Subscription auto-renews each {billingLabel}. Cancel anytime in Play Store → Subscriptions. Tax included where applicable.</p>
              </div>

              {/* Payment method */}
              <div className="mt-4 flex items-center justify-between py-3 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-5 rounded bg-gradient-to-r from-blue-500 to-blue-700 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white">UPI</span>
                  </div>
                  <span className="text-xs text-zinc-700 dark:text-zinc-300">user@okhdfcbank</span>
                </div>
                <button className="text-[11px] text-blue-600 font-medium">Change</button>
              </div>

              {/* Tester toggle */}
              <div className="mt-3 flex items-center justify-between px-3 py-2.5 rounded-xl border border-dashed border-amber-400/60 bg-amber-50/60 dark:bg-amber-900/10">
                <div className="flex items-start gap-2 min-w-0">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-amber-900 dark:text-amber-200">Tester: simulate failure</p>
                    <p className="text-[10px] text-amber-700/80 dark:text-amber-300/70 leading-snug">Premium will NOT unlock if enabled.</p>
                  </div>
                </div>
                <Switch checked={simulateFailure} onCheckedChange={setSimulateFailure} />
              </div>

              <button
                onClick={advance}
                className="w-full mt-4 py-3 rounded-full bg-[#01875F] hover:bg-[#016b4d] text-white font-medium text-sm transition-colors"
              >
                Subscribe
              </button>
              <p className="text-[10px] text-center text-zinc-400 mt-2">By tapping Subscribe, you agree to Google Play's terms.</p>
            </motion.div>
          )}

          {stage === "auth" && (
            <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-blue-500/10 mx-auto flex items-center justify-center mb-4">
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-blue-600">
                  <path d="M12 1L3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-4z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Verifying with Google</p>
              <p className="text-xs text-zinc-500 mt-1">Confirming your identity…</p>
            </motion.div>
          )}

          {stage === "processing" && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 text-center">
              <Loader2 className="w-10 h-10 text-[#01875F] animate-spin mx-auto mb-4" />
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Processing payment</p>
              <p className="text-xs text-zinc-500 mt-1">This usually takes a few seconds…</p>
            </motion.div>
          )}

          {stage === "success" && result && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-14 h-14 rounded-full bg-[#01875F] mx-auto flex items-center justify-center mb-4"
              >
                <Check className="h-7 w-7 text-white" strokeWidth={3} />
              </motion.div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Payment successful</p>
              <p className="text-xs text-zinc-500 mt-1 mb-4">Welcome to Ignite Premium!</p>

              {/* Fake receipt */}
              <div className="mx-auto max-w-[260px] text-left bg-zinc-50 dark:bg-zinc-800/60 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-3 space-y-1.5">
                <ReceiptRow label="Order ID">
                  <button onClick={copyReceipt} className="inline-flex items-center gap-1 text-zinc-700 dark:text-zinc-200 font-mono text-[10px]">
                    {result.receiptId}
                    <Copy className="h-3 w-3" />
                  </button>
                </ReceiptRow>
                <ReceiptRow label="Plan">{planLabel}</ReceiptRow>
                <ReceiptRow label="Amount">₹{priceInr}.00</ReceiptRow>
                <ReceiptRow label="Date">{new Date().toLocaleDateString()}</ReceiptRow>
                <ReceiptRow label="Status"><span className="text-[#01875F] font-semibold">Paid</span></ReceiptRow>
              </div>
              {copied && <p className="text-[10px] text-[#01875F] mt-2">Copied!</p>}
            </motion.div>
          )}

          {stage === "failed" && result && (
            <motion.div key="failed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-14 h-14 rounded-full bg-red-500 mx-auto flex items-center justify-center mb-4"
              >
                <X className="h-7 w-7 text-white" strokeWidth={3} />
              </motion.div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Payment failed</p>
              <p className="text-xs text-zinc-500 mt-1 mb-4 px-4">{result.failureReason}</p>

              <div className="mx-auto max-w-[260px] text-left bg-zinc-50 dark:bg-zinc-800/60 border border-dashed border-red-300 dark:border-red-900/50 rounded-xl p-3 space-y-1.5">
                <ReceiptRow label="Attempt ID"><span className="font-mono text-[10px]">{result.receiptId}</span></ReceiptRow>
                <ReceiptRow label="Error code"><span className="font-mono text-[10px] text-red-600">{result.failureCode}</span></ReceiptRow>
                <ReceiptRow label="Status"><span className="text-red-600 font-semibold">Not charged</span></ReceiptRow>
              </div>

              <p className="text-[11px] text-zinc-500 mt-3">Premium was not activated.</p>
              <button
                onClick={() => onOpenChange(false)}
                className="w-full mt-4 py-2.5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium text-sm"
              >
                Close
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs ${muted ? "text-zinc-400" : "text-zinc-600 dark:text-zinc-300"} ${bold ? "font-semibold !text-zinc-900 dark:!text-zinc-100" : ""}`}>{label}</span>
      <span className={`text-xs ${muted ? "text-zinc-400" : "text-zinc-700 dark:text-zinc-200"} ${bold ? "font-semibold !text-zinc-900 dark:!text-zinc-100" : ""}`}>{value}</span>
    </div>
  );
}

function ReceiptRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</span>
      <span className="text-[11px] text-zinc-800 dark:text-zinc-100">{children}</span>
    </div>
  );
}
