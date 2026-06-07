import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { ParticleGrid } from "@/components/effects/ParticleGrid";
import { GridOverlay } from "@/components/effects/GridOverlay";
import { Menu } from "lucide-react";

function AutoCloseOnNavigate() {
  const location = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();
  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [location.pathname, isMobile, setOpenMobile]);
  return null;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AutoCloseOnNavigate />
      <div className="min-h-screen flex w-full relative ambient-glow">
        <ParticleGrid />
        <GridOverlay />
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen relative z-10 min-w-0">
          <header className="h-14 flex items-center border-b border-primary/8 px-3 sm:px-4 glass-card sticky top-0 z-20 gap-2">
            <SidebarTrigger
              className="h-10 w-10 rounded-lg border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary transition-colors shadow-[0_0_12px_hsl(var(--primary)/0.15)] [&>svg]:hidden relative"
              aria-label="Toggle navigation"
            >
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <span className="text-[10px] text-muted-foreground font-mono-numbers tracking-wider hidden sm:inline">MENU</span>
            <div className="ml-auto flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
              <span className="text-[10px] text-muted-foreground font-mono-numbers tracking-wider">LIVE</span>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 overflow-auto relative">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
