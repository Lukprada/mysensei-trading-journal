import { useTrading } from "@/contexts/TradingContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Eye, Trash2, BookOpen, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { TradeJournalPanel } from "@/components/TradeJournalPanel";

const TradeLog = () => {
  const { trades, deleteTrade } = useTrading();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "wins" | "losses">("all");
  const [openJournalId, setOpenJournalId] = useState<string | null>(null);

  const sorted = [...trades].sort((a, b) => b.date.localeCompare(a.date));
  const filtered = sorted.filter((t) => {
    if (filter === "wins") return t.pnl > 0;
    if (filter === "losses") return t.pnl < 0;
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Trade Log</h2>
          <p className="text-sm text-muted-foreground mt-1">{trades.length} total trades · tap Journal to open the full record</p>
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
                <th className="text-left text-xs text-muted-foreground font-medium p-3">Asset</th>
                <th className="text-left text-xs text-muted-foreground font-medium p-3">Direction</th>
                <th className="text-right text-xs text-muted-foreground font-medium p-3">Lots</th>
                <th className="text-right text-xs text-muted-foreground font-medium p-3">Pips</th>
                <th className="text-right text-xs text-muted-foreground font-medium p-3">P&L</th>
                <th className="text-left text-xs text-muted-foreground font-medium p-3">Journal</th>
                <th className="text-right text-xs text-muted-foreground font-medium p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((trade, i) => {
                const isOpen = openJournalId === trade.id;
                const hasJournal = !!(trade.journalNotes?.trim() || trade.tradingviewLinks?.length);
                return (
                  <>
                    <motion.tr
                      key={trade.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="p-3 text-sm text-muted-foreground font-mono-numbers">{trade.date}</td>
                      <td className="p-3 text-sm font-medium text-foreground">
                        {trade.asset}
                        {trade.linkedGroupId && (
                          <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-display tracking-wider">LINKED</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                          trade.direction === "long" ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"
                        }`}>
                          {trade.direction === "long" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {trade.direction}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-right font-mono-numbers text-muted-foreground">{trade.positionSize}</td>
                      <td className={`p-3 text-sm text-right font-mono-numbers ${trade.pips >= 0 ? "text-profit" : "text-loss"}`}>
                        {trade.pips > 0 ? "+" : ""}{trade.pips}
                      </td>
                      <td className={`p-3 text-sm text-right font-mono-numbers font-semibold ${trade.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                        {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => setOpenJournalId(isOpen ? null : trade.id)}
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
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.tr
                          key={`${trade.id}-journal`}
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
                  </>
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
