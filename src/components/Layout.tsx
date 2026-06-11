import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { BottomNav } from "@/components/BottomNav";
import { SidebarTutorial } from "@/components/SidebarTutorial";
import { FocusProtectionOverlay } from "@/components/FocusProtectionOverlay";
import { useTheme } from "@/lib/store";
import { useStreakAlerts } from "@/lib/use-streak-alerts";
import { usePushNotifications } from "@/lib/use-push-notifications";
import { useLocation } from "react-router-dom";

export function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme();
  useStreakAlerts();
  usePushNotifications();
  const location = useLocation();

  // Hide bottom nav and header in deep focus mode
  const isTimerFocused = location.pathname === "/timer" && localStorage.getItem("timer_state");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-safe-top glass-nav sticky top-0 z-[51]" aria-hidden="true" />
          <header
            className="h-14 flex items-center justify-between px-4 glass-nav sticky z-[50]"
            style={{ top: 'env(safe-area-inset-top, 0px)' }}
          >
            <SidebarTrigger />
            <SidebarTutorial />
            <div className="flex items-center gap-2">
              <NotificationBell />
              <ThemeToggle theme={theme} toggle={toggle} />
            </div>
          </header>
          <main className="flex-1 overflow-auto overflow-x-hidden p-4 md:p-6 pb-32 md:pb-6">
            {children}
          </main>
          {/* Floating bottom nav for mobile */}
          <div className="md:hidden">
            <BottomNav />
          </div>
        </div>
      </div>
      <FocusProtectionOverlay />
    </SidebarProvider>
  );
}
