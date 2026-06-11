import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface Props {
  open: boolean;
  icon: LucideIcon;
  title: string;
  body: string;
  bullets?: string[];
  primaryLabel?: string;
  secondaryLabel?: string;
  onAllow: () => void;
  onSkip: () => void;
}

export function PermissionPrimer({
  open, icon: Icon, title, body, bullets = [],
  primaryLabel = "Allow", secondaryLabel = "Not now",
  onAllow, onSkip,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9997] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={onSkip}
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card rounded-3xl p-6 shadow-2xl border border-border/60"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
          >
            <div className="flex flex-col items-center text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{
                  background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
                  boxShadow: "0 20px 40px -15px rgba(249,115,22,0.55)",
                }}
              >
                <Icon className="h-8 w-8 text-white" strokeWidth={2} />
              </div>
              <h2 className="text-[22px] font-display font-bold tracking-tight text-foreground mb-2">
                {title}
              </h2>
              <p className="text-[15px] leading-relaxed text-muted-foreground max-w-sm">
                {body}
              </p>

              {bullets.length > 0 && (
                <ul className="mt-5 w-full space-y-2.5 text-left">
                  {bullets.map((b, i) => (
                    <li key={i} className="flex gap-3 text-[14px] text-foreground/90">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-7 space-y-2">
              <button
                onClick={onAllow}
                className="w-full h-13 py-3.5 rounded-2xl text-[16px] font-semibold text-white shadow-[0_10px_30px_-12px_rgba(249,115,22,0.55)]"
                style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" }}
              >
                {primaryLabel}
              </button>
              <button
                onClick={onSkip}
                className="w-full h-11 rounded-2xl text-[14px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                {secondaryLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
