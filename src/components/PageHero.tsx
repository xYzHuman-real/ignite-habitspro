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
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl p-5 shadow-xl max-w-full"
      style={{ background: "linear-gradient(135deg, #ff6a3d 0%, #ff3d00 100%)" }}
    >
      {/* Decorative glow blobs */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-8 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />

      <div className={`relative flex items-start justify-between gap-3 ${stats.length ? "mb-5" : ""}`}>
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/80">{eyebrow}</p>
          )}
          <h1 className="text-2xl font-display font-bold text-white mt-0.5 flex items-center gap-2 min-w-0">
            {Icon && <Icon className="h-6 w-6 text-white shrink-0" />}
            <span className="truncate min-w-0">{title}</span>
          </h1>
          {subtitle && <p className="text-sm text-white/80 mt-1 break-words">{subtitle}</p>}
        </div>

        {showRing && (
          <div className="relative w-[72px] h-[72px] flex items-center justify-center shrink-0 ml-3">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r={radius} stroke="rgba(255,255,255,0.2)" strokeWidth="5" fill="none" />
              <motion.circle
                cx="32" cy="32" r={radius}
                stroke="white" strokeWidth="5" fill="none" strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </svg>
            <div className="text-white font-display font-bold text-sm text-center leading-tight">
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
              <div key={i} className="flex-1 backdrop-blur-md bg-white/15 rounded-xl px-3 py-2 flex items-center gap-2 min-w-0">
                <SIcon className="h-4 w-4 text-white shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-wider text-white/70 font-semibold leading-none truncate">{s.label}</p>
                  <p className="text-sm font-bold text-white leading-tight truncate">{s.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
