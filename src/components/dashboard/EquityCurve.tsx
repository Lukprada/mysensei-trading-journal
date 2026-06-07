import { useTrading } from "@/contexts/TradingContext";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from "recharts";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";

type Range = "1W" | "1M" | "3M" | "YTD" | "ALL";
const RANGES: Range[] = ["1W", "1M", "3M", "YTD", "ALL"];

// Parse a YYYY-MM-DD or ISO date string consistently (avoid local TZ drift)
function parseTs(input: string): number {
  if (!input) return 0;
  // YYYY-MM-DD => treat as local midnight
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [y, m, d] = input.split("-").map(Number);
    return new Date(y, m - 1, d).getTime();
  }
  return new Date(input).getTime();
}

// Pure, side-effect-free range start calculator
function startTsFor(range: Range, earliestTs: number): number {
  const now = Date.now();
  const day = 86400000;
  switch (range) {
    case "1W": return now - 7 * day;
    case "1M": return now - 30 * day;
    case "3M": return now - 90 * day;
    case "YTD": return new Date(new Date().getFullYear(), 0, 1).getTime();
    case "ALL": return earliestTs;
  }
}

export function EquityCurve() {
  const { trades, activeAccount, accounts, cashFlows } = useTrading();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [range, setRange] = useState<Range>("ALL");

  const { data, currency, startBalance, currentBalance, peakBalance } = useMemo(() => {
    const startBalance = activeAccount
      ? activeAccount.initialBalance
      : accounts.reduce((s, a) => s + a.initialBalance, 0);
    const currency = activeAccount?.currency || accounts[0]?.currency || "USD";

    // 1) Merge trades + cash flows into one chronological event stream
    type Event = { ts: number; delta: number; label: string };
    const events: Event[] = [];
    trades.forEach((t) => {
      events.push({ ts: parseTs(t.date), delta: t.pnl, label: t.date });
    });
    cashFlows.forEach((f) => {
      const ts = parseTs(f.occurredAt);
      const delta = f.flowType === "deposit" ? f.amount : -f.amount;
      events.push({ ts, delta, label: new Date(ts).toISOString().split("T")[0] });
    });
    events.sort((a, b) => a.ts - b.ts);

    // 2) Compute the FULL cumulative balance series from day one
    let running = startBalance;
    const fullSeries: { ts: number; date: string; equity: number }[] = [
      { ts: events[0]?.ts ?? Date.now(), date: events[0]?.label ?? new Date().toISOString().split("T")[0], equity: Math.round(running * 100) / 100 },
    ];
    events.forEach((e) => {
      running += e.delta;
      fullSeries.push({ ts: e.ts, date: e.label, equity: Math.round(running * 100) / 100 });
    });

    const currentBalance = running;
    const peakBalance = fullSeries.reduce((m, p) => Math.max(m, p.equity), startBalance);

    // 3) Slice the precomputed series to the active range, preserving the last
    //    pre-cutoff point as the baseline so the line starts at the true value
    const earliestTs = fullSeries[0]?.ts ?? Date.now();
    const cutoff = startTsFor(range, earliestTs);
    let baselinePoint = fullSeries[0];
    const sliced: typeof fullSeries = [];
    for (const p of fullSeries) {
      if (p.ts < cutoff) {
        baselinePoint = p;
        continue;
      }
      sliced.push(p);
    }
    if (range !== "ALL" && sliced.length > 0) {
      sliced.unshift({ ts: cutoff, date: new Date(cutoff).toISOString().split("T")[0], equity: baselinePoint.equity });
    }
    const data = (sliced.length > 0 ? sliced : fullSeries).map((p) => ({ date: p.date, equity: p.equity }));

    return { data, currency, startBalance, currentBalance, peakBalance };
  }, [trades, activeAccount, accounts, cashFlows, range]);

  const strokeColor = isDark ? "hsl(165, 80%, 48%)" : "hsl(320, 75%, 48%)";
  const tickColor = isDark ? "hsl(240, 5%, 45%)" : "hsl(230, 12%, 40%)";
  const tooltipBg = isDark ? "hsl(240, 12%, 7%)" : "hsl(0, 0%, 100%)";
  const tooltipBorder = isDark ? "hsl(165, 80%, 48%, 0.2)" : "hsl(240, 10%, 86%)";
  const tooltipLabel = isDark ? "hsl(180, 10%, 92%)" : "hsl(230, 25%, 12%)";

  const fmt = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  const change = currentBalance - startBalance;

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
          <p className="text-[11px] text-muted-foreground mt-1 font-mono-numbers flex flex-wrap gap-x-3">
            <span>Balance: <span className="text-foreground">{symbol}{fmt(currentBalance)}</span></span>
            <span className={change >= 0 ? "text-profit" : "text-loss"}>
              {change >= 0 ? "+" : ""}{symbol}{fmt(change)}
            </span>
            <span>Peak: <span className="text-foreground">{symbol}{fmt(peakBalance)}</span></span>
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
              tickFormatter={(v) => `${symbol}${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
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
              formatter={(v: number) => [`${symbol}${fmt(v)}`, "Balance"]}
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
