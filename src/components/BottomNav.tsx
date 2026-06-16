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
      className="fixed left-0 right-0 z-[100] pointer-events-none flex justify-center px-4"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
    >
      <nav
        className="pointer-events-auto glass-nav rounded-full shadow-premium-nav px-2 py-1.5 flex items-center justify-between gap-1 w-full max-w-sm"
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
                "relative flex-1 flex flex-col items-center justify-center gap-0.5 rounded-full py-2 px-1",
                "transition-colors duration-300 outline-none",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
              aria-label={tab.label}
            >
              {active && (
                <motion.span
                  layoutId="bottomNavPill"
                  className="absolute inset-0 rounded-full bg-primary/10"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <motion.span
                className="relative z-10 flex items-center justify-center"
                animate={{ scale: active ? 1.08 : 1, y: active ? -1 : 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
              >
                <Icon className="h-[20px] w-[20px]" strokeWidth={active ? 2.4 : 2} />
              </motion.span>
              <span
                className={cn(
                  "relative z-10 text-[10px] leading-none tracking-tight transition-all",
                  active ? "font-semibold opacity-100" : "font-medium opacity-80"
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
