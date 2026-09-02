import { useTrading } from "@/contexts/TradingContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Eye, Trash2, BookOpen, ChevronDown, Layers, CornerDownRight, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo, Fragment } from "react";
import { TradeJournalPanel } from "@/components/TradeJournalPanel";
import { buildTradeBundles } from "@/lib/tradeBundle";

const TradeLog = () => {
  const { trades, deleteTrade } = useTrading();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "wins" | "losses">("all");
  const [openJournalKey, setOpenJournalKey] = useState<string | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const bundles = useMemo(() => buildTradeBundles(trades), [trades]);
  const filtered = bundles.filter((b) => {
    if (filter === "wins") return b.totalPnl > 0;
    if (filter === "losses") return b.totalPnl < 0;
    return true;
  });

  const winCount = bundles.filter((b) => b.totalPnl > 0).length;
  const netPnl = bundles.reduce((s, b) => s + b.totalPnl, 0);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-[0_0_60px_-20px_hsl(var(--primary)/0.15)]">
        {/* Terminal header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b border-border bg-secondary/20">
          <div>
            <h2 className="font-display text-xs font-bold uppercase tracking-[0.3em] text-foreground flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-profit opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-profit shadow-[0_0_8px_hsl(var(--profit))]" />
              </span>
              Trade Terminal
            </h2>
            <p className="text-xs text-muted-foreground mt-2 font-mono-numbers">
              {bundles.length} positions · {trades.length} executions · {winCount} wins ·{" "}
              <span className={netPnl >= 0 ? "text-profit" : "text-loss"}>
                net {netPnl >= 0 ? "+" : "-"}${Math.abs(netPnl).toFixed(2)}
              </span>
            </p>
          </div>
          <div className="flex gap-1 p-1 bg-background/60 border border-border rounded-md self-start sm:self-auto">
            {(["all", "wins", "losses"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 text-[10px] font-display font-bold uppercase tracking-[0.2em] rounded-sm transition-all ${
                  filter === f
                    ? "bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.4)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60">
                <th className="text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium px-6 py-3.5">Date</th>
                <th className="text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium px-6 py-3.5">Position</th>
                <th className="text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium px-4 py-3.5">Side</th>
                <th className="text-right text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium px-6 py-3.5">Lots</th>
                <th className="text-right text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium px-6 py-3.5">Pips</th>
                <th className="text-right text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium px-6 py-3.5">P&L</th>
                <th className="text-right text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium px-6 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map((bundle, i) => {
                const trade = bundle.primary;
                const isOpen = openJournalKey === bundle.key;
                const isExpanded = expandedKey === bundle.key;
                const hasJournal = !!(trade.journalNotes?.trim() || trade.tradingviewLinks?.length);
                const isWin = bundle.totalPnl >= 0;
                return (
                  <Fragment key={bundle.key}>
                    <motion.tr
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.25 }}
                      className={`group transition-colors border-l-2 ${
                        isWin
                          ? "border-l-profit/60 hover:bg-profit/[0.03]"
                          : "border-l-loss/60 hover:bg-loss/[0.03]"
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground font-mono-numbers">
                          {bundle.linked && bundle.firstDate !== bundle.lastDate ? bundle.lastDate : bundle.lastDate}
                        </div>
                        {bundle.linked && bundle.firstDate !== bundle.lastDate && (
                          <div className="text-[10px] text-muted-foreground font-mono-numbers mt-0.5">
                            from {bundle.firstDate}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-display text-sm font-bold tracking-wider text-foreground">{trade.asset}</div>
                        {bundle.linked ? (
                          <button
                            onClick={() => setExpandedKey(isExpanded ? null : bundle.key)}
                            className="mt-1 inline-flex items-center gap-1 text-[9px] font-display uppercase tracking-[0.15em] text-primary hover:brightness-125 transition-all"
                          >
                            <Layers className="h-3 w-3" />
                            {bundle.fills.length} fills
                            <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </button>
                        ) : (
                          <div className="mt-1 text-[9px] font-display uppercase tracking-[0.15em] text-muted-foreground/50">
                            single fill
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] rounded-sm border ${
                            trade.direction === "long"
                              ? "border-profit/30 text-profit bg-profit/10"
                              : "border-loss/30 text-loss bg-loss/10"
                          }`}
                        >
                          {trade.direction === "long" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {trade.direction}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-mono-numbers text-muted-foreground">
                        {bundle.totalLots.toFixed(2)}
                      </td>
                      <td className={`px-6 py-4 text-right text-sm font-mono-numbers ${bundle.totalPips >= 0 ? "text-profit" : "text-loss"}`}>
                        {bundle.totalPips > 0 ? "+" : ""}{bundle.totalPips.toFixed(1)}
                      </td>
                      <td className={`px-6 py-4 text-right font-display text-sm font-bold tracking-tight ${isWin ? "text-profit" : "text-loss"}`}>
                        {isWin ? "+" : "-"}${Math.abs(bundle.totalPnl).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setOpenJournalKey(isOpen ? null : bundle.key)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-display font-bold uppercase tracking-[0.15em] rounded-sm border transition-all ${
                              hasJournal
                                ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                                : "border-border text-muted-foreground hover:text-primary hover:border-primary/40"
                            }`}
                          >
                            {hasJournal ? <BookOpen className="h-3 w-3" /> : <PenLine className="h-3 w-3" />}
                            {hasJournal ? "Journal" : "Write"}
                            <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                          </button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => navigate(`/trade/${trade.id}`)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-loss" onClick={() => deleteTrade(trade.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>

                    {/* Nested fills — each execution living under its parent position */}
                    <AnimatePresence initial={false}>
                      {isExpanded && bundle.linked && bundle.fills.map((fill) => (
                        <motion.tr
                          key={`${bundle.key}-${fill.id}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="bg-background/40 text-xs"
                        >
                          <td className="py-2.5 pl-10 pr-6 text-muted-foreground font-mono-numbers">
                            <span className="inline-flex items-center gap-1.5">
                              <CornerDownRight className="h-3 w-3 text-primary/60" />
                              {fill.date}
                            </span>
                          </td>
                          <td className="py-2.5 px-6 text-muted-foreground font-mono-numbers">
                            {fill.entryPrice} → {fill.exitPrice}
                          </td>
                          <td className="py-2.5 px-4 text-center text-muted-foreground capitalize">{fill.direction}</td>
                          <td className="py-2.5 px-6 text-right font-mono-numbers text-muted-foreground">{fill.positionSize}</td>
                          <td className={`py-2.5 px-6 text-right font-mono-numbers ${fill.pips >= 0 ? "text-profit" : "text-loss"}`}>
                            {fill.pips > 0 ? "+" : ""}{fill.pips}
                          </td>
                          <td className={`py-2.5 px-6 text-right font-mono-numbers ${fill.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                            {fill.pnl >= 0 ? "+" : ""}${fill.pnl.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-6 text-right">
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => navigate(`/trade/${fill.id}`)}>
                              <Eye className="h-3 w-3" />
                            </Button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.tr
                          key={`${bundle.key}-journal`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="bg-background/40 border-l-2 border-l-primary/40"
                        >
                          <td colSpan={7} className="px-6 py-5">
                            <TradeJournalPanel trade={trade} />
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No trades found</div>
        )}

        {/* Terminal footer */}
        <div className="px-6 py-3 border-t border-border bg-secondary/20 flex items-center justify-between text-[9px] font-display uppercase tracking-[0.25em] text-muted-foreground/60">
          <span>layered fills bundled into single records</span>
          <span className="font-mono-numbers">{filtered.length} shown</span>
        </div>
      </div>
    </div>
  );
};

export default TradeLog;
