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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-xl font-semibold text-foreground font-display tracking-wide">
          {activeAccount ? activeAccount.name : "COMMAND CENTER"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {activeAccount
            ? `${activeAccount.type.charAt(0).toUpperCase() + activeAccount.type.slice(1)} Account · ${activeAccount.currency}`
            : "Aggregated performance across all accounts"}
        </p>
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
