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
} from "lucide-react";
import appLogo from "@/assets/app-logo.png";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Habits", url: "/habits", icon: Target },
  { title: "Timer", url: "/timer", icon: Timer },
  { title: "To-Do List", url: "/todos", icon: ListTodo },
  { title: "Challenges", url: "/challenges", icon: Swords },
  { title: "Shop", url: "/shop", icon: ShoppingBag },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Journal", url: "/journal", icon: BookOpen },
  { title: "Goals", url: "/goals", icon: Crosshair },
  { title: "Partners", url: "/partners", icon: Handshake },
  { title: "Community", url: "/community", icon: Users },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
  { title: "Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 flex items-center gap-2">
          <img src={appLogo} alt="Ignite HabitPro" className="w-8 h-8 rounded-lg shadow-glow-primary" />
          {!collapsed && (
            <span className="font-display font-bold text-lg">Ignite HabitPro</span>
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
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
      </SidebarContent>
    </Sidebar>
  );
}
