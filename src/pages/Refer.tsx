import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Gift, Copy, Share2, Check, Users, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/lib/supabase-hooks";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";

export default function Refer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, isLoading } = useProfile();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [applying, setApplying] = useState(false);

  const referralCode: string = (profile as any)?.referral_code ?? "";
  const referredBy: string | null = (profile as any)?.referred_by_code ?? null;

  const shareUrl = useMemo(() => {
    if (!referralCode) return "";
    return `${window.location.origin}/auth?ref=${referralCode}`;
  }, [referralCode]);

  const shareText = `🔥 Build life-changing habits with Ignite HabitPro! Use my code ${referralCode} when you sign up and we both get 1 month of Premium FREE.\n\n${shareUrl}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({ title: "Link copied!", description: "Share it with friends to earn free Premium." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Ignite HabitPro", text: shareText, url: shareUrl });
      } catch {/* user cancelled */}
    } else {
      handleCopy();
    }
  };

  const handleApplyCode = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setApplying(true);
    try {
      const { data, error } = await supabase.rpc("apply_referral" as any, { code: trimmed });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast({
        title: "🎉 1 month of Premium unlocked!",
        description: `Thanks to ${data ?? "your friend"}. You both got 30 days added.`,
      });
      setCode("");
    } catch (e: any) {
      toast({ title: "Couldn't apply code", description: e.message, variant: "destructive" });
    } finally {
      setApplying(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-display font-bold">Invite Friends</h1>
          <p className="text-xs text-muted-foreground">Give 1 month, get 1 month free</p>
        </div>
      </div>

      {/* Hero */}
      <Card className="p-6 mb-4 relative overflow-hidden border-primary/30">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/10 to-transparent pointer-events-none" />
        <div className="relative text-center">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mx-auto flex items-center justify-center shadow-glow-primary mb-3"
          >
            <Gift className="h-8 w-8 text-primary-foreground" />
          </motion.div>
          <h2 className="text-lg font-display font-bold mb-1">Share Ignite, Earn Premium</h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            For every friend who signs up with your link, you <span className="font-semibold text-foreground">both get 1 month of Premium free</span>.
          </p>
        </div>
      </Card>

      {/* Your code */}
      <Card className="p-5 mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Your invite code</p>
        <div className="flex items-center justify-center mb-4">
          <div className="px-6 py-3 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30">
            <p className="text-3xl font-display font-bold tracking-[0.3em] text-primary">{referralCode || "------"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Input value={shareUrl} readOnly className="text-xs font-mono bg-muted/50" />
          <Button size="icon" variant="outline" onClick={handleCopy} aria-label="Copy link">
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <Button
          onClick={handleShare}
          className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-primary gap-2"
        >
          <Share2 className="h-4 w-4" />
          Share Invite Link
        </Button>
      </Card>

      {/* Enter a code */}
      {!referredBy && (
        <Card className="p-5 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Got a friend's code?</p>
          <p className="text-sm text-muted-foreground mb-3">Enter it once to claim your free month.</p>
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={10}
              className="font-mono tracking-widest text-center uppercase"
            />
            <Button onClick={handleApplyCode} disabled={applying || code.trim().length < 4}>
              {applying ? "Applying..." : "Apply"}
            </Button>
          </div>
        </Card>
      )}

      {referredBy && (
        <Card className="p-4 mb-4 bg-success/5 border-success/30 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-success/15 flex items-center justify-center">
            <Check className="h-5 w-5 text-success" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Referral applied</p>
            <p className="text-xs text-muted-foreground">Code {referredBy} unlocked your free month.</p>
          </div>
        </Card>
      )}

      {/* How it works */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> How it works
        </h3>
        <div className="space-y-3">
          <Step n={1} icon={Share2} title="Share your link" desc="Send it via WhatsApp, Instagram, or anywhere." />
          <Step n={2} icon={Users} title="Friend signs up" desc="They join Ignite using your invite link or code." />
          <Step n={3} icon={Gift} title="Both get 30 days" desc="Premium is added on top of any active plan or trial." />
        </div>
      </Card>
    </div>
  );
}

function Step({ n, icon: Icon, title, desc }: { n: number; icon: any; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 relative">
        <Icon className="h-4 w-4 text-primary" />
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">{n}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
