import { NavLink } from "@/components/NavLink";
import { LayoutDashboard, PlusCircle, List, Brain } from "lucide-react";
import { AccountSelector } from "@/components/AccountSelector";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
  { title: "Sensei", url: "/sensei", icon: Brain },
];

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm font-display">TJ</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground font-display tracking-wider">TRADEJOURNAL</h1>
            <p className="text-xs text-muted-foreground">Performance Tracker</p>
          </div>
        </div>
        <AccountSelector />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground uppercase tracking-wider">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      activeClassName="bg-accent text-foreground"
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground font-display tracking-wider">V1.0 — TRADE SMARTER</p>
      </SidebarFooter>
    </Sidebar>
  );
}
