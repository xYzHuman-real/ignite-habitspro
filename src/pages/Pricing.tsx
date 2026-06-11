import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Sparkles, Crown, Zap, Users, BarChart3, Palette, Shield, Headphones, Infinity as InfinityIcon, Gift, Receipt, XCircle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { usePremium } from "@/lib/use-premium";
import { PremiumBadge } from "@/components/PremiumBadge";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { FakePlayPurchaseSheet, PurchaseResult } from "@/components/FakePlayPurchaseSheet";
import { CancelPremiumSheet, CancelResult } from "@/components/CancelPremiumSheet";
import { celebratePremium } from "@/lib/celebrate";

type Plan = "monthly" | "yearly";

type HistoryRow = {
  id: string;
  plan: string;
  amount_inr: number;
  receipt_id: string;
  status: string;
  failure_reason: string | null;
  created_at: string;
};

const PRICES: Record<Plan, { inr: number; perMonth: number; label: string; savingsBadge?: string }> = {
  monthly: { inr: 149, perMonth: 149, label: "₹149/month" },
  yearly: { inr: 999, perMonth: 83, label: "₹999/year", savingsBadge: "Save 44%" },
};

const FEATURES: { icon: any; title: string; free: string; pro: string }[] = [
  { icon: Zap, title: "Habits", free: "Up to 5", pro: "Unlimited" },
  { icon: BarChart3, title: "AI Daily Planner", free: "3 plans/month", pro: "Unlimited" },
  { icon: Users, title: "Focus Rooms", free: "Join only", pro: "Create + unlimited" },
  { icon: Palette, title: "Custom focus themes", free: "Basic only", pro: "Full library" },
  { icon: BarChart3, title: "Weekly reports & analytics", free: "Last 7 days", pro: "Full history + insights" },
  { icon: Shield, title: "Ad-free experience", free: "—", pro: "Yes" },
  { icon: Headphones, title: "Priority support", free: "Email", pro: "Within 24h" },
  { icon: InfinityIcon, title: "Data export (CSV)", free: "—", pro: "Anytime" },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isPremium, isTrial, trialDaysLeft, isPaid, plan: currentPlan, premiumUntil } = usePremium();
  const [plan, setPlan] = useState<Plan>("yearly");
  const [upgrading, setUpgrading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const qc = useQueryClient();

  const loadHistory = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from("subscription_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setHistory(data as HistoryRow[]);
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const startPurchase = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setSheetOpen(true);
  };

  const completePurchase = async (result: PurchaseResult) => {
    setUpgrading(true);
    try {
      // 1. Always log the attempt to subscription_history (success OR failed)
      await (supabase as any).from("subscription_history").insert({
        user_id: user!.id,
        plan,
        amount_inr: PRICES[plan].inr,
        receipt_id: result.receiptId,
        status: result.status,
        failure_reason: result.failureReason ?? null,
        provider: "google_play_sandbox",
      });

      // 2. Only unlock Premium on a successful purchase
      if (result.status === "success") {
        const months = plan === "yearly" ? 12 : 1;
        const until = new Date();
        until.setMonth(until.getMonth() + months);

        const { error } = await supabase
          .from("profiles")
          .update({
            subscription_tier: "premium",
            subscription_plan: plan,
            premium_until: until.toISOString(),
          })
          .eq("user_id", user!.id);
        if (error) throw error;

        await qc.invalidateQueries({ queryKey: ["profile", user!.id] });
        toast({
          title: "Welcome to Premium! 🎉",
          description: `Receipt ${result.receiptId} · active until ${until.toLocaleDateString()}.`,
        });
      } else {
        toast({
          title: "Purchase failed",
          description: `${result.failureCode}: ${result.failureReason} Premium not activated.`,
          variant: "destructive",
        });
      }

      await loadHistory();
    } catch (e: any) {
      toast({ title: "Upgrade failed", description: e.message, variant: "destructive" });
    } finally {
      setUpgrading(false);
    }
  };

  const current = PRICES[plan];

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-display font-bold">Ignite Premium</h1>
            {isPremium && <PremiumBadge size="sm" label={isPaid ? "Premium" : "Trial"} />}
          </div>
          <p className="text-xs text-muted-foreground">Unlock every feature, forever distraction-free</p>
        </div>
      </div>

      {/* Trial / status banner */}
      {isTrial && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-xl bg-gradient-to-r from-primary/15 to-accent/10 border border-primary/30 flex items-center gap-3"
        >
          <Sparkles className="h-5 w-5 text-primary shrink-0" />
          <p className="text-sm">
            <span className="font-semibold">{trialDaysLeft} {trialDaysLeft === 1 ? "day" : "days"} left</span> of your free Premium trial.
          </p>
        </motion.div>
      )}
      {isPaid && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-xl bg-gradient-to-r from-primary/15 to-accent/10 border border-primary/30 flex items-center gap-3"
        >
          <Crown className="h-5 w-5 text-primary shrink-0" />
          <p className="text-sm">
            <span className="font-semibold capitalize">{currentPlan}</span> Premium · renews {premiumUntil?.toLocaleDateString()}
          </p>
        </motion.div>
      )}

      {/* Plan toggle */}
      <div className="mb-4 grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted/50">
        {(["monthly", "yearly"] as Plan[]).map((p) => (
          <button
            key={p}
            onClick={() => setPlan(p)}
            className={cn(
              "py-2.5 rounded-lg text-sm font-semibold transition-all relative",
              plan === p ? "bg-background shadow-sm" : "text-muted-foreground"
            )}
          >
            <span className="capitalize">{p}</span>
            {PRICES[p].savingsBadge && (
              <span className="absolute -top-2 right-2 text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                {PRICES[p].savingsBadge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Pricing hero card */}
      <Card className="p-6 mb-4 relative overflow-hidden border-primary/30">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow-primary">
              <Crown className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold">Premium</span>
          </div>
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-3xl font-display font-bold">₹{current.perMonth}</span>
            <span className="text-sm text-muted-foreground">/ month</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            {plan === "yearly" ? `Billed ₹${current.inr} once a year` : "Billed monthly, cancel anytime"}
          </p>
          <Button
            className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-primary"
            onClick={startPurchase}
            disabled={upgrading || (isPaid && currentPlan === plan)}
          >
            {isPaid && currentPlan === plan
              ? "Current Plan"
              : upgrading
              ? "Processing..."
              : isTrial
              ? `Start ${plan === "yearly" ? "Yearly" : "Monthly"} Plan`
              : `Upgrade — ${current.label}`}
          </Button>
          {!isPremium && (
            <p className="text-[11px] text-center text-muted-foreground mt-2">
              7-day free trial · No charge today
            </p>
          )}
        </div>
      </Card>

      {/* Feature comparison */}
      <Card className="p-5 mb-4">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> Free vs Premium
        </h3>
        <div className="space-y-3">
          {FEATURES.map(({ icon: Icon, title, free, pro }) => (
            <div key={title} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{title}</p>
                <p className="text-[11px] text-muted-foreground">Free: {free}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-primary">{pro}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* FAQ */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-semibold">Questions?</h3>
        <Faq q="Can I cancel anytime?" a="Yes. Cancel from Settings and you keep Premium until the end of your billing period." />
        <Faq q="What happens after my 7-day trial?" a="You'll return to the Free plan automatically — no card required to start, no surprise charges." />
        <Faq q="Is there a refund policy?" a="If something's wrong within the first 7 days of a paid plan, email support and we'll refund you." />
        <Faq q="Will the price stay the same?" a="Your locked-in price stays the same as long as your subscription is active." />
      </Card>

      <p className="text-[11px] text-center text-muted-foreground mt-6 px-4">
        Pricing shown in INR for India. International pricing auto-converts at checkout. Taxes may apply.
      </p>

      {/* Referral promo */}
      <button
        onClick={() => navigate("/refer")}
        className="mt-4 w-full p-4 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10 flex items-center gap-3 text-left hover:border-primary/60 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
          <Gift className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Get Premium for free</p>
          <p className="text-xs text-muted-foreground">Invite a friend → you both get 1 month free</p>
        </div>
      </button>

      {/* Subscription history */}
      {user && history.length > 0 && (
        <Card className="mt-4 p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" /> Subscription history
          </h3>
          <div className="divide-y divide-border/60">
            {history.map((h) => {
              const ok = h.status === "success";
              return (
                <div key={h.id} className="py-2.5 flex items-center gap-3">
                  {ok ? (
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium capitalize">{h.plan}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{h.receipt_id}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(h.created_at).toLocaleString()} · ₹{h.amount_inr}
                      {!ok && h.failure_reason ? ` · ${h.failure_reason}` : ""}
                    </p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                    ok ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"
                  )}>
                    {ok ? "Paid" : "Failed"}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <FakePlayPurchaseSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        plan={plan}
        priceInr={current.inr}
        onConfirm={completePurchase}
      />
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <p className="text-sm font-medium mb-1 flex items-start gap-2">
        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        {q}
      </p>
      <p className="text-xs text-muted-foreground pl-6 leading-relaxed">{a}</p>
    </div>
  );
}
