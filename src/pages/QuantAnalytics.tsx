import { useMemo } from "react";
import { useTrading } from "@/contexts/TradingContext";
import { computeMetrics, interpretZScore, interpretKelly } from "@/lib/quantMetrics";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, TrendingDown, Target, Activity, Zap, Shield,
  BarChart3, Flame, Snowflake, Award, AlertTriangle, Gauge,
} from "lucide-react";

interface PillarProps {
  title: string;
  value: string;
  hint?: string;
  icon: React.ElementType;
  tone?: "positive" | "negative" | "neutral" | "warning";
  formula?: string;
}

function Pillar({ title, value, hint, icon: Icon, tone = "neutral", formula }: PillarProps) {
  const toneClass =
    tone === "positive" ? "text-profit border-profit/30"
    : tone === "negative" ? "text-loss border-loss/30"
    : tone === "warning" ? "text-yellow-400 border-yellow-400/30"
    : "text-primary border-primary/20";

  return (
    <Card className={`p-5 bg-card/50 backdrop-blur border ${toneClass} transition-all hover:scale-[1.02]`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-display">
            {title}
          </span>
        </div>
      </div>
      <div className="text-2xl font-bold font-mono-numbers mb-1">{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      {formula && (
        <div className="text-[10px] text-muted-foreground/60 mt-2 font-mono">{formula}</div>
      )}
    </Card>
  );
}

export default function QuantAnalytics() {
  const { trades, activeAccount } = useTrading();
  const initBalance = activeAccount?.initialBalance || 10000;

  const m = useMemo(() => computeMetrics(trades, initBalance), [trades, initBalance]);

  if (trades.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <BarChart3 className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h2 className="text-xl font-display tracking-wider mb-2">No Data to Quantify</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Log at least one trade to see your edge measured across the Quant Library.
        </p>
      </div>
    );
  }

  const fmt = (n: number, d = 2) =>
    Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: d }) : "∞";
  const money = (n: number) => `${n >= 0 ? "+" : "-"}$${fmt(Math.abs(n))}`;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">
            QUANT LIBRARY · v1
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            Computed from {trades.length} trade{trades.length === 1 ? "" : "s"}
          </span>
        </div>
        <h1 className="text-3xl font-display tracking-[0.1em] text-gradient">
          Edge & Risk Metrics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pure math on your trade log — no external data, no AI guesses.
        </p>
      </div>

      {/* Module 1 — Probability & Skill */}
      <section>
        <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 font-display">
          ⚡ Module 1 — Probability & Skill
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Pillar
            title="Win Rate"
            value={`${fmt(m.winRate, 1)}%`}
            hint={`${m.wins}W / ${m.losses}L`}
            icon={Target}
            tone={m.winRate >= 50 ? "positive" : "negative"}
          />
          <Pillar
            title="Profit Factor"
            value={fmt(m.profitFactor)}
            hint={m.profitFactor >= 1.5 ? "Healthy edge" : m.profitFactor >= 1 ? "Marginal" : "Losing system"}
            icon={Activity}
            tone={m.profitFactor >= 1.5 ? "positive" : m.profitFactor >= 1 ? "warning" : "negative"}
            formula="GrossProfit / GrossLoss"
          />
          <Pillar
            title="Expectancy"
            value={money(m.expectancy)}
            hint="Avg $ per trade"
            icon={Award}
            tone={m.expectancy >= 0 ? "positive" : "negative"}
            formula="(W%·avgW) − (L%·avgL)"
          />
          <Pillar
            title="Payoff Ratio"
            value={`${fmt(m.payoffRatio)} : 1`}
            hint="Avg win vs avg loss"
            icon={BarChart3}
            tone={m.payoffRatio >= 1 ? "positive" : "warning"}
          />
          <Pillar
            title="Z-Score"
            value={fmt(m.zScore)}
            hint={interpretZScore(m.zScore)}
            icon={Zap}
            tone="neutral"
            formula="Wald–Wolfowitz runs"
          />
          <Pillar
            title="Kelly %"
            value={`${fmt(m.kellyPercent, 1)}%`}
            hint={interpretKelly(m.kellyPercent)}
            icon={Gauge}
            tone={m.kellyPercent > 0 ? "positive" : "negative"}
            formula="W − (1−W)/R"
          />
          <Pillar
            title="Avg Win"
            value={money(m.avgWin)}
            icon={TrendingUp}
            tone="positive"
          />
          <Pillar
            title="Avg Loss"
            value={money(-m.avgLoss)}
            icon={TrendingDown}
            tone="negative"
          />
        </div>
      </section>

      {/* Module 2 — Risk & Drawdown */}
      <section>
        <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 font-display">
          🛡️ Module 2 — Risk & Drawdown
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Pillar
            title="Max Drawdown"
            value={money(-m.maxDrawdown)}
            hint={`${fmt(m.maxDrawdownPct, 2)}% peak-to-valley`}
            icon={AlertTriangle}
            tone="negative"
          />
          <Pillar
            title="Ulcer Index"
            value={fmt(m.ulcerIndex, 2)}
            hint="Drawdown pain (RMS)"
            icon={Shield}
            tone={m.ulcerIndex < 5 ? "positive" : m.ulcerIndex < 10 ? "warning" : "negative"}
          />
          <Pillar
            title="Sharpe (per trade)"
            value={fmt(m.sharpeRatio)}
            hint="Return / volatility"
            icon={Activity}
            tone={m.sharpeRatio >= 0.3 ? "positive" : "warning"}
            formula="μ / σ"
          />
          <Pillar
            title="Sortino (per trade)"
            value={fmt(m.sortinoRatio)}
            hint="Return / downside vol"
            icon={Activity}
            tone={m.sortinoRatio >= 0.5 ? "positive" : "warning"}
            formula="μ / σ_down"
          />
          <Pillar
            title="Recovery Factor"
            value={fmt(m.recoveryFactor)}
            hint="Net profit / max DD"
            icon={Award}
            tone={m.recoveryFactor >= 2 ? "positive" : "warning"}
          />
          <Pillar
            title="Std Dev"
            value={`$${fmt(m.stdDev)}`}
            hint="P&L volatility"
            icon={BarChart3}
            tone="neutral"
          />
          <Pillar
            title="Largest Win"
            value={money(m.largestWin)}
            icon={Flame}
            tone="positive"
          />
          <Pillar
            title="Largest Loss"
            value={money(m.largestLoss)}
            icon={Snowflake}
            tone="negative"
          />
        </div>
      </section>

      {/* Module 3 — Streaks & Consistency */}
      <section>
        <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 font-display">
          🔥 Module 3 — Streaks & Consistency
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Pillar
            title="Max Win Streak"
            value={`${m.maxConsecutiveWins}`}
            icon={Flame}
            tone="positive"
          />
          <Pillar
            title="Max Loss Streak"
            value={`${m.maxConsecutiveLosses}`}
            icon={Snowflake}
            tone="negative"
          />
          <Pillar
            title="Current Streak"
            value={m.currentStreak === 0 ? "—" : `${Math.abs(m.currentStreak)} ${m.currentStreak > 0 ? "W" : "L"}`}
            icon={Activity}
            tone={m.currentStreak >= 0 ? "positive" : "negative"}
          />
          <Pillar
            title="CAGR"
            value={m.cagr === null ? "—" : `${fmt(m.cagr, 2)}%`}
            hint="Annualized growth"
            icon={TrendingUp}
            tone={(m.cagr ?? 0) >= 0 ? "positive" : "negative"}
          />
          <Pillar
            title="Total P&L"
            value={money(m.totalPnL)}
            icon={Award}
            tone={m.totalPnL >= 0 ? "positive" : "negative"}
          />
          <Pillar
            title="Gross Profit"
            value={money(m.grossProfit)}
            icon={TrendingUp}
            tone="positive"
          />
          <Pillar
            title="Gross Loss"
            value={money(-m.grossLoss)}
            icon={TrendingDown}
            tone="negative"
          />
          <Pillar
            title="Break-Even"
            value={`${m.breakEven}`}
            hint="Trades at $0"
            icon={BarChart3}
            tone="neutral"
          />
        </div>
      </section>

      {/* Coming Soon */}
      <Card className="p-5 bg-card/30 border-dashed border-primary/20">
        <div className="flex items-start gap-3">
          <Zap className="h-4 w-4 text-primary mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-display uppercase tracking-wider text-primary">
              Pillars Requiring More Data (coming next)
            </p>
            <p className="text-xs text-muted-foreground">
              MAE/MFE, Hurst Exponent, R-multiples, time-of-day edge, asset correlation,
              Probability of Ruin — these require intraday tick data or per-trade SL/TP fields
              we'll add in a future migration.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
