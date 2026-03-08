import { useTrading } from "@/contexts/TradingContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";

export function RecentTrades() {
  const { trades } = useTrading();
  const navigate = useNavigate();
  const recent = [...trades].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="glass-card rounded-xl p-5 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <h3 className="text-xs font-semibold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
        Recent Trades
      </h3>
      {recent.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2">
          <Clock className="h-5 w-5 text-primary/30" />
          <span className="text-xs">No trades recorded yet</span>
        </div>
      ) : (
        <div className="space-y-1.5">
          {recent.map((trade, i) => (
            <motion.div
              key={trade.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.04 }}
              onClick={() => navigate(`/trade/${trade.id}`)}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/60 cursor-pointer transition-all duration-200 group border border-transparent hover:border-primary/10"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${trade.pnl >= 0 ? "bg-profit/10" : "bg-loss/10"}`}>
                  {trade.pnl >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-profit" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-loss" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{trade.asset}</p>
                  <p className="text-[10px] text-muted-foreground capitalize font-mono-numbers">{trade.direction} · {trade.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-mono-numbers font-bold ${trade.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                  {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono-numbers">{trade.pips > 0 ? "+" : ""}{trade.pips}p</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
