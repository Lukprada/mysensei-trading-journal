import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { ParticleGrid } from "@/components/effects/ParticleGrid";
import { GridOverlay } from "@/components/effects/GridOverlay";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full relative">
        <ParticleGrid />
        <GridOverlay />
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen relative z-10">
          <header className="h-12 flex items-center border-b border-primary/8 px-4 glass-card sticky top-0 z-20">
            <SidebarTrigger className="text-muted-foreground hover:text-primary transition-colors" />
            <div className="ml-auto flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
              <span className="text-[10px] text-muted-foreground font-mono-numbers tracking-wider">LIVE</span>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto relative">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
