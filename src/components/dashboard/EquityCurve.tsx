import { useTrading } from "@/contexts/TradingContext";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";

export function EquityCurve() {
  const { trades, activeAccount, accounts } = useTrading();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

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

  const strokeColor = isDark ? "hsl(165, 80%, 48%)" : "hsl(320, 75%, 48%)";
  const tickColor = isDark ? "hsl(240, 5%, 45%)" : "hsl(230, 12%, 40%)";
  const tooltipBg = isDark ? "hsl(240, 12%, 7%)" : "hsl(0, 0%, 100%)";
  const tooltipBorder = isDark ? "hsl(165, 80%, 48%, 0.2)" : "hsl(240, 10%, 86%)";
  const tooltipLabel = isDark ? "hsl(180, 10%, 92%)" : "hsl(230, 25%, 12%)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="glass-card rounded-xl p-5 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <h3 className="text-xs font-semibold text-foreground mb-5 uppercase tracking-wider flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
        Equity Curve
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={isDark ? 0.25 : 0.15} />
                <stop offset="50%" stopColor={strokeColor} stopOpacity={0.05} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: tickColor, fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: tickColor, fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: 10,
                fontSize: 11,
                fontFamily: "JetBrains Mono",
                boxShadow: isDark ? `0 0 20px hsl(165, 80%, 48%, 0.1)` : `0 4px 16px hsl(0, 0%, 0%, 0.08)`,
              }}
              labelStyle={{ color: tooltipLabel }}
              formatter={(v: number) => [`$${v.toLocaleString()}`, "Equity"]}
            />
            <Area type="monotone" dataKey="equity" stroke={strokeColor} strokeWidth={2} fill="url(#equityGrad)" dot={false}
              activeDot={{ r: 4, fill: strokeColor, stroke: isDark ? "hsl(240, 15%, 3%)" : "hsl(0, 0%, 100%)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
