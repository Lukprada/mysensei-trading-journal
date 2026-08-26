import type { Trade } from "@/types/trading";

/**
 * A bundle is one *position* in the trader's mind: either a single trade,
 * or several layered fills sharing a linked_group_id.
 */
export interface TradeBundle {
  /** group id when linked, otherwise the trade id */
  key: string;
  /** representative trade (earliest fill) — drives the summary row */
  primary: Trade;
  /** every fill in the position, oldest first */
  fills: Trade[];
  linked: boolean;
  totalLots: number;
  totalPnl: number;
  totalPips: number;
  avgEntry: number;
  avgExit: number;
  firstDate: string;
  lastDate: string;
}

export function buildTradeBundles(trades: Trade[]): TradeBundle[] {
  const groups = new Map<string, Trade[]>();
  for (const t of trades) {
    const key = t.linkedGroupId || t.id;
    const list = groups.get(key);
    if (list) list.push(t);
    else groups.set(key, [t]);
  }

  const bundles: TradeBundle[] = [];
  for (const [key, raw] of groups) {
    const fills = [...raw].sort((a, b) =>
      a.date.localeCompare(b.date) || (a.createdAt || "").localeCompare(b.createdAt || "")
    );
    const totalLots = fills.reduce((s, t) => s + (t.positionSize || 0), 0);
    const weight = totalLots || fills.length;
    const w = (pick: (t: Trade) => number) =>
      fills.reduce((s, t) => s + pick(t) * (totalLots ? t.positionSize || 0 : 1), 0) / weight;

    bundles.push({
      key,
      primary: fills[0],
      fills,
      linked: fills.length > 1,
      totalLots,
      totalPnl: fills.reduce((s, t) => s + t.pnl, 0),
      totalPips: fills.reduce((s, t) => s + t.pips, 0),
      avgEntry: w((t) => t.entryPrice),
      avgExit: w((t) => t.exitPrice),
      firstDate: fills[0].date,
      lastDate: fills[fills.length - 1].date,
    });
  }

  return bundles.sort((a, b) => b.lastDate.localeCompare(a.lastDate));
}

export function bundleFromTrade(trade: Trade, allTrades: Trade[]): TradeBundle {
  const scope = trade.linkedGroupId
    ? allTrades.filter((t) => t.linkedGroupId === trade.linkedGroupId)
    : [trade];
  return buildTradeBundles(scope)[0];
}

/** Flattened, AI-ready payload for the Sensei edge function. */
export function bundleToTradeDetails(bundle: TradeBundle) {
  const p = bundle.primary;
  return {
    asset: p.asset,
    direction: p.direction,
    entry_price: Number(bundle.avgEntry.toFixed(5)),
    exit_price: Number(bundle.avgExit.toFixed(5)),
    pips: Number(bundle.totalPips.toFixed(1)),
    pnl: Number(bundle.totalPnl.toFixed(2)),
    position_size: Number(bundle.totalLots.toFixed(2)),
  };
}

/** Human-readable dossier of the whole position, used as the AI's notes block. */
export function bundleToNarrative(bundle: TradeBundle, journalNotes: string): string {
  const lines: string[] = [];

  if (bundle.linked) {
    lines.push(
      `This is ONE position built from ${bundle.fills.length} layered fills between ${bundle.firstDate} and ${bundle.lastDate}. Individual fills:`
    );
    bundle.fills.forEach((t, i) => {
      lines.push(
        `  ${i + 1}. ${t.date}${t.exitTime ? ` ${new Date(t.exitTime).toISOString().slice(11, 16)}` : ""} · ${t.direction} ${t.positionSize} lots · ${t.entryPrice} → ${t.exitPrice} · ${t.pips > 0 ? "+" : ""}${t.pips} pips · ${t.pnl >= 0 ? "+" : ""}$${t.pnl.toFixed(2)}${t.setupTag ? ` · setup ${t.setupTag}` : ""}${t.stopLoss ? ` · SL ${t.stopLoss}` : ""}${t.takeProfit ? ` · TP ${t.takeProfit}` : ""}`
      );
    });
  } else {
    const t = bundle.primary;
    lines.push(
      `Single execution on ${t.date}${t.setupTag ? ` · setup ${t.setupTag}` : ""}${t.stopLoss ? ` · SL ${t.stopLoss}` : ""}${t.takeProfit ? ` · TP ${t.takeProfit}` : ""}.`
    );
  }

  const costs = bundle.fills.reduce(
    (s, t) => s + (t.commission || 0) + (t.swap || 0),
    0
  );
  if (costs) lines.push(`Broker costs across the position: $${costs.toFixed(2)}.`);

  const risk = bundle.fills.reduce((s, t) => s + (t.riskAmount || 0), 0);
  if (risk) lines.push(`Planned risk: $${risk.toFixed(2)} (R multiple ${(bundle.totalPnl / risk).toFixed(2)}R).`);

  const rules = bundle.fills.filter((t) => t.rulesFollowed !== undefined);
  if (rules.length) {
    const broke = rules.filter((t) => t.rulesFollowed === false).length;
    lines.push(broke ? `Rules were broken on ${broke} of ${rules.length} fills.` : "Rules followed on every fill.");
  }

  const charts = bundle.fills.flatMap((t) => t.tradingviewLinks || []);
  if (charts.length) lines.push(`Attached charts: ${charts.join(", ")}`);

  lines.push("");
  lines.push("Trader's journal:");
  lines.push(journalNotes?.trim() || "(nothing written yet)");

  return lines.join("\n");
}
