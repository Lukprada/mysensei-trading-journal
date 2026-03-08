import { useTrading } from "@/contexts/TradingContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Eye, X, CalendarDays, List } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

interface TradeListPanelProps {
  selectedDate: string | null;
  onClearDate: () => void;
}

export function TradeListPanel({ selectedDate, onClearDate }: TradeListPanelProps) {
  const { trades } = useTrading();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"day" | "all">(selectedDate ? "day" : "all");

  // When selectedDate changes, switch to day tab
  if (selectedDate && tab === "all") {
    // will update on next render via effect-like behavior
  }

  const dayTrades = selectedDate
    ? trades.filter((t) => t.date === selectedDate).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    : [];

  const allSorted = [...trades].sort((a, b) => b.date.localeCompare(a.date));

  const displayTrades = selectedDate && tab === "day" ? dayTrades : allSorted;

  const dayStats = selectedDate ? {
    total: dayTrades.length,
    pnl: dayTrades.reduce((s, t) => s + t.pnl, 0),
    wins: dayTrades.filter((t) => t.pnl > 0).length,
    losses: dayTrades.filter((t) => t.pnl < 0).length,
  } : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="glass-card rounded-xl relative overflow-hidden flex flex-col"
      style={{ maxHeight: "600px" }}
    >
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      {/* Tabs */}
      <div className="p-4 pb-0">
        <div className="flex items-center gap-1 mb-3">
          {selectedDate && (
            <button
              onClick={() => setTab("day")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-all font-medium ${
                tab === "day"
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <CalendarDays className="h-3 w-3" />
              {format(new Date(selectedDate + "T00:00:00"), "MMM d")}
            </button>
          )}
          <button
            onClick={() => setTab("all")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-all font-medium ${
              tab === "all"
                ? "bg-primary/15 text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            <List className="h-3 w-3" />
            All Trades
          </button>

          {selectedDate && tab === "day" && (
            <button
              onClick={onClearDate}
              className="ml-auto p-1 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Day stats banner */}
        <AnimatePresence>
          {selectedDate && tab === "day" && dayStats && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-4 gap-2 mb-3"
            >
              <div className="rounded-lg bg-secondary/30 border border-border/30 p-2 text-center">
                <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Trades</p>
                <p className="text-sm font-bold font-mono-numbers text-foreground">{dayStats.total}</p>
              </div>
              <div className="rounded-lg bg-secondary/30 border border-border/30 p-2 text-center">
                <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Wins</p>
                <p className="text-sm font-bold font-mono-numbers text-profit">{dayStats.wins}</p>
              </div>
              <div className="rounded-lg bg-secondary/30 border border-border/30 p-2 text-center">
                <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Losses</p>
                <p className="text-sm font-bold font-mono-numbers text-loss">{dayStats.losses}</p>
              </div>
              <div className="rounded-lg bg-secondary/30 border border-border/30 p-2 text-center">
                <p className="text-[8px] text-muted-foreground uppercase tracking-wider">P&L</p>
                <p className={`text-sm font-bold font-mono-numbers ${dayStats.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                  {dayStats.pnl >= 0 ? "+" : ""}${dayStats.pnl.toFixed(2)}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Trade list header */}
      <div className="px-4">
        <div className="grid grid-cols-[1fr_80px_80px] gap-2 text-[9px] text-muted-foreground uppercase tracking-wider font-medium py-2 border-b border-border/30">
          <span>Close Date</span>
          <span className="text-center">Symbol</span>
          <span className="text-right">Net P&L</span>
        </div>
      </div>

      {/* Trade list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {displayTrades.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-xs gap-2">
            <CalendarDays className="h-5 w-5 text-primary/30" />
            <span>{selectedDate && tab === "day" ? "No trades on this day" : "No trades recorded yet"}</span>
          </div>
        ) : (
          <div className="divide-y divide-border/20">
            {displayTrades.map((trade, i) => (
              <motion.div
                key={trade.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => navigate(`/trade/${trade.id}`)}
                className="grid grid-cols-[1fr_80px_80px] gap-2 py-2.5 cursor-pointer hover:bg-secondary/30 -mx-1 px-1 rounded-md transition-colors group items-center"
              >
                <span className="text-xs text-muted-foreground font-mono-numbers">{trade.date}</span>
                <span className="text-xs font-medium text-foreground text-center flex items-center justify-center gap-1">
                  {trade.direction === "long" ? (
                    <ArrowUpRight className="h-3 w-3 text-profit opacity-60" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-loss opacity-60" />
                  )}
                  {trade.asset}
                </span>
                <span className={`text-xs font-bold font-mono-numbers text-right ${trade.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                  {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                </span>
              </motion.div>
            ))}
          </div>
        )}

        {tab === "all" && allSorted.length > 0 && (
          <button
            onClick={() => navigate("/trade-log")}
            className="w-full text-center text-xs text-primary hover:text-primary/80 font-medium py-3 transition-colors"
          >
            View More
          </button>
        )}
      </div>
    </motion.div>
  );
}
