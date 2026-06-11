import {
  LayoutDashboard,
  Target,
  Timer,
  ListTodo,
  Swords,
  Users,
  Trophy,
  User,
  Handshake,
  ShoppingBag,
  BarChart3,
  BookOpen,
  Crosshair,
  Brain,
  Crown,
  Gift,
} from "lucide-react";
import appLogo from "@/assets/app-logo.png";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const sections = [
  {
    label: "Productivity",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Habits", url: "/habits", icon: Target },
      { title: "Timer", url: "/timer", icon: Timer },
      { title: "To-Do List", url: "/todos", icon: ListTodo },
      { title: "Journal", url: "/journal", icon: BookOpen },
      { title: "Goals", url: "/goals", icon: Crosshair },
      { title: "AI Planner", url: "/daily-planner", icon: Brain },
    ],
  },
  {
    label: "Community",
    items: [
      { title: "Focus Rooms", url: "/focus-rooms", icon: Users },
      { title: "Partners", url: "/partners", icon: Handshake },
      { title: "Community", url: "/community", icon: Users },
      { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
    ],
  },
  {
    label: "Progress & Extras",
    items: [
      { title: "Reports", url: "/reports", icon: BarChart3 },
      { title: "Challenges", url: "/challenges", icon: Swords },
      { title: "Shop", url: "/shop", icon: ShoppingBag },
      { title: "Invite Friends", url: "/refer", icon: Gift },
      { title: "Premium", url: "/pricing", icon: Crown },
      { title: "Profile", url: "/profile", icon: User },
    ],
  },
];

export function AppSidebar() {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const closeOnMobile = () => { if (isMobile) setOpenMobile(false); };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div
          className="px-4 pb-4 flex items-center gap-2"
          style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
        >
          <img src={appLogo} alt="Ignite HabitPro" className="w-8 h-8 rounded-lg shadow-glow-primary shrink-0" />
          {!collapsed && (
            <span className="font-display font-bold text-lg truncate">Ignite HabitPro</span>
          )}
        </div>
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            {!collapsed && <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/60">{section.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        onClick={closeOnMobile}
                        className="hover:bg-sidebar-accent/50 transition-colors"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <item.icon className="h-4 w-4 mr-2" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
