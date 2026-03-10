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
    <nav className="fixed bottom-0 left-0 right-0 z-[100] glass border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex flex-col items-center gap-0.5 flex-1 py-1.5 relative transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              {active && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-0.5 w-8 h-0.5 rounded-full bg-gradient-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <tab.icon className={cn("h-5 w-5 transition-transform", active && "scale-110")} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
