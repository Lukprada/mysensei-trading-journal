import { StatsCards } from "@/components/dashboard/StatsCards";
import { EquityCurve } from "@/components/dashboard/EquityCurve";
import { WinRateChart } from "@/components/dashboard/WinRateChart";
import { TradeCalendar } from "@/components/dashboard/TradeCalendar";
import { TradeListPanel } from "@/components/dashboard/TradeListPanel";
import { useTrading } from "@/contexts/TradingContext";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Link2, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { activeAccount, accounts, allTrades, loading } = useTrading();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const tradePanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedDate && tradePanelRef.current && window.innerWidth < 1024) {
      tradePanelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedDate]);

  const hasAccounts = accounts.length > 0;
  const hasTrades = allTrades.length > 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-end justify-between"
      >
        <div>
          <h2 className="text-xl font-bold text-gradient font-display tracking-[0.15em]">
            {activeAccount ? activeAccount.name.toUpperCase() : "COMMAND CENTER"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1.5 tracking-wider">
            {activeAccount
              ? `${activeAccount.type.charAt(0).toUpperCase() + activeAccount.type.slice(1)} Account · ${activeAccount.currency}`
              : "Aggregated performance across all accounts"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono-numbers">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
          REALTIME
        </div>
      </motion.div>

      {!loading && !hasAccounts ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card/50 to-card/30 backdrop-blur p-10 md:p-14 text-center"
        >
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.18),transparent_60%)]" />
          <div className="mx-auto h-14 w-14 rounded-xl border border-primary/30 bg-primary/10 flex items-center justify-center mb-5">
            <Link2 className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-display tracking-[0.15em] text-gradient mb-2">
            NO ACCOUNTS YET
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Connect Myfxbook to automatically import your live, demo, or funded
            accounts. Each imported account can then be renamed and tagged as Live, Demo, or Funded.
          </p>
          <div className="flex items-center justify-center">
            <Button asChild>
              <Link to="/myfxbook-sync">
                <RefreshCw className="h-4 w-4 mr-2" />
                Connect Myfxbook
              </Link>
            </Button>
          </div>
        </motion.div>
      ) : (
        <>
          <StatsCards />

          {hasAccounts && !hasTrades && (
            <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-5 text-sm text-muted-foreground flex items-center justify-between gap-4 flex-wrap">
              <div>
                <span className="text-foreground font-medium">No trades yet on this account.</span>{" "}
                Sync Myfxbook to populate your dashboard.
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to="/myfxbook-sync">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync now
                </Link>
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <EquityCurve />
            </div>
            <WinRateChart />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <TradeCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            </div>
            <div ref={tradePanelRef} className="scroll-mt-16">
              <TradeListPanel selectedDate={selectedDate} onClearDate={() => setSelectedDate(null)} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
