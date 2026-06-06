import { useTrading } from "@/contexts/TradingContext";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from "recharts";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";

type Range = "1W" | "1M" | "3M" | "YTD" | "ALL";
const RANGES: Range[] = ["1W", "1M", "3M", "YTD", "ALL"];

function startDateFor(range: Range, fallback: Date): Date {
  const now = new Date();
  switch (range) {
    case "1W": { const d = new Date(now); d.setDate(d.getDate() - 7); return d; }
    case "1M": { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d; }
    case "3M": { const d = new Date(now); d.setMonth(d.getMonth() - 3); return d; }
    case "YTD": return new Date(now.getFullYear(), 0, 1);
    case "ALL": return fallback;
  }
}

export function EquityCurve() {
  const { trades, activeAccount, accounts, cashFlows } = useTrading();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [range, setRange] = useState<Range>("ALL");

  const { data, currency, startBalance, currentBalance } = useMemo(() => {
    const startBalance = activeAccount
      ? activeAccount.initialBalance
      : accounts.reduce((s, a) => s + a.initialBalance, 0);
    const currency = activeAccount?.currency || accounts[0]?.currency || "USD";

    // Merge trades + cash flows into a single chronological event stream
    type Event = { ts: number; delta: number; label: string };
    const events: Event[] = [];
    trades.forEach((t) => {
      events.push({ ts: new Date(t.date).getTime(), delta: t.pnl, label: t.date });
    });
    cashFlows.forEach((f) => {
      const ts = new Date(f.occurredAt).getTime();
      const delta = f.flowType === "deposit" ? f.amount : -f.amount;
      events.push({ ts, delta, label: new Date(f.occurredAt).toISOString().split("T")[0] });
    });
    events.sort((a, b) => a.ts - b.ts);

    const earliest = events[0] ? new Date(events[0].ts) : new Date();
    const cutoff = startDateFor(range, earliest).getTime();

    let cumulative = startBalance;
    const points: { date: string; equity: number }[] = [];

    // pre-roll: apply pre-cutoff events to set baseline
    let baseline = startBalance;
    events.forEach((e) => {
      if (e.ts < cutoff) baseline += e.delta;
    });
    cumulative = baseline;
    points.push({ date: new Date(Math.max(cutoff, earliest.getTime())).toISOString().split("T")[0], equity: Math.round(cumulative * 100) / 100 });

    events.forEach((e) => {
      if (e.ts < cutoff) return;
      cumulative += e.delta;
      points.push({ date: e.label, equity: Math.round(cumulative * 100) / 100 });
    });

    return { data: points, currency, startBalance, currentBalance: cumulative };
  }, [trades, activeAccount, accounts, cashFlows, range]);

  const strokeColor = isDark ? "hsl(165, 80%, 48%)" : "hsl(320, 75%, 48%)";
  const tickColor = isDark ? "hsl(240, 5%, 45%)" : "hsl(230, 12%, 40%)";
  const tooltipBg = isDark ? "hsl(240, 12%, 7%)" : "hsl(0, 0%, 100%)";
  const tooltipBorder = isDark ? "hsl(165, 80%, 48%, 0.2)" : "hsl(240, 10%, 86%)";
  const tooltipLabel = isDark ? "hsl(180, 10%, 92%)" : "hsl(230, 25%, 12%)";

  const fmt = (v: number) => {
    const abs = Math.abs(v);
    if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
    if (abs >= 10_000) return `${(v / 1_000).toFixed(1)}k`;
    return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="glass-card rounded-xl p-5 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
            Equity Curve {activeAccount ? `· ${activeAccount.name}` : "· Global"}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-1 font-mono-numbers">
            {symbol}{currentBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            <span className={`ml-2 ${currentBalance - startBalance >= 0 ? "text-profit" : "text-loss"}`}>
              {currentBalance - startBalance >= 0 ? "+" : ""}{symbol}{(currentBalance - startBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </p>
        </div>
        <div className="flex gap-1 bg-secondary/50 rounded-md p-0.5">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 text-[10px] rounded font-display tracking-wider transition-colors ${
                range === r ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
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
            <XAxis dataKey="date" tick={{ fill: tickColor, fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} minTickGap={30} />
            <YAxis
              tick={{ fill: tickColor, fontSize: 10, fontFamily: "JetBrains Mono" }}
              axisLine={false}
              tickLine={false}
              domain={["auto", "auto"]}
              tickFormatter={(v) => `${symbol}${fmt(v)}`}
              width={70}
            />
            <ReferenceLine y={startBalance} stroke={tickColor} strokeDasharray="3 3" strokeOpacity={0.4} />
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
              formatter={(v: number) => [`${symbol}${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, "Balance"]}
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
