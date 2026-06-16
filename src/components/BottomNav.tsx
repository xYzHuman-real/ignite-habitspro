import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Target, Timer, Users, User } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Home", icon: LayoutDashboard, path: "/" },
  { label: "Habits", icon: Target, path: "/habits" },
  { label: "Timer", icon: Timer, path: "/timer" },
  { label: "Rooms", icon: Users, path: "/focus-rooms" },
  { label: "Profile", icon: User, path: "/profile" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div
      className="fixed left-0 right-0 z-[100] pointer-events-none flex justify-center px-5"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)" }}
    >
      <nav
        className="pointer-events-auto rounded-full px-3 py-2 flex items-center justify-between gap-1 w-full max-w-sm"
        style={{
          background: "hsl(var(--card) / 0.82)",
          backdropFilter: "saturate(180%) blur(28px)",
          WebkitBackdropFilter: "saturate(180%) blur(28px)",
          border: "1px solid hsl(var(--border) / 0.5)",
          boxShadow: "0 10px 32px -8px hsl(220 30% 10% / 0.10), 0 2px 6px hsl(220 30% 10% / 0.04)",
        }}
        aria-label="Primary"
      >
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "relative flex-1 flex flex-col items-center justify-center gap-1 rounded-full py-1.5 px-1",
                "outline-none transition-colors duration-200",
                active ? "text-foreground" : "text-muted-foreground/70 hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
              aria-label={tab.label}
            >
              <Icon className="h-[20px] w-[20px]" strokeWidth={active ? 2.2 : 1.8} />
              <span
                className={cn(
                  "text-[10px] leading-none tracking-tight transition-opacity",
                  active ? "font-semibold opacity-100" : "font-medium opacity-80"
                )}
              >
                {tab.label}
              </span>
              {active && (
                <motion.span
                  layoutId="bottomNavDot"
                  className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary"
                  transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
