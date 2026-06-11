import { motion } from "framer-motion";
import { Sparkles, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
  reason?: string;
}

const PERKS = [
  "Unlimited habits, focus rooms & AI planner",
  "Advanced analytics & weekly reports",
  "Custom focus themes & soundscapes",
  "Ad-free experience",
  "Priority customer support",
];

export function UpgradeModal({ open, onOpenChange, featureName, reason }: UpgradeModalProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 overflow-hidden border-primary/30">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 z-10 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center hover:bg-muted"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="bg-gradient-to-br from-primary/20 via-accent/10 to-transparent p-6 pb-4">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow-primary mb-3"
          >
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </motion.div>
          <h2 className="text-xl font-display font-bold mb-1">
            {featureName ? `Unlock ${featureName}` : "Upgrade to Premium"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {reason ?? "Get the most out of Ignite HabitPro with unlimited access to every feature."}
          </p>
        </div>

        <div className="px-6 pb-5 space-y-2.5">
          {PERKS.map((perk) => (
            <div key={perk} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center mt-0.5 shrink-0">
                <Check className="h-3 w-3 text-primary" />
              </div>
              <p className="text-sm">{perk}</p>
            </div>
          ))}
        </div>

        <div className="px-6 pb-6 space-y-2">
          <Button
            className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-primary"
            onClick={() => {
              onOpenChange(false);
              navigate("/pricing");
            }}
          >
            See Plans — from ₹83/mo
          </Button>
          <button
            onClick={() => onOpenChange(false)}
            className="w-full text-xs text-muted-foreground hover:text-foreground py-1"
          >
            Maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
