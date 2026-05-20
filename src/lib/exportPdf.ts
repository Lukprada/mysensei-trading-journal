import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { QuantMetrics } from "@/lib/quantMetrics";
import { Account } from "@/types/trading";

export interface ExportOptions {
  mode: "private" | "shareable";
  username: string;
  includeAccount: boolean;        // shareable only
  includeDollarValues: boolean;   // shareable only
  includeExtremes: boolean;       // largest win/loss
  includeStreaks: boolean;
  includeBehavior: boolean;       // module 4
}

const COLORS = {
  bg: [10, 10, 15] as [number, number, number],
  panel: [22, 22, 38] as [number, number, number],
  border: [50, 50, 80] as [number, number, number],
  cyan: [0, 240, 255] as [number, number, number],
  magenta: [255, 43, 214] as [number, number, number],
  textMain: [240, 245, 255] as [number, number, number],
  textDim: [150, 155, 175] as [number, number, number],
  profit: [34, 197, 94] as [number, number, number],
  loss: [239, 68, 68] as [number, number, number],
};

const fmt = (n: number, d = 2) =>
  Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: d }) : "∞";

function money(n: number) {
  return `${n >= 0 ? "+" : "-"}$${fmt(Math.abs(n))}`;
}

function paintBg(doc: jsPDF) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setFillColor(...COLORS.bg);
  doc.rect(0, 0, w, h, "F");
  // subtle grid lines
  doc.setDrawColor(30, 30, 50);
  doc.setLineWidth(0.1);
  for (let y = 0; y < h; y += 8) doc.line(0, y, w, y);
  for (let x = 0; x < w; x += 8) doc.line(x, 0, x, h);
}

function header(doc: jsPDF, opts: ExportOptions) {
  const w = doc.internal.pageSize.getWidth();
  // neon top bar
  doc.setFillColor(...COLORS.cyan);
  doc.rect(0, 0, w, 1.5, "F");
  doc.setFillColor(...COLORS.magenta);
  doc.rect(0, 1.5, w, 0.5, "F");

  doc.setTextColor(...COLORS.cyan);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("QUANT LIBRARY · SENSEI ARCHIVE", 14, 10);

  doc.setTextColor(...COLORS.textDim);
  doc.setFontSize(7);
  const modeLabel = opts.mode === "private" ? "PRIVATE VAULT REPORT" : "SHAREABLE EDGE REPORT";
  doc.text(modeLabel, w - 14, 10, { align: "right" });
}

function footer(doc: jsPDF, pageNum: number, total: number) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.2);
  doc.line(14, h - 12, w - 14, h - 12);
  doc.setTextColor(...COLORS.textDim);
  doc.setFontSize(7);
  doc.text("mysensei · quant report", 14, h - 7);
  doc.text(`${pageNum} / ${total}`, w - 14, h - 7, { align: "right" });
}

function statCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  tone: "good" | "bad" | "neutral" | "warn" = "neutral",
  hint?: string,
) {
  doc.setFillColor(...COLORS.panel);
  doc.roundedRect(x, y, w, h, 1.5, 1.5, "F");
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, w, h, 1.5, 1.5, "S");

  // accent strip
  const accent =
    tone === "good" ? COLORS.profit :
    tone === "bad" ? COLORS.loss :
    tone === "warn" ? [234, 179, 8] as [number, number, number] :
    COLORS.cyan;
  doc.setFillColor(...accent);
  doc.rect(x, y, 0.8, h, "F");

  doc.setTextColor(...COLORS.textDim);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text(label.toUpperCase(), x + 3, y + 4.5);

  doc.setTextColor(...COLORS.textMain);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(value, x + 3, y + 11);

  if (hint) {
    doc.setTextColor(...COLORS.textDim);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text(hint, x + 3, y + h - 2.5);
  }
}

function sectionTitle(doc: jsPDF, y: number, title: string, subtitle?: string) {
  doc.setTextColor(...COLORS.cyan);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(title.toUpperCase(), 14, y);
  if (subtitle) {
    doc.setTextColor(...COLORS.textDim);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(subtitle, 14, y + 4);
  }
  doc.setDrawColor(...COLORS.cyan);
  doc.setLineWidth(0.3);
  doc.line(14, y + 6, 60, y + 6);
}

interface CardSpec {
  label: string;
  value: string;
  tone?: "good" | "bad" | "neutral" | "warn";
  hint?: string;
}

