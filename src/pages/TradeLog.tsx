import { useTrading } from "@/contexts/TradingContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Eye, Trash2, BookOpen, ChevronDown, Layers, CornerDownRight } from "lucide-react";
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Trade Log</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {bundles.length} positions · {trades.length} executions · layered fills are bundled into one record
          </p>
        </div>
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {(["all", "wins", "losses"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors capitalize ${
                filter === f ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left text-xs text-muted-foreground font-medium p-3">Date</th>
                <th className="text-left text-xs text-muted-foreground font-medium p-3">Position</th>
                <th className="text-left text-xs text-muted-foreground font-medium p-3">Direction</th>
                <th className="text-right text-xs text-muted-foreground font-medium p-3">Lots</th>
                <th className="text-right text-xs text-muted-foreground font-medium p-3">Pips</th>
                <th className="text-right text-xs text-muted-foreground font-medium p-3">P&L</th>
                <th className="text-left text-xs text-muted-foreground font-medium p-3">Journal</th>
                <th className="text-right text-xs text-muted-foreground font-medium p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((bundle, i) => {
                const trade = bundle.primary;
                const isOpen = openJournalKey === bundle.key;
                const isExpanded = expandedKey === bundle.key;
                const hasJournal = !!(trade.journalNotes?.trim() || trade.tradingviewLinks?.length);
                return (
                  <Fragment key={bundle.key}>
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="p-3 text-sm text-muted-foreground font-mono-numbers whitespace-nowrap">
                        {bundle.linked && bundle.firstDate !== bundle.lastDate
                          ? `${bundle.firstDate} → ${bundle.lastDate}`
                          : bundle.lastDate}
                      </td>
                      <td className="p-3 text-sm font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          {trade.asset}

                          {bundle.linked && (
                            <button
                              onClick={() => setExpandedKey(isExpanded ? null : bundle.key)}
                              className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-display tracking-wider hover:bg-primary/20"
                            >
                              <Layers className="h-3 w-3" />
                              {bundle.fills.length} FILLS
                              <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                          trade.direction === "long" ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"
                        }`}>
                          {trade.direction === "long" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {trade.direction}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-right font-mono-numbers text-muted-foreground">{bundle.totalLots.toFixed(2)}</td>
                      <td className={`p-3 text-sm text-right font-mono-numbers ${bundle.totalPips >= 0 ? "text-profit" : "text-loss"}`}>
                        {bundle.totalPips > 0 ? "+" : ""}{bundle.totalPips.toFixed(1)}
                      </td>
                      <td className={`p-3 text-sm text-right font-mono-numbers font-semibold ${bundle.totalPnl >= 0 ? "text-profit" : "text-loss"}`}>
                        {bundle.totalPnl >= 0 ? "+" : ""}${bundle.totalPnl.toFixed(2)}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => setOpenJournalKey(isOpen ? null : bundle.key)}
                          className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors ${
                            hasJournal
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                          }`}
                        >
                          <BookOpen className="h-3 w-3" />
                          {hasJournal ? "Open" : "Write"}
                          <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/trade/${trade.id}`)}>
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
                          className="border-b border-border/50 bg-secondary/20 text-xs"
                        >
                          <td className="py-2 pl-8 pr-3 text-muted-foreground font-mono-numbers">
                            <span className="inline-flex items-center gap-1.5">
                              <CornerDownRight className="h-3 w-3 text-primary/60" />
                              {fill.date}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-muted-foreground">
                            {fill.entryPrice} → {fill.exitPrice}
                          </td>
                          <td className="py-2 px-3 text-muted-foreground capitalize">{fill.direction}</td>
                          <td className="py-2 px-3 text-right font-mono-numbers text-muted-foreground">{fill.positionSize}</td>
                          <td className={`py-2 px-3 text-right font-mono-numbers ${fill.pips >= 0 ? "text-profit" : "text-loss"}`}>
                            {fill.pips > 0 ? "+" : ""}{fill.pips}
                          </td>
                          <td className={`py-2 px-3 text-right font-mono-numbers ${fill.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                            {fill.pnl >= 0 ? "+" : ""}${fill.pnl.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-muted-foreground">shared journal</td>
                          <td className="py-2 px-3 text-right">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigate(`/trade/${fill.id}`)}>
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
                          className="border-b border-border bg-secondary/20"
                        >
                          <td colSpan={8} className="p-4">
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
      </div>
    </div>
  );
};

export default TradeLog;
