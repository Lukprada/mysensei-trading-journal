import { Trade } from "@/types/trading";
import { computeMetrics, QuantMetrics } from "./quantMetrics";

export type Granularity = "weekly" | "monthly";

export type MetricFormat = "money" | "percent" | "ratio" | "number" | "rr" | "rmultiple" | "minutes";

export interface MetricMeta {
  key: keyof QuantMetrics;
  format: MetricFormat;
  /** negate the raw value when plotting (for displayed-as-negative metrics like avgLoss / maxDrawdown / grossLoss / largestLoss) */
  negate?: boolean;
  /** preferred default granularity */
  preferred: Granularity;
  /** only one granularity makes sense */
  lockTo?: Granularity;
  /** healthy / danger reference line */
  benchmark?: number;
}

// Map UI titles → underlying QuantMetrics field + display rules
export const METRIC_TIME_MAP: Record<string, MetricMeta> = {
  // Module 1
  "Win Rate":         { key: "winRate",            format: "percent", preferred: "weekly",  benchmark: 50 },
  "Profit Factor":    { key: "profitFactor",       format: "ratio",   preferred: "weekly",  benchmark: 1.5 },
  "Expectancy":       { key: "expectancy",         format: "money",   preferred: "weekly",  benchmark: 0 },
  "Payoff Ratio":     { key: "payoffRatio",        format: "ratio",   preferred: "weekly",  benchmark: 1 },
  "Z-Score":          { key: "zScore",             format: "number",  preferred: "monthly" },
  "Kelly %":          { key: "kellyPercent",       format: "percent", preferred: "weekly",  benchmark: 0 },
  "Avg Win":          { key: "avgWin",             format: "money",   preferred: "weekly" },
  "Avg Loss":         { key: "avgLoss",            format: "money",   preferred: "weekly", negate: true },

  // Module 2
  "Max Drawdown":     { key: "maxDrawdown",        format: "money",   preferred: "monthly", negate: true },
  "Ulcer Index":      { key: "ulcerIndex",         format: "number",  preferred: "monthly", benchmark: 5 },
  "Sharpe (per trade)": { key: "sharpeRatio",      format: "ratio",   preferred: "monthly", benchmark: 0.3 },
  "Sortino (per trade)": { key: "sortinoRatio",    format: "ratio",   preferred: "monthly", benchmark: 0.5 },
  "Recovery Factor":  { key: "recoveryFactor",     format: "ratio",   preferred: "monthly", benchmark: 2 },
  "Std Dev":          { key: "stdDev",             format: "money",   preferred: "weekly" },
  "Largest Win":      { key: "largestWin",         format: "money",   preferred: "weekly" },
  "Largest Loss":     { key: "largestLoss",        format: "money",   preferred: "weekly" },

  // Module 3
  "Max Win Streak":   { key: "maxConsecutiveWins", format: "number",  preferred: "monthly" },
  "Max Loss Streak":  { key: "maxConsecutiveLosses", format: "number", preferred: "monthly" },
  "Current Streak":   { key: "currentStreak",      format: "number",  preferred: "weekly" },
  "CAGR":             { key: "cagr",               format: "percent", preferred: "monthly", lockTo: "monthly" },
  "Total P&L":        { key: "totalPnL",           format: "money",   preferred: "weekly" },
  "Gross Profit":     { key: "grossProfit",        format: "money",   preferred: "weekly" },
  "Gross Loss":       { key: "grossLoss",          format: "money",   preferred: "weekly", negate: true },
  "Break-Even":       { key: "breakEven",          format: "number",  preferred: "monthly" },

  // Module 4
  "R-Expectancy":     { key: "rExpectancy",        format: "rmultiple", preferred: "weekly", benchmark: 0 },
  "Avg Planned R:R":  { key: "avgPlannedRR",       format: "rr",      preferred: "monthly", benchmark: 2 },
  "Hit-Rate vs Plan": { key: "hitRateVsPlan",      format: "percent", preferred: "monthly", benchmark: 60 },
  "Discipline Score": { key: "disciplineScore",    format: "percent", preferred: "weekly",  benchmark: 80 },
  "Avg Time (Wins)":  { key: "avgTimeInTradeWinMin", format: "minutes", preferred: "weekly" },
  "Avg Time (Losses)": { key: "avgTimeInTradeLossMin", format: "minutes", preferred: "weekly" },
  "Revenge Trades":   { key: "revengeTradeCount",  format: "number",  preferred: "weekly",  benchmark: 0 },
  "Coverage":         { key: "tradesWithPlan",     format: "number",  preferred: "monthly" },
};

function startOfISOWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay(); // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1 - day); // shift to Monday
  x.setDate(x.getDate() + diff);
  return x;
}
function endOfISOWeek(d: Date): Date {
  const s = startOfISOWeek(d);
  const e = new Date(s);
  e.setDate(s.getDate() + 4); // Mon..Fri (no weekend data)
  e.setHours(23, 59, 59, 999);
  return e;
}
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function addWeeks(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n * 7); return x; }
function addMonths(d: Date, n: number) { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; }

function fmtBucketLabel(date: Date, gran: Granularity): string {
  if (gran === "monthly") {
    return date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export interface MetricPoint {
  label: string;
  ts: number;
  value: number | null;
  trades: number;
}

/**
 * Compute the value of a single metric at each period-end across history.
 * For each bucket end, we run computeMetrics on all trades up to that point — so this is
 * the *cumulative running* trajectory of the metric (true to its definition).
 */
export function computeMetricSeries(
  trades: Trade[],
  metricTitle: string,
  granularity: Granularity,
  initialBalance: number,
): MetricPoint[] {
  const meta = METRIC_TIME_MAP[metricTitle];
  if (!meta || trades.length === 0) return [];

  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  const first = new Date(sorted[0].date);
  const last = new Date(sorted[sorted.length - 1].date);

  const bucketStart = granularity === "monthly" ? startOfMonth(first) : startOfISOWeek(first);
  const bucketEnd   = granularity === "monthly" ? endOfMonth(last)    : endOfISOWeek(last);

  const points: MetricPoint[] = [];
  let cursor = new Date(bucketStart);
  let safety = 0;
  while (cursor <= bucketEnd && safety++ < 600) {
    const periodEnd = granularity === "monthly" ? endOfMonth(cursor) : endOfISOWeek(cursor);
    const subset = sorted.filter((t) => new Date(t.date).getTime() <= periodEnd.getTime());
    if (subset.length > 0) {
      const m = computeMetrics(subset, initialBalance);
      const raw = m[meta.key] as number | null;
      let val: number | null = raw ?? null;
      if (val !== null && Number.isFinite(val)) {
        if (meta.negate) val = -val;
      } else {
        val = null;
      }
      points.push({
        label: fmtBucketLabel(periodEnd, granularity),
        ts: periodEnd.getTime(),
        value: val,
        trades: subset.length,
      });
    }
    cursor = granularity === "monthly" ? addMonths(cursor, 1) : addWeeks(cursor, 1);
  }
  return points;
}

export function formatMetricValue(v: number | null, format: MetricFormat): string {
  if (v === null || !Number.isFinite(v)) return "—";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  switch (format) {
    case "money":   return `${sign}$${abs.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    case "percent": return `${v.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
    case "ratio":   return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
    case "rr":      return `1:${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    case "rmultiple": return `${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}R`;
    case "minutes": return `${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}m`;
    case "number":  return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
}
