import { useMemo, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import { useTrading } from "@/contexts/TradingContext";
import { useTheme } from "@/hooks/useTheme";
import {
  computeMetricSeries, formatMetricValue, METRIC_TIME_MAP, Granularity,
} from "@/lib/metricTimeSeries";

interface Props {
  metricTitle: string;
}

export function MetricTrendChart({ metricTitle }: Props) {
  const { trades, activeAccount } = useTrading();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const meta = METRIC_TIME_MAP[metricTitle];
  const initialBalance = activeAccount?.initialBalance || 10000;

  const [granularity, setGranularity] = useState<Granularity>(meta?.lockTo || meta?.preferred || "weekly");

  const data = useMemo(
    () => computeMetricSeries(trades, metricTitle, granularity, initialBalance),
    [trades, metricTitle, granularity, initialBalance],
  );

  if (!meta) return null;

  const values = data.map((d) => d.value).filter((v): v is number => v !== null && Number.isFinite(v));
  const latest = values.length ? values[values.length - 1] : null;
  const previous = values.length > 1 ? values[values.length - 2] : null;
  const peak = values.length ? Math.max(...values) : null;
  const trough = values.length ? Math.min(...values) : null;
  const delta = latest !== null && previous !== null ? latest - previous : null;
  const trendUp = delta !== null && delta > 0;
  const trendDown = delta !== null && delta < 0;

  // Stroke chosen from "good direction" — most metrics: up is good (primary green-ish).
  // For metrics where lower-is-better (Ulcer, Revenge, Max Drawdown displayed negated, etc.), let trend color invert.
  const lowerIsBetter = new Set([
    "Ulcer Index", "Revenge Trades", "Max Loss Streak", "Avg Time (Losses)",
  ]);
  const isGoodTrend =
    delta !== null &&
    ((trendUp && !lowerIsBetter.has(metricTitle)) ||
      (trendDown && lowerIsBetter.has(metricTitle)));

  const strokeColor = isDark ? "hsl(165, 80%, 55%)" : "hsl(320, 75%, 48%)";
  const gridColor = isDark ? "hsl(180, 10%, 18%)" : "hsl(230, 12%, 88%)";
  const axisColor = isDark ? "hsl(240, 5%, 50%)" : "hsl(230, 12%, 40%)";

  if (data.length < 2) {
    return (
      <div className="rounded-lg border border-dashed border-primary/20 bg-background/30 p-6 text-center">
        <Activity className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">
          Need at least 2 {granularity === "monthly" ? "months" : "weeks"} of trades to chart this metric's evolution.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border border-primary/20 bg-gradient-to-b from-background/60 to-background/20 backdrop-blur p-4 relative overflow-hidden"
    >
      {/* glow strip */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

      <div className="flex items-start justify-between mb-3 gap-3 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-display mb-1">
            Historical Behavior
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-foreground">
              {formatMetricValue(latest, meta.format)}
            </span>
            {delta !== null && (
              <span
                className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${
                  isGoodTrend
                    ? "bg-profit/15 text-profit"
                    : trendUp || trendDown
                    ? "bg-loss/15 text-loss"
                    : "bg-muted/30 text-muted-foreground"
                }`}
              >
                {trendUp ? <TrendingUp className="inline h-3 w-3 mr-0.5" />
                  : trendDown ? <TrendingDown className="inline h-3 w-3 mr-0.5" />
                  : <Minus className="inline h-3 w-3 mr-0.5" />}
                {delta > 0 ? "+" : ""}{formatMetricValue(delta, meta.format)}
              </span>
            )}
          </div>
        </div>

        {!meta.lockTo && (
          <div className="inline-flex rounded-md border border-primary/20 bg-background/50 p-0.5 text-[10px] font-display uppercase tracking-wider">
            {(["weekly", "monthly"] as Granularity[]).map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  granularity === g
                    ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {g === "weekly" ? "Mon–Fri" : "Month"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`trendGrad-${metricTitle}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.35} />
                <stop offset="60%" stopColor={strokeColor} stopOpacity={0.08} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: axisColor, fontSize: 10, fontFamily: "JetBrains Mono" }}
              axisLine={false}
              tickLine={false}
              minTickGap={20}
            />
            <YAxis
              tick={{ fill: axisColor, fontSize: 10, fontFamily: "JetBrains Mono" }}
              axisLine={false}
              tickLine={false}
              width={50}
              tickFormatter={(v) => formatMetricValue(v, meta.format)}
            />
            {meta.benchmark !== undefined && (
              <ReferenceLine
                y={meta.benchmark}
                stroke={isDark ? "hsl(50, 90%, 60%)" : "hsl(35, 90%, 50%)"}
                strokeDasharray="4 4"
                strokeOpacity={0.6}
                label={{
                  value: `target ${formatMetricValue(meta.benchmark, meta.format)}`,
                  fill: isDark ? "hsl(50, 90%, 60%)" : "hsl(35, 90%, 45%)",
                  fontSize: 9,
                  position: "insideTopRight",
                }}
              />
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? "hsl(240, 12%, 7%)" : "hsl(0, 0%, 100%)",
                border: `1px solid ${strokeColor}33`,
                borderRadius: 10,
                fontSize: 11,
                fontFamily: "JetBrains Mono",
                boxShadow: `0 0 24px ${strokeColor}22`,
              }}
              labelStyle={{ color: isDark ? "hsl(180,10%,92%)" : "hsl(230,25%,12%)" }}
              formatter={(value: number, _name, p: any) => [
                `${formatMetricValue(value, meta.format)}  ·  ${p?.payload?.trades ?? 0} trades`,
                metricTitle,
              ]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={2}
              fill={`url(#trendGrad-${metricTitle})`}
              connectNulls
              dot={false}
              activeDot={{
                r: 4,
                fill: strokeColor,
                stroke: isDark ? "hsl(240,15%,3%)" : "hsl(0,0%,100%)",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Mini-stats */}
      <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-primary/10">
        <Stat label="Latest" value={formatMetricValue(latest, meta.format)} highlight />
        <Stat label="Peak" value={formatMetricValue(peak, meta.format)} />
        <Stat label="Trough" value={formatMetricValue(trough, meta.format)} />
        <Stat label="Periods" value={`${data.length}`} />
      </div>
    </motion.div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70 font-display">{label}</div>
      <div className={`text-xs font-mono mt-0.5 ${highlight ? "text-primary" : "text-foreground/80"}`}>
        {value}
      </div>
    </div>
  );
}
