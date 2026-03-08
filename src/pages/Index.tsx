import { StatsCards } from "@/components/dashboard/StatsCards";
import { EquityCurve } from "@/components/dashboard/EquityCurve";
import { WinRateChart } from "@/components/dashboard/WinRateChart";
import { RecentTrades } from "@/components/dashboard/RecentTrades";
import { TradeCalendar } from "@/components/dashboard/TradeCalendar";
import { useTrading } from "@/contexts/TradingContext";
import { motion } from "framer-motion";

const Dashboard = () => {
  const { activeAccount } = useTrading();

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

      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <EquityCurve />
        </div>
        <WinRateChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TradeCalendar />
        </div>
        <RecentTrades />
      </div>
    </div>
  );
};

export default Dashboard;
