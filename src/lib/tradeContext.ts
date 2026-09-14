import type { Trade, CashFlow } from "@/types/trading";
import type { TradeBundle } from "@/lib/tradeBundle";

/**
 * Behavioural dossier for a position.
 *
 * Everything here is computed from hard data (prior results, streaks, size
 * deviation, withdrawals, time-to-re-entry) so the AI never has to *guess*
 * the trader's state — it reasons on numbers plus what the trader wrote.
 */
export interface TradeDossier {
  /** consecutive wins (+n) or losses (-n) immediately before this position */
  streak: number;
  last5: { wins: number; losses: number; netPnl: number };
  last7DaysPnl: number;
  /** drawdown from the account's peak running equity at the time of this trade */
  drawdownFromPeak: number;
  /** withdrawals in the 30 days before this position */
  recentWithdrawals: number;
  /** deposits in the 30 days before this position */
  recentDeposits: number;
  /** this position's lots ÷ median lots of the previous 20 trades */
  sizeRatio: number | null;
  /** minutes between the previous trade's close and this one's first fill (null if unknown) */
  minutesSinceLastTrade: number | null;
  previousTradeWasLoss: boolean;
  dayOfWeek: string;
  /** 0-100 — higher = calmer, more process-driven conditions */
  compositeScore: number;
  /** short flags that describe the psychological setting */
  flags: string[];
}

