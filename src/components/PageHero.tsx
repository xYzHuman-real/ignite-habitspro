import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatPill {
  icon: LucideIcon;
  label: string;
  value: string | number;
}

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  /** Optional 0-100 percentage to show in progress ring */
  progress?: number;
  progressLabel?: string;
  stats?: StatPill[];
}

export default function PageHero({
  eyebrow,
  title,
  subtitle,
  icon: Icon,
  progress,
  progressLabel,
  stats = [],
}: PageHeroProps) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const showRing = typeof progress === "number";
  const pct = Math.max(0, Math.min(100, progress ?? 0));
  const strokeDashoffset = circumference * (1 - pct / 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl p-6 bg-card border border-border/60 shadow-premium max-w-full"
    >
      {/* Subtle warm wash */}
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className={`relative flex items-start justify-between gap-3 ${stats.length ? "mb-5" : ""}`}>
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="text-eyebrow text-primary mb-2">{eyebrow}</p>
          )}
          <h1 className="text-title-1 text-foreground flex items-center gap-2.5 min-w-0">
            {Icon && (
              <span className="shrink-0 h-9 w-9 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </span>
            )}
            <span className="truncate min-w-0">{title}</span>
          </h1>
          {subtitle && <p className="text-subhead text-muted-foreground mt-1.5 break-words">{subtitle}</p>}
        </div>

        {showRing && (
          <div className="relative w-[76px] h-[76px] flex items-center justify-center shrink-0 ml-3">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r={radius} stroke="hsl(var(--muted))" strokeWidth="5" fill="none" />
              <motion.circle
                cx="32" cy="32" r={radius}
                stroke="hsl(var(--primary))" strokeWidth="5" fill="none" strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </svg>
            <div className="text-foreground font-display font-bold text-[15px] tabular-nums tracking-tight text-center leading-tight">
              {progressLabel ?? `${pct}%`}
            </div>
          </div>
        )}
      </div>

      {stats.length > 0 && (
        <div className="relative flex gap-2">
          {stats.map((s, i) => {
            const SIcon = s.icon;
            return (
              <div key={i} className="flex-1 bg-secondary/70 rounded-2xl px-3 py-2.5 flex items-center gap-2 min-w-0">
                <SIcon className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-semibold leading-none truncate">{s.label}</p>
                  <p className="text-[15px] font-bold tabular-nums tracking-tight text-foreground leading-tight truncate mt-1">{s.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
