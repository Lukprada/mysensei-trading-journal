import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TradingProvider } from "@/contexts/TradingContext";
import { ThemeProvider } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import TradeLog from "./pages/TradeLog";
import NewTrade from "./pages/NewTrade";
import TradeView from "./pages/TradeView";
import SenseiChat from "./pages/SenseiChat";
import AnalysisList from "./pages/AnalysisList";
import AnalysisEditor from "./pages/AnalysisEditor";
import AnalysisView from "./pages/AnalysisView";
import PublicAnalysisView from "./pages/PublicAnalysisView";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse-glow" />
          <div className="h-10 w-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <TradingProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/trade-log" element={<TradeLog />} />
          <Route path="/new-trade" element={<NewTrade />} />
          <Route path="/trade/:id" element={<TradeView />} />
          <Route path="/sensei" element={<SenseiChat />} />
          <Route path="/analysis" element={<AnalysisList />} />
          <Route path="/analysis/new" element={<AnalysisEditor />} />
          <Route path="/analysis/:id" element={<AnalysisView />} />
          <Route path="/analysis/:id/edit" element={<AnalysisEditor />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </TradingProvider>
  );
}

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/shared/analysis/:id" element={<PublicAnalysisView />} />
            <Route path="/*" element={<AppRoutes />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