function toTime(t: Trade): number {
  const stamp = t.exitTime || t.createdAt || `${t.date}T00:00:00Z`;
  const ms = Date.parse(stamp);
  return Number.isNaN(ms) ? Date.parse(`${t.date}T00:00:00Z`) : ms;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function buildTradeDossier(
  bundle: TradeBundle,
  allTrades: Trade[],
  cashFlows: CashFlow[],
): TradeDossier {
  const accountId = bundle.primary.accountId;
  const anchor = Math.min(...bundle.fills.map(toTime));
  const ownIds = new Set(bundle.fills.map((f) => f.id));

  const prior = allTrades
    .filter((t) => t.accountId === accountId && !ownIds.has(t.id) && toTime(t) < anchor)
    .sort((a, b) => toTime(a) - toTime(b));

  // streak
  let streak = 0;
  for (let i = prior.length - 1; i >= 0; i--) {
    const win = prior[i].pnl > 0;
    if (i === prior.length - 1) streak = win ? 1 : -1;
    else if (win === streak > 0) streak += win ? 1 : -1;
    else break;
  }
  if (!prior.length) streak = 0;

  const last5raw = prior.slice(-5);
  const last5 = {
    wins: last5raw.filter((t) => t.pnl > 0).length,
    losses: last5raw.filter((t) => t.pnl < 0).length,
    netPnl: Number(last5raw.reduce((s, t) => s + t.pnl, 0).toFixed(2)),
  };

  const week = 7 * 24 * 60 * 60 * 1000;
  const last7DaysPnl = Number(
    prior.filter((t) => anchor - toTime(t) <= week).reduce((s, t) => s + t.pnl, 0).toFixed(2),
  );

  // running equity curve (trades only) → drawdown from peak
  let running = 0;
  let peak = 0;
  for (const t of prior) {
    running += t.pnl;
    if (running > peak) peak = running;
  }
  const drawdownFromPeak = Number(Math.max(0, peak - running).toFixed(2));

  const month = 30 * 24 * 60 * 60 * 1000;
  const flowsInWindow = cashFlows.filter((f) => {
    if (f.accountId !== accountId) return false;
    const ms = Date.parse(f.occurredAt);
    return !Number.isNaN(ms) && ms < anchor && anchor - ms <= month;
  });
  const recentWithdrawals = Number(
    flowsInWindow.filter((f) => f.flowType === "withdrawal").reduce((s, f) => s + f.amount, 0).toFixed(2),
  );
  const recentDeposits = Number(
    flowsInWindow.filter((f) => f.flowType === "deposit").reduce((s, f) => s + f.amount, 0).toFixed(2),
  );

  const med = median(prior.slice(-20).map((t) => t.positionSize || 0).filter((v) => v > 0));
  const sizeRatio = med && bundle.totalLots ? Number((bundle.totalLots / med).toFixed(2)) : null;

  const last = prior[prior.length - 1];
  const minutesSinceLastTrade = last ? Math.round((anchor - toTime(last)) / 60000) : null;
  const previousTradeWasLoss = Boolean(last && last.pnl < 0);

  const dayOfWeek = new Date(`${bundle.primary.date}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  });

  // ---- composite score -------------------------------------------------
  const flags: string[] = [];
  let score = 75;

  if (streak <= -3) { score -= 20; flags.push(`${Math.abs(streak)} losses in a row before this`); }
  else if (streak <= -2) { score -= 10; flags.push("Coming off back-to-back losses"); }
  else if (streak >= 3) { score -= 8; flags.push(`${streak} wins in a row — overconfidence risk`); }
  else if (streak >= 1) { score += 5; }

  if (sizeRatio && sizeRatio >= 2) { score -= 18; flags.push(`Size ${sizeRatio}× your normal lot`); }
  else if (sizeRatio && sizeRatio >= 1.4) { score -= 8; flags.push(`Size ${sizeRatio}× your normal lot`); }
  else if (sizeRatio && sizeRatio <= 0.6) { score += 4; flags.push("Reduced size"); }

  if (previousTradeWasLoss && minutesSinceLastTrade !== null && minutesSinceLastTrade <= 30) {
    score -= 20;
    flags.push(`Re-entered ${minutesSinceLastTrade} min after a loss — revenge window`);
  }

  if (recentWithdrawals > 0 && drawdownFromPeak > 0) {
    score -= 8;
    flags.push(`$${recentWithdrawals.toFixed(0)} withdrawn recently while in drawdown`);
  }

  if (drawdownFromPeak > 0 && peak > 0 && drawdownFromPeak / peak >= 0.25) {
    score -= 10;
    flags.push(`In a ${((drawdownFromPeak / peak) * 100).toFixed(0)}% drawdown from peak`);
  }

  if (bundle.primary.rulesFollowed === false) { score -= 15; flags.push("You marked rules as broken"); }
  else if (bundle.primary.rulesFollowed === true) { score += 8; }

  if (!bundle.primary.stopLoss) { score -= 10; flags.push("No stop loss recorded"); }
  if (last7DaysPnl < 0) flags.push(`Week running ${last7DaysPnl.toFixed(2)} before this trade`);

  const compositeScore = Math.max(0, Math.min(100, Math.round(score)));
  if (!flags.length) flags.push("Clean conditions — no behavioural red flags detected");

  return {
    streak,
    last5,
    last7DaysPnl,
    drawdownFromPeak,
    recentWithdrawals,
    recentDeposits,
    sizeRatio,
    minutesSinceLastTrade,
    previousTradeWasLoss,
    dayOfWeek,
    compositeScore,
    flags,
  };
}

export function scoreLabel(score: number): { label: string; tone: string } {
  if (score >= 78) return { label: "Process-driven", tone: "text-profit" };
  if (score >= 60) return { label: "Mostly composed", tone: "text-foreground" };
  if (score >= 40) return { label: "Pressured", tone: "text-primary" };
  return { label: "Emotionally compromised", tone: "text-loss" };
}

/** Plain-text dossier the AI reads before judging the trader's state. */
export function dossierToPrompt(d: TradeDossier, newsLine: string): string {
  const lines = [
    "BEHAVIOURAL DOSSIER (computed from the account's own history — treat as fact):",
    `- Day: ${d.dayOfWeek}`,
    `- Streak before this position: ${d.streak === 0 ? "none" : d.streak > 0 ? `${d.streak} wins` : `${Math.abs(d.streak)} losses`}`,
    `- Last 5 trades: ${d.last5.wins}W / ${d.last5.losses}L, net $${d.last5.netPnl}`,
    `- Trailing 7-day P&L before this trade: $${d.last7DaysPnl}`,
    `- Drawdown from peak equity: $${d.drawdownFromPeak}`,
    `- Withdrawals in the prior 30 days: $${d.recentWithdrawals} · deposits: $${d.recentDeposits}`,
    d.sizeRatio ? `- Position size vs normal: ${d.sizeRatio}×` : "- Position size vs normal: unknown",
    d.minutesSinceLastTrade !== null
      ? `- Minutes since previous trade closed: ${d.minutesSinceLastTrade} (previous trade ${d.previousTradeWasLoss ? "was a LOSS" : "was a win"})`
      : "- No previous trade on this account",
    `- Rule-based composite state score: ${d.compositeScore}/100 (${scoreLabel(d.compositeScore).label})`,
    `- Flags: ${d.flags.join("; ")}`,
    "",
    newsLine || "MACRO NEWS ON THE DAY: none loaded.",
    "",
    "Using the numbers above plus the trader's own words and charts, decide their ACTUAL mental state instead of accepting their self-report. State clearly whether this was a strategy execution or a recovery/revenge trade, whether news justified it, and one concrete correction.",
  ];
  return lines.join("\n");
}
