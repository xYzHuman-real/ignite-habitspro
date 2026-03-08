import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, X, Download, Copy, Flame, Target, Trophy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface ShareProgressProps {
  displayName: string;
  streak: number;
  habitsCompleted: number;
  totalHabits: number;
  dailyScore: number;
  level: number;
  points: number;
}

export function ShareProgress({
  displayName,
  streak,
  habitsCompleted,
  totalHabits,
  dailyScore,
  level,
  points,
}: ShareProgressProps) {
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const shareText = `🔥 ${displayName}'s Progress on Ignite HabitPro!\n\n` +
    `🔥 ${streak}-day streak\n` +
    `✅ ${habitsCompleted}/${totalHabits} habits today\n` +
    `📊 ${dailyScore}% daily score\n` +
    `⭐ Level ${level} • ${points} XP\n\n` +
    `Build habits that stick → ignite-habitspro.lovable.app`;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      toast({ title: "Copied!", description: "Progress text copied to clipboard." });
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Ignite HabitPro Progress",
          text: shareText,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyText();
    }
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      // Use canvas-based approach for the share card
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const scale = 2;
      canvas.width = 400 * scale;
      canvas.height = 300 * scale;
      ctx.scale(scale, scale);

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 400, 300);
      gradient.addColorStop(0, "#1a1a2e");
      gradient.addColorStop(1, "#16213e");
      ctx.fillStyle = gradient;
      ctx.roundRect(0, 0, 400, 300, 16);
      ctx.fill();

      // Accent circle glow
      ctx.fillStyle = "rgba(255, 107, 53, 0.15)";
      ctx.beginPath();
      ctx.arc(200, 80, 120, 0, Math.PI * 2);
      ctx.fill();

      // App name
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.font = "bold 12px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("IGNITE HABITPRO", 200, 35);

      // Fire emoji + streak
      ctx.font = "36px system-ui";
      ctx.fillText("🔥", 200, 80);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px system-ui";
      ctx.fillText(`${streak}-Day Streak`, 200, 120);

      // Name
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = "14px system-ui";
      ctx.fillText(displayName, 200, 145);

      // Stats row
      const statsY = 190;
      const stats = [
        { label: "Habits", value: `${habitsCompleted}/${totalHabits}` },
        { label: "Score", value: `${dailyScore}%` },
        { label: "Level", value: `${level}` },
        { label: "XP", value: `${points}` },
      ];

      stats.forEach((s, i) => {
        const x = 60 + i * 93;
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.roundRect(x - 35, statsY - 20, 70, 50, 8);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 18px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(s.value, x, statsY + 5);

        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.font = "10px system-ui";
        ctx.fillText(s.label, x, statsY + 22);
      });

      // Footer
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.font = "10px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("ignite-habitspro.lovable.app", 200, 275);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "ignite-progress.png";
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Downloaded!", description: "Share card saved as image." });
      });
    } catch {
      toast({ title: "Failed to generate image", variant: "destructive" });
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5"
      >
        <Share2 className="h-4 w-4" />
        Share Progress
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md space-y-4"
            >
              {/* Preview Card */}
              <div
                ref={cardRef}
                className="relative overflow-hidden rounded-2xl p-6 text-center"
                style={{
                  background: "linear-gradient(135deg, #1a1a2e, #16213e)",
                  color: "white",
                }}
              >
                <button
                  onClick={() => setOpen(false)}
                  className="absolute top-3 right-3 text-white/50 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>

                <p className="text-xs uppercase tracking-widest text-white/50 mb-4">
                  Ignite HabitPro
                </p>

                <div className="relative inline-block mb-2">
                  <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full" />
                  <span className="text-5xl relative">🔥</span>
                </div>

                <h2 className="text-3xl font-bold">{streak}-Day Streak</h2>
                <p className="text-white/60 text-sm mt-1">{displayName}</p>

                <div className="grid grid-cols-4 gap-2 mt-6">
                  {[
                    { icon: Target, label: "Habits", value: `${habitsCompleted}/${totalHabits}` },
                    { icon: Sparkles, label: "Score", value: `${dailyScore}%` },
                    { icon: Trophy, label: "Level", value: `${level}` },
                    { icon: Flame, label: "XP", value: `${points}` },
                  ].map((s) => (
                    <div key={s.label} className="bg-white/10 rounded-lg p-2.5">
                      <p className="text-lg font-bold">{s.value}</p>
                      <p className="text-[10px] text-white/50">{s.label}</p>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-white/30 mt-4">ignite-habitspro.lovable.app</p>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-3 gap-2">
                <Button onClick={handleNativeShare} className="bg-gradient-primary text-primary-foreground">
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
                <Button variant="outline" onClick={handleDownloadImage}>
                  <Download className="h-4 w-4 mr-1" />
                  Image
                </Button>
                <Button variant="outline" onClick={handleCopyText}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
