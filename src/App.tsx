import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TradingProvider } from "@/contexts/TradingContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import TradeLog from "./pages/TradeLog";
import NewTrade from "./pages/NewTrade";
import TradeView from "./pages/TradeView";
import SenseiChat from "./pages/SenseiChat";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <TradingProvider>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/trade-log" element={<TradeLog />} />
              <Route path="/new-trade" element={<NewTrade />} />
              <Route path="/trade/:id" element={<TradeView />} />
              <Route path="/sensei" element={<SenseiChat />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TradingProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
