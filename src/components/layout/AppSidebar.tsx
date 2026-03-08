import { NavLink } from "@/components/NavLink";
import { LayoutDashboard, PlusCircle, List, Brain, LogOut, Activity } from "lucide-react";
import { AccountSelector } from "@/components/AccountSelector";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "New Trade", url: "/new-trade", icon: PlusCircle },
  { title: "Trade Log", url: "/trade-log", icon: List },
  { title: "Sensei AI", url: "/sensei", icon: Brain },
];

export function AppSidebar() {
  const { user, signOut } = useAuth();

  return (
    <Sidebar className="border-r border-primary/10 bg-sidebar">
      <SidebarHeader className="p-5 border-b border-primary/10">
        <div className="flex items-center gap-3 mb-5">
          <div className="relative">
            <div className="absolute inset-0 rounded-lg bg-primary/20 blur-md animate-pulse-glow" />
            <div className="relative h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-transparent border border-primary/30 flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-sm font-bold font-display tracking-[0.15em] text-gradient">TJ</h1>
            <p className="text-[10px] text-muted-foreground truncate max-w-[140px] font-mono-numbers">
              {user?.email}
            </p>
          </div>
        </div>
        <AccountSelector />
      </SidebarHeader>

      <SidebarContent className="p-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item, i) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground transition-all duration-200 group relative overflow-hidden"
                      activeClassName="text-primary bg-primary/10 border border-primary/15 shadow-[0_0_15px_hsl(var(--primary)/0.05)]"
                    >
                      <item.icon className="h-4 w-4 transition-colors group-hover:text-primary" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-primary/10">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-loss rounded-lg transition-all duration-200 hover:bg-loss/5"
        >
          <LogOut className="h-4 w-4" />
          Disconnect
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
