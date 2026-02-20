import { useTrading } from "@/contexts/TradingContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";

export function RecentTrades() {
  const { trades } = useTrading();
  const navigate = useNavigate();
  const recent = [...trades].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-medium text-foreground mb-4">Recent Trades</h3>
      {recent.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
          <Clock className="h-4 w-4 mr-2" /> No trades yet
        </div>
      ) : (
        <div className="space-y-2">
          {recent.map((trade, i) => (
            <motion.div
              key={trade.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => navigate(`/trade/${trade.id}`)}
              className="flex items-center justify-between p-3 rounded-md bg-secondary hover:bg-accent cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded flex items-center justify-center ${trade.pnl >= 0 ? "gradient-profit" : "gradient-loss"}`}>
                  {trade.pnl >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-profit" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-loss" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{trade.asset}</p>
                  <p className="text-xs text-muted-foreground capitalize">{trade.direction} · {trade.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-mono-numbers font-semibold ${trade.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                  {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground font-mono-numbers">{trade.pips > 0 ? "+" : ""}{trade.pips} pips</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
