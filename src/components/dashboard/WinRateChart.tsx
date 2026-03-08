import { useTrading } from "@/contexts/TradingContext";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";

export function WinRateChart() {
  const { trades } = useTrading();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const wins = trades.filter((t) => t.pnl > 0).length;
  const losses = trades.filter((t) => t.pnl < 0).length;
  const breakeven = trades.filter((t) => t.pnl === 0).length;

  const data = [
    { name: "Wins", value: wins },
    { name: "Losses", value: losses },
    ...(breakeven > 0 ? [{ name: "Breakeven", value: breakeven }] : []),
  ];

  const COLORS = isDark
    ? ["hsl(165, 80%, 48%)", "hsl(0, 72%, 55%)", "hsl(240, 5%, 45%)"]
    : ["hsl(152, 60%, 32%)", "hsl(0, 68%, 48%)", "hsl(230, 12%, 60%)"];

  const winRate = trades.length > 0 ? ((wins / trades.length) * 100).toFixed(1) : "0";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="glass-card rounded-xl p-5 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <h3 className="text-xs font-semibold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
        Win Rate
      </h3>
      <div className="h-56 flex items-center justify-center relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" strokeWidth={0}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? "hsl(240, 12%, 7%)" : "hsl(0, 0%, 100%)",
                border: `1px solid ${isDark ? "hsl(165, 80%, 48%, 0.2)" : "hsl(240, 10%, 86%)"}`,
                borderRadius: 10,
                fontSize: 11,
                fontFamily: "JetBrains Mono",
                boxShadow: isDark ? "0 0 20px hsl(165, 80%, 48%, 0.1)" : "0 4px 16px hsl(0, 0%, 0%, 0.08)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-3xl font-bold font-mono-numbers text-gradient">{winRate}%</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Win Rate</span>
        </div>
      </div>
      <div className="flex justify-center gap-5 mt-3">
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-profit" /> {wins} Wins
        </span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-loss" /> {losses} Losses
        </span>
      </div>
    </motion.div>
  );
}
