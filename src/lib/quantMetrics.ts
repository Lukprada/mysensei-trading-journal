import { Trade } from "@/types/trading";

export interface QuantMetrics {
  totalTrades: number;
  wins: number;
  losses: number;
  breakEven: number;
  winRate: number;
  lossRate: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  totalPnL: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  expectancy: number;
  payoffRatio: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  currentStreak: number; // positive = wins, negative = losses
  zScore: number;
  stdDev: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  maxDrawdownPct: number;
  ulcerIndex: number;
  recoveryFactor: number;
  kellyPercent: number;
  cagr: number | null;
}

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
const mean = (arr: number[]) => (arr.length ? sum(arr) / arr.length : 0);
const stddev = (arr: number[]) => {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(sum(arr.map((x) => (x - m) ** 2)) / (arr.length - 1));
};

export function computeMetrics(trades: Trade[], initialBalance = 10000): QuantMetrics {
  const sorted = [...trades].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const pnls = sorted.map((t) => t.pnl);
  const wins = pnls.filter((p) => p > 0);
  const losses = pnls.filter((p) => p < 0);
  const breakEven = pnls.filter((p) => p === 0).length;

  const totalTrades = sorted.length;
  const winRate = totalTrades ? wins.length / totalTrades : 0;
  const lossRate = totalTrades ? losses.length / totalTrades : 0;
  const grossProfit = sum(wins);
  const grossLoss = Math.abs(sum(losses));
  const totalPnL = sum(pnls);
  const avgWin = mean(wins);
  const avgLoss = Math.abs(mean(losses));
  const largestWin = wins.length ? Math.max(...wins) : 0;
  const largestLoss = losses.length ? Math.min(...losses) : 0;

  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  const payoffRatio = avgLoss > 0 ? avgWin / avgLoss : 0;
  const expectancy = winRate * avgWin - lossRate * avgLoss;

  // Streaks
  let maxW = 0, maxL = 0, curW = 0, curL = 0, currentStreak = 0;
  for (const p of pnls) {
    if (p > 0) {
      curW++; curL = 0;
      maxW = Math.max(maxW, curW);
    } else if (p < 0) {
      curL++; curW = 0;
      maxL = Math.max(maxL, curL);
    } else {
      curW = 0; curL = 0;
    }
  }
  currentStreak = curW > 0 ? curW : -curL;

  // Z-Score (runs test) — measures if streaks are random or systematic
  // Z = (N*(R - 0.5) - X) / sqrt((X*(X-N)) / (N-1))
  // R = total runs, N = total trades, X = 2*W*L
  let runs = 1;
  for (let i = 1; i < pnls.length; i++) {
    const prev = pnls[i - 1] >= 0;
    const cur = pnls[i] >= 0;
    if (prev !== cur) runs++;
  }
  const W = wins.length, L = losses.length, N = totalTrades;
  const X = 2 * W * L;
  const zScore =
    N > 1 && X > 0 && X !== N
      ? (N * (runs - 0.5) - X) / Math.sqrt((X * (X - N)) / (N - 1))
      : 0;

  // Std Dev / Sharpe / Sortino (per-trade, not annualized — kept simple)
  const std = stddev(pnls);
  const downside = pnls.filter((p) => p < 0);
  const downsideStd = stddev(downside);
  const avgReturn = mean(pnls);
  const sharpeRatio = std > 0 ? avgReturn / std : 0;
  const sortinoRatio = downsideStd > 0 ? avgReturn / downsideStd : 0;

  // Drawdown — equity curve based on initial balance
  let equity = initialBalance;
  let peak = initialBalance;
  let maxDD = 0;
  let maxDDPct = 0;
  const drawdownsPct: number[] = [];
  for (const p of pnls) {
    equity += p;
    if (equity > peak) peak = equity;
    const dd = peak - equity;
    const ddPct = peak > 0 ? (dd / peak) * 100 : 0;
    drawdownsPct.push(ddPct);
    if (dd > maxDD) maxDD = dd;
    if (ddPct > maxDDPct) maxDDPct = ddPct;
  }

  // Ulcer Index — RMS of drawdown percentages
  const ulcerIndex = drawdownsPct.length
    ? Math.sqrt(sum(drawdownsPct.map((d) => d * d)) / drawdownsPct.length)
    : 0;

  const recoveryFactor = maxDD > 0 ? totalPnL / maxDD : 0;

  // Kelly % = W - ((1 - W) / R)  where R = payoff ratio
  const kellyPercent = payoffRatio > 0 ? (winRate - (1 - winRate) / payoffRatio) * 100 : 0;

  // CAGR (rough) — based on first/last trade dates
  let cagr: number | null = null;
  if (sorted.length >= 2 && initialBalance > 0) {
    const first = new Date(sorted[0].date).getTime();
    const last = new Date(sorted[sorted.length - 1].date).getTime();
    const years = (last - first) / (365.25 * 24 * 60 * 60 * 1000);
    const finalEquity = initialBalance + totalPnL;
    if (years > 0 && finalEquity > 0) {
      cagr = (Math.pow(finalEquity / initialBalance, 1 / years) - 1) * 100;
    }
  }

  return {
    totalTrades,
    wins: wins.length,
    losses: losses.length,
    breakEven,
    winRate: winRate * 100,
    lossRate: lossRate * 100,
    avgWin,
    avgLoss,
    largestWin,
    largestLoss,
    totalPnL,
    grossProfit,
    grossLoss,
    profitFactor,
    expectancy,
    payoffRatio,
    maxConsecutiveWins: maxW,
    maxConsecutiveLosses: maxL,
    currentStreak,
    zScore,
    stdDev: std,
    sharpeRatio,
    sortinoRatio,
    maxDrawdown: maxDD,
    maxDrawdownPct: maxDDPct,
    ulcerIndex,
    recoveryFactor,
    kellyPercent,
    cagr,
  };
}

export function interpretZScore(z: number): string {
  const abs = Math.abs(z);
  if (abs < 1.65) return "Random — no streak bias";
  if (z > 0) return "Positive dependency — wins/losses cluster";
  return "Negative dependency — outcomes alternate";
}

export function interpretKelly(k: number): string {
  if (k <= 0) return "No edge — do not size up";
  if (k < 5) return "Tiny edge — risk ≤ 0.5% per trade";
  if (k < 15) return "Modest edge — risk 1% per trade";
  if (k < 25) return "Strong edge — half-Kelly recommended";
  return "Very strong (verify sample size)";
}
