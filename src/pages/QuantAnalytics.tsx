import { useMemo, useState, createContext, useContext } from "react";

const ExplainerContext = createContext<(title: string) => void>(() => {});
import { useTrading } from "@/contexts/TradingContext";
import { computeMetrics, interpretZScore, interpretKelly } from "@/lib/quantMetrics";
import { METRIC_EXPLAINERS } from "@/lib/metricExplainers";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  TrendingUp, TrendingDown, Target, Activity, Zap, Shield,
  BarChart3, Flame, Snowflake, Award, AlertTriangle, Gauge,
  Brain, Clock, AlertCircle, CheckCircle2, Info, BookOpen, Lightbulb, Sparkles, LineChart,
} from "lucide-react";
import { MetricTrendChart } from "@/components/quant/MetricTrendChart";
import { METRIC_TIME_MAP } from "@/lib/metricTimeSeries";

interface PillarProps {
  title: string;
  value: string;
  hint?: string;
  icon: React.ElementType;
  tone?: "positive" | "negative" | "neutral" | "warning";
  formula?: string;
}

function Pillar({ title, value, hint, icon: Icon, tone = "neutral", formula }: PillarProps) {
  const openExplainer = useContext(ExplainerContext);
  const hasExplainer = !!METRIC_EXPLAINERS[title];
  const toneClass =
    tone === "positive" ? "text-profit border-profit/30"
    : tone === "negative" ? "text-loss border-loss/30"
    : tone === "warning" ? "text-yellow-400 border-yellow-400/30"
    : "text-primary border-primary/20";

  return (
    <button
      type="button"
      onClick={() => hasExplainer && openExplainer(title)}
      disabled={!hasExplainer}
      className="text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg disabled:cursor-default"
    >
      <Card className={`p-5 bg-card/50 backdrop-blur border ${toneClass} transition-all hover:scale-[1.02] group-hover:shadow-[0_0_30px_-10px_hsl(var(--primary)/0.4)] cursor-pointer relative`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-display">
              {title}
            </span>
          </div>
          <Info className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
        </div>
        <div className="text-2xl font-bold font-mono-numbers mb-1">{value}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
        {formula && (
          <div className="text-[10px] text-muted-foreground/60 mt-2 font-mono">{formula}</div>
        )}
      </Card>
    </button>
  );
}

function PhaseCurveViz({ past, current, future }: { past: string; current: string; future: string }) {
  return (
    <div className="relative rounded-lg border border-primary/20 bg-background/40 p-5 overflow-hidden">
      {/* glowing baseline */}
      <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-loss/40 via-primary to-profit/60 shadow-[0_0_12px_hsl(var(--primary)/0.6)]" />
      <div className="relative grid grid-cols-3 gap-3 items-center">
        <div className="text-left">
          <div className="text-[9px] uppercase tracking-[0.2em] text-loss/80 mb-1 font-display">Past</div>
          <div className="text-xs text-muted-foreground leading-snug">{past}</div>
        </div>
        <div className="text-center relative">
          <div className="inline-flex items-center justify-center mx-auto mb-2">
            <span className="block h-3 w-3 rounded-full bg-primary shadow-[0_0_16px_hsl(var(--primary))] animate-pulse" />
          </div>
          <div className="text-[9px] uppercase tracking-[0.2em] text-primary mb-1 font-display">Current</div>
          <div className="text-xs text-foreground/90 leading-snug font-semibold">{current}</div>
        </div>
        <div className="text-right">
          <div className="text-[9px] uppercase tracking-[0.2em] text-profit/80 mb-1 font-display">Future</div>
          <div className="text-xs text-muted-foreground leading-snug">{future}</div>
        </div>
      </div>
    </div>
  );
}

function ExplainerDialog({
  metricKey, open, onOpenChange,
}: { metricKey: string | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const data = metricKey ? METRIC_EXPLAINERS[metricKey] : null;
  const n = data?.narrative;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto bg-card/95 backdrop-blur border-primary/30">
        {data ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">
                  SENSEI ARCHIVE
                </Badge>
                <Badge variant="outline" className="border-primary/20 text-muted-foreground text-[10px]">
                  QUANT PILLAR
                </Badge>
              </div>
              <DialogTitle className="text-2xl md:text-3xl font-display tracking-[0.05em] text-gradient">
                {data.title}
              </DialogTitle>
              <DialogDescription className="font-mono text-sm text-primary/80 pt-2">
                {n?.quantCode ?? data.formula}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-2">
              {/* Origin Story */}
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h3 className="text-xs uppercase tracking-[0.25em] font-display text-muted-foreground">
                    The Origin Story
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {n?.originStory ?? data.history}
                </p>
              </section>

              {/* Quant Code */}
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="text-xs uppercase tracking-[0.25em] font-display text-muted-foreground">
                    The Quant Code
                  </h3>
                </div>
                <div className="rounded-md border border-primary/20 bg-background/50 p-3 font-mono text-sm text-primary/90">
                  {n?.quantCode ?? data.formula}
                </div>
              </section>

              {/* Psychological Phase Curve */}
              {n?.phase && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="h-4 w-4 text-primary" />
                    <h3 className="text-xs uppercase tracking-[0.25em] font-display text-muted-foreground">
                      The Psychological Phase
                    </h3>
                  </div>
                  <PhaseCurveViz past={n.phase.past} current={n.phase.current} future={n.phase.future} />
                  <p className="text-xs italic text-muted-foreground mt-3 leading-relaxed">
                    {n.phase.caption}
                  </p>
                </section>
              )}

              {/* Personal Command */}
              {n?.command && (
                <section className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <h3 className="text-xs uppercase tracking-[0.25em] font-display text-primary">
                      Your Personal Command
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">{n.command}</p>
                </section>
              )}

              {/* Fallback "Why it matters" if no narrative */}
              {!n && (
                <section>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="text-xs uppercase tracking-[0.25em] font-display text-muted-foreground">
                      Why It Matters
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/90">{data.importance}</p>
                </section>
              )}

              {/* How to improve — always */}
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-yellow-400" />
                  <h3 className="text-xs uppercase tracking-[0.25em] font-display text-muted-foreground">
                    How to Improve It
                  </h3>
                </div>
                <ul className="space-y-2">
                  {data.improve.map((tip, i) => (
                    <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground/90">
                      <span className="text-primary mt-1">▸</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {data.benchmark && (
                <section className="border-t border-primary/10 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-profit" />
                    <h3 className="text-xs uppercase tracking-[0.25em] font-display text-muted-foreground">
                      Benchmark
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-profit/90 font-mono">{data.benchmark}</p>
                </section>
              )}
            </div>
          </>
        ) : (
          <DialogHeader>
            <DialogTitle>No explainer available</DialogTitle>
            <DialogDescription>This metric doesn't have a write-up yet.</DialogDescription>
          </DialogHeader>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function QuantAnalytics() {
  const { trades, activeAccount } = useTrading();
  const initBalance = activeAccount?.initialBalance || 10000;
  const [explainerKey, setExplainerKey] = useState<string | null>(null);

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
    <ExplainerContext.Provider value={setExplainerKey}>
    <div className="space-y-8 pb-12">
      <ExplainerDialog
        metricKey={explainerKey}
        open={!!explainerKey}
        onOpenChange={(o) => !o && setExplainerKey(null)}
      />
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

      {/* Module 4 — Plan Adherence (R-multiples, discipline, etc.) */}
      <section>
        <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 font-display">
          🧠 Module 4 — Plan Adherence & Behavior
        </h2>
        {m.tradesWithPlan === 0 && m.tradesWithRisk === 0 && m.disciplineScore === null ? (
          <Card className="p-5 bg-card/30 border-dashed border-primary/20">
            <p className="text-xs text-muted-foreground">
              Add Stop Loss, Take Profit, Risk $, and "rules followed" on new trades to unlock
              R-Expectancy, Avg Planned R:R, Hit-Rate vs Plan, Discipline Score, and Time-in-Trade.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Pillar
              title="R-Expectancy"
              value={m.rExpectancy === null ? "—" : `${fmt(m.rExpectancy, 2)}R`}
              hint={m.rExpectancy === null ? "Need Risk $" : `${m.tradesWithRisk} trades`}
              icon={Gauge}
              tone={(m.rExpectancy ?? 0) > 0 ? "positive" : "negative"}
              formula="avg(pnl / risk_amount)"
            />
            <Pillar
              title="Avg Planned R:R"
              value={m.avgPlannedRR === null ? "—" : `1 : ${fmt(m.avgPlannedRR, 2)}`}
              hint={m.avgPlannedRR === null ? "Need SL/TP" : `${m.tradesWithPlan} planned`}
              icon={Target}
              tone={(m.avgPlannedRR ?? 0) >= 2 ? "positive" : "warning"}
            />
            <Pillar
              title="Hit-Rate vs Plan"
              value={m.hitRateVsPlan === null ? "—" : `${fmt(m.hitRateVsPlan, 1)}%`}
              hint="Winners that hit ≥90% of TP"
              icon={CheckCircle2}
              tone={(m.hitRateVsPlan ?? 0) >= 60 ? "positive" : "warning"}
            />
            <Pillar
              title="Discipline Score"
              value={m.disciplineScore === null ? "—" : `${fmt(m.disciplineScore, 0)}%`}
              hint="Trades that followed rules"
              icon={Shield}
              tone={(m.disciplineScore ?? 0) >= 80 ? "positive" : (m.disciplineScore ?? 0) >= 50 ? "warning" : "negative"}
            />
            <Pillar
              title="Avg Time (Wins)"
              value={m.avgTimeInTradeWinMin === null ? "—" : `${fmt(m.avgTimeInTradeWinMin, 0)}m`}
              hint="Minutes in winning trades"
              icon={Clock}
              tone="positive"
            />
            <Pillar
              title="Avg Time (Losses)"
              value={m.avgTimeInTradeLossMin === null ? "—" : `${fmt(m.avgTimeInTradeLossMin, 0)}m`}
              hint="Cut losses faster?"
              icon={Clock}
              tone="negative"
            />
            <Pillar
              title="Revenge Trades"
              value={`${m.revengeTradeCount}`}
              hint="Big lot <60min after a loss"
              icon={AlertCircle}
              tone={m.revengeTradeCount === 0 ? "positive" : "negative"}
            />
            <Pillar
              title="Coverage"
              value={`${m.tradesWithPlan}/${m.totalTrades}`}
              hint="Trades with SL+TP logged"
              icon={Brain}
              tone="neutral"
            />
          </div>
        )}
      </section>

      {/* Still blocked */}
      <Card className="p-5 bg-card/30 border-dashed border-primary/20">
        <div className="flex items-start gap-3">
          <Zap className="h-4 w-4 text-primary mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-display uppercase tracking-wider text-primary">
              Still Locked (need paid price-data API)
            </p>
            <p className="text-xs text-muted-foreground">
              MAE/MFE (true intraday excursion), Hurst Exponent, ATR-normalized returns,
              Slippage, Spread Cost — these all require 1-minute historical price data per trade.
            </p>
          </div>
        </div>
      </Card>
    </div>
    </ExplainerContext.Provider>
  );
}
