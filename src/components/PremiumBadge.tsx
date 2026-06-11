import { Crown } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PremiumBadgeProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
  onClick?: () => void;
}

/**
 * Shown next to user identity when the account has active Premium
 * (paid or trial). Gold gradient + crown icon.
 */
export function PremiumBadge({ size = "sm", label = "Premium", className, onClick }: PremiumBadgeProps) {
  const sizing = {
    sm: "text-[10px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
    lg: "text-sm px-3 py-1.5 gap-2",
  }[size];
  const icon = { sm: "h-3 w-3", md: "h-3.5 w-3.5", lg: "h-4 w-4" }[size];

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onClick={onClick}
      className={cn(
        "inline-flex items-center font-semibold rounded-full",
        "bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-black",
        "shadow-[0_2px_10px_-2px_rgba(245,158,11,0.6)] border border-amber-300/50",
        onClick && "cursor-pointer hover:brightness-110 transition",
        sizing,
        className,
      )}
    >
      <Crown className={cn(icon, "fill-black/10")} />
      {label}
    </motion.span>
  );
}
