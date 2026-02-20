import { useTrading } from "@/contexts/TradingContext";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useMemo } from "react";

export function EquityCurve() {
  const { trades, activeAccount, accounts } = useTrading();

  const data = useMemo(() => {
    const startBalance = activeAccount
      ? activeAccount.initialBalance
      : accounts.reduce((s, a) => s + a.initialBalance, 0);

    const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
    let cumulative = startBalance;

    const points = [{ date: "Start", equity: startBalance }];
    sorted.forEach((t) => {
      cumulative += t.pnl;
      points.push({ date: t.date, equity: Math.round(cumulative * 100) / 100 });
    });

    return points;
  }, [trades, activeAccount, accounts]);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-medium text-foreground mb-4">Equity Curve</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: "hsl(212, 9%, 58%)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(212, 9%, 58%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(215, 21%, 11%)", border: "1px solid hsl(215, 14%, 21%)", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "hsl(208, 39%, 93%)" }}
              formatter={(v: number) => [`$${v.toLocaleString()}`, "Equity"]}
            />
            <Area type="monotone" dataKey="equity" stroke="hsl(142, 71%, 45%)" strokeWidth={2} fill="url(#equityGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
