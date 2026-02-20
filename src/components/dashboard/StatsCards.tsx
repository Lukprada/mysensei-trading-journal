import { useTrading } from "@/contexts/TradingContext";
import { TrendingUp, TrendingDown, BarChart3, Target, DollarSign, Activity } from "lucide-react";
import { motion } from "framer-motion";

export function StatsCards() {
  const { trades, accounts, activeAccount } = useTrading();

  const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
  const wins = trades.filter((t) => t.pnl > 0).length;
  const losses = trades.filter((t) => t.pnl < 0).length;
  const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;
  const avgWin = wins > 0 ? trades.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnl, 0) / wins : 0;
  const avgLoss = losses > 0 ? Math.abs(trades.filter((t) => t.pnl < 0).reduce((s, t) => s + t.pnl, 0) / losses) : 0;
  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;
  const totalBalance = activeAccount ? activeAccount.balance : accounts.reduce((s, a) => s + a.balance, 0);

  const stats = [
    {
      label: "Total P&L",
      value: `${totalPnL >= 0 ? "+" : ""}$${totalPnL.toFixed(2)}`,
      icon: totalPnL >= 0 ? TrendingUp : TrendingDown,
      positive: totalPnL >= 0,
    },
    {
      label: "Win Rate",
      value: `${winRate.toFixed(1)}%`,
      icon: Target,
      positive: winRate >= 50,
    },
    {
      label: "Total Trades",
      value: trades.length.toString(),
      icon: BarChart3,
      positive: true,
    },
    {
      label: "Profit Factor",
      value: profitFactor === Infinity ? "∞" : profitFactor.toFixed(2),
      icon: Activity,
      positive: profitFactor >= 1,
    },
    {
      label: "Balance",
      value: `$${totalBalance.toLocaleString()}`,
      icon: DollarSign,
      positive: true,
    },
    {
      label: "Avg Win / Loss",
      value: `$${avgWin.toFixed(0)} / $${avgLoss.toFixed(0)}`,
      icon: BarChart3,
      positive: avgWin > avgLoss,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className={`rounded-lg border border-border bg-card p-4 ${stat.positive ? "glow-profit" : "glow-loss"}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">{stat.label}</span>
            <stat.icon className={`h-4 w-4 ${stat.positive ? "text-profit" : "text-loss"}`} />
          </div>
          <p className={`text-lg font-semibold font-mono-numbers ${stat.positive ? "text-profit" : "text-loss"}`}>
            {stat.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