function drawGrid(doc: jsPDF, startY: number, cards: CardSpec[]): number {
  const w = doc.internal.pageSize.getWidth();
  const cols = 3;
  const margin = 14;
  const gap = 4;
  const cardW = (w - margin * 2 - gap * (cols - 1)) / cols;
  const cardH = 20;
  let y = startY;
  cards.forEach((c, i) => {
    const col = i % cols;
    if (col === 0 && i > 0) y += cardH + gap;
    const x = margin + col * (cardW + gap);
    statCard(doc, x, y, cardW, cardH, c.label, c.value, c.tone || "neutral", c.hint);
  });
  return y + cardH;
}

export function generateQuantPdf(
  metrics: QuantMetrics,
  account: Account | null,
  opts: ExportOptions,
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // ====== PAGE 1 — COVER ======
  paintBg(doc);
  header(doc, opts);

  // huge title
  doc.setTextColor(...COLORS.textMain);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(38);
  doc.text("EDGE REPORT", 14, 55);

  doc.setTextColor(...COLORS.magenta);
  doc.setFontSize(16);
  doc.text(opts.mode === "private" ? "// PRIVATE VAULT" : "// SHAREABLE", 14, 65);

  // user block
  doc.setFillColor(...COLORS.panel);
  doc.roundedRect(14, 80, 182, 38, 2, 2, "F");
  doc.setDrawColor(...COLORS.cyan);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, 80, 182, 38, 2, 2, "S");

  doc.setTextColor(...COLORS.textDim);
  doc.setFontSize(7);
  doc.text("TRADER", 20, 88);
  doc.setTextColor(...COLORS.cyan);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(opts.username || "anonymous", 20, 98);

  doc.setTextColor(...COLORS.textDim);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("GENERATED", 20, 106);
  doc.setTextColor(...COLORS.textMain);
  doc.setFontSize(9);
  doc.text(new Date().toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" }), 20, 112);

  doc.setTextColor(...COLORS.textDim);
  doc.setFontSize(7);
  doc.text("SAMPLE SIZE", 120, 106);
  doc.setTextColor(...COLORS.textMain);
  doc.setFontSize(9);
  doc.text(`${metrics.totalTrades} trades`, 120, 112);

  if (account && opts.includeAccount) {
    doc.setTextColor(...COLORS.textDim);
    doc.setFontSize(7);
    doc.text("ACCOUNT", 120, 88);
    doc.setTextColor(...COLORS.textMain);
    doc.setFontSize(10);
    doc.text(`${account.name} · ${account.type.toUpperCase()}`, 120, 95);
  }

  // headline stats row
  const headline: CardSpec[] = [
    {
      label: "Win Rate",
      value: `${fmt(metrics.winRate, 1)}%`,
      tone: metrics.winRate >= 50 ? "good" : "bad",
      hint: `${metrics.wins}W / ${metrics.losses}L`,
    },
    {
      label: "Profit Factor",
      value: fmt(metrics.profitFactor),
      tone: metrics.profitFactor >= 1.5 ? "good" : metrics.profitFactor >= 1 ? "warn" : "bad",
      hint: "GrossW / GrossL",
    },
    {
      label: opts.includeDollarValues ? "Expectancy" : "R-Expectancy",
      value: opts.includeDollarValues
        ? money(metrics.expectancy)
        : metrics.rExpectancy === null ? "—" : `${fmt(metrics.rExpectancy, 2)}R`,
      tone: metrics.expectancy >= 0 ? "good" : "bad",
      hint: "Avg per trade",
    },
  ];
  drawGrid(doc, 130, headline);

  // verdict box
  const verdict = buildVerdict(metrics);
  doc.setFillColor(...COLORS.panel);
  doc.roundedRect(14, 175, 182, 50, 2, 2, "F");
  doc.setDrawColor(...COLORS.magenta);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, 175, 182, 50, 2, 2, "S");
  doc.setTextColor(...COLORS.magenta);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("SENSEI VERDICT", 20, 184);
  doc.setTextColor(...COLORS.textMain);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const split = doc.splitTextToSize(verdict, 170);
  doc.text(split, 20, 192);

  // ====== PAGE 2 — Probability & Skill ======
  doc.addPage();
  paintBg(doc);
  header(doc, opts);

  sectionTitle(doc, 26, "Module 1 — Probability & Skill", "How often you win, and how well you size it.");
  const m1: CardSpec[] = [
    { label: "Win Rate", value: `${fmt(metrics.winRate, 1)}%`, tone: metrics.winRate >= 50 ? "good" : "bad", hint: `${metrics.wins}W / ${metrics.losses}L` },
    { label: "Profit Factor", value: fmt(metrics.profitFactor), tone: metrics.profitFactor >= 1.5 ? "good" : "warn" },
    { label: "Payoff Ratio", value: `${fmt(metrics.payoffRatio)} : 1`, tone: metrics.payoffRatio >= 1 ? "good" : "warn" },
    { label: "Z-Score", value: fmt(metrics.zScore) },
    { label: "Kelly %", value: `${fmt(metrics.kellyPercent, 1)}%`, tone: metrics.kellyPercent > 0 ? "good" : "bad" },
    {
      label: opts.includeDollarValues ? "Expectancy" : "R-Expectancy",
      value: opts.includeDollarValues
        ? money(metrics.expectancy)
        : metrics.rExpectancy === null ? "—" : `${fmt(metrics.rExpectancy, 2)}R`,
      tone: metrics.expectancy >= 0 ? "good" : "bad",
    },
  ];
  if (opts.includeDollarValues) {
    m1.push({ label: "Avg Win", value: money(metrics.avgWin), tone: "good" });
    m1.push({ label: "Avg Loss", value: money(-metrics.avgLoss), tone: "bad" });
  }
  let y = drawGrid(doc, 32, m1);

  // Risk
  y += 8;
  sectionTitle(doc, y, "Module 2 — Risk & Drawdown", "What survives a losing streak.");
  const m2: CardSpec[] = [
    {
      label: "Max Drawdown",
      value: opts.includeDollarValues ? money(-metrics.maxDrawdown) : `${fmt(metrics.maxDrawdownPct, 2)}%`,
      tone: "bad",
      hint: `${fmt(metrics.maxDrawdownPct, 2)}% peak-to-valley`,
    },
    { label: "Ulcer Index", value: fmt(metrics.ulcerIndex, 2), tone: metrics.ulcerIndex < 5 ? "good" : "warn" },
    { label: "Sharpe (per trade)", value: fmt(metrics.sharpeRatio), tone: metrics.sharpeRatio >= 0.3 ? "good" : "warn" },
    { label: "Sortino (per trade)", value: fmt(metrics.sortinoRatio), tone: metrics.sortinoRatio >= 0.5 ? "good" : "warn" },
    { label: "Recovery Factor", value: fmt(metrics.recoveryFactor), tone: metrics.recoveryFactor >= 2 ? "good" : "warn" },
  ];
  if (opts.includeDollarValues) {
    m2.push({ label: "Std Dev", value: `$${fmt(metrics.stdDev)}` });
  }
  if (opts.includeExtremes && opts.includeDollarValues) {
    m2.push({ label: "Largest Win", value: money(metrics.largestWin), tone: "good" });
    m2.push({ label: "Largest Loss", value: money(metrics.largestLoss), tone: "bad" });
  }
  y = drawGrid(doc, y + 10, m2);

  // ====== PAGE 3 — Streaks & Behavior ======
  doc.addPage();
  paintBg(doc);
  header(doc, opts);

  if (opts.includeStreaks) {
    sectionTitle(doc, 26, "Module 3 — Streaks & Consistency", "Cluster behavior and growth over time.");
    const m3: CardSpec[] = [
      { label: "Max Win Streak", value: `${metrics.maxConsecutiveWins}`, tone: "good" },
      { label: "Max Loss Streak", value: `${metrics.maxConsecutiveLosses}`, tone: "bad" },
      { label: "Current Streak", value: metrics.currentStreak === 0 ? "—" : `${Math.abs(metrics.currentStreak)} ${metrics.currentStreak > 0 ? "W" : "L"}` },
      { label: "CAGR", value: metrics.cagr === null ? "—" : `${fmt(metrics.cagr, 2)}%`, tone: (metrics.cagr ?? 0) >= 0 ? "good" : "bad" },
    ];
    if (opts.includeDollarValues) {
      m3.push({ label: "Total P&L", value: money(metrics.totalPnL), tone: metrics.totalPnL >= 0 ? "good" : "bad" });
      m3.push({ label: "Gross Profit", value: money(metrics.grossProfit), tone: "good" });
      m3.push({ label: "Gross Loss", value: money(-metrics.grossLoss), tone: "bad" });
    }
    m3.push({ label: "Break-Even", value: `${metrics.breakEven}` });
    y = drawGrid(doc, 32, m3);
    y += 8;
  } else {
    y = 26;
  }

  if (opts.includeBehavior) {
    sectionTitle(doc, y, "Module 4 — Plan Adherence", "The discipline layer behind the math.");
    const m4: CardSpec[] = [
      { label: "R-Expectancy", value: metrics.rExpectancy === null ? "—" : `${fmt(metrics.rExpectancy, 2)}R`, tone: (metrics.rExpectancy ?? 0) > 0 ? "good" : "bad" },
      { label: "Avg Planned R:R", value: metrics.avgPlannedRR === null ? "—" : `1 : ${fmt(metrics.avgPlannedRR, 2)}`, tone: (metrics.avgPlannedRR ?? 0) >= 2 ? "good" : "warn" },
      { label: "Hit-Rate vs Plan", value: metrics.hitRateVsPlan === null ? "—" : `${fmt(metrics.hitRateVsPlan, 1)}%`, tone: (metrics.hitRateVsPlan ?? 0) >= 60 ? "good" : "warn" },
      { label: "Discipline Score", value: metrics.disciplineScore === null ? "—" : `${fmt(metrics.disciplineScore, 0)}%`, tone: (metrics.disciplineScore ?? 0) >= 80 ? "good" : "warn" },
      { label: "Avg Time (Wins)", value: metrics.avgTimeInTradeWinMin === null ? "—" : `${fmt(metrics.avgTimeInTradeWinMin, 0)}m` },
      { label: "Avg Time (Losses)", value: metrics.avgTimeInTradeLossMin === null ? "—" : `${fmt(metrics.avgTimeInTradeLossMin, 0)}m` },
      { label: "Revenge Trades", value: `${metrics.revengeTradeCount}`, tone: metrics.revengeTradeCount === 0 ? "good" : "bad" },
      { label: "Coverage", value: `${metrics.tradesWithPlan}/${metrics.totalTrades}` },
    ];
    drawGrid(doc, y + 10, m4);
  }

  // ====== Privacy footer note on every page ======
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    footer(doc, p, total);
  }

  // ====== Filtered fields banner on shareable ======
  if (opts.mode === "shareable") {
    doc.setPage(1);
    const w = doc.internal.pageSize.getWidth();
    doc.setFillColor(...COLORS.panel);
    doc.roundedRect(14, 235, w - 28, 24, 1.5, 1.5, "F");
    doc.setDrawColor(...COLORS.magenta);
    doc.roundedRect(14, 235, w - 28, 24, 1.5, 1.5, "S");
    doc.setTextColor(...COLORS.magenta);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("PRIVACY FILTER APPLIED", 20, 242);
    doc.setTextColor(...COLORS.textDim);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    const hidden = [
      !opts.includeAccount && "account name & type (live/demo/funded)",
      !opts.includeDollarValues && "all $ values (showing ratios/R/%)",
      !opts.includeExtremes && "largest single win/loss",
      !opts.includeBehavior && "behavior & discipline metrics",
    ].filter(Boolean).join(" · ");
    const split = doc.splitTextToSize(hidden || "no filters", w - 40);
    doc.text(split, 20, 248);
  }

  return doc;
}

function buildVerdict(m: QuantMetrics): string {
  const parts: string[] = [];
  if (m.profitFactor >= 1.5) parts.push("Profit factor signals a real edge.");
  else if (m.profitFactor >= 1) parts.push("Marginal edge — slim survival room.");
  else parts.push("Below break-even — the system is currently bleeding.");

  if (m.maxDrawdownPct > 30) parts.push(`Drawdown of ${m.maxDrawdownPct.toFixed(1)}% is institutional-grade danger.`);
  else if (m.maxDrawdownPct > 15) parts.push(`Drawdown ${m.maxDrawdownPct.toFixed(1)}% — risk discipline matters.`);
  else parts.push(`Drawdown contained at ${m.maxDrawdownPct.toFixed(1)}%.`);

  if (m.revengeTradeCount > 0) parts.push(`${m.revengeTradeCount} revenge trade(s) detected — emotional leakage present.`);
  if ((m.disciplineScore ?? 100) < 80 && m.disciplineScore !== null) {
    parts.push(`Discipline at ${m.disciplineScore.toFixed(0)}% — rules ignored too often.`);
  }
  return parts.join(" ");
}
