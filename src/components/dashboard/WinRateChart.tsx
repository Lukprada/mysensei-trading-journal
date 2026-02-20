import { useTrading } from "@/contexts/TradingContext";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export function WinRateChart() {
  const { trades } = useTrading();
  const wins = trades.filter((t) => t.pnl > 0).length;
  const losses = trades.filter((t) => t.pnl < 0).length;
  const breakeven = trades.filter((t) => t.pnl === 0).length;

  const data = [
    { name: "Wins", value: wins },
    { name: "Losses", value: losses },
    ...(breakeven > 0 ? [{ name: "Breakeven", value: breakeven }] : []),
  ];

  const COLORS = ["hsl(142, 71%, 45%)", "hsl(0, 84%, 60%)", "hsl(212, 9%, 58%)"];
  const winRate = trades.length > 0 ? ((wins / trades.length) * 100).toFixed(1) : "0";

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-medium text-foreground mb-4">Win Rate</h3>
      <div className="h-64 flex items-center justify-center relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" strokeWidth={0}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(215, 21%, 11%)", border: "1px solid hsl(215, 14%, 21%)", borderRadius: 8, fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-2xl font-bold font-mono-numbers text-foreground">{winRate}%</span>
          <span className="text-xs text-muted-foreground">Win Rate</span>
        </div>
      </div>
      <div className="flex justify-center gap-4 mt-2">
        <span className="flex items-center gap-1.5 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-profit" /> {wins} Wins
        </span>
        <span className="flex items-center gap-1.5 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-loss" /> {losses} Losses
        </span>
      </div>
    </div>
  );
}
