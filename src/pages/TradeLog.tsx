import { useTrading } from "@/contexts/TradingContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Eye, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

const TradeLog = () => {
  const { trades, deleteTrade, addCashFlow } = useTrading();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "wins" | "losses">("all");

  const sorted = [...trades].sort((a, b) => b.date.localeCompare(a.date));
  const filtered = sorted.filter((t) => {
    if (filter === "wins") return t.pnl > 0;
    if (filter === "losses") return t.pnl < 0;
    return true;
  });

  const convertToCashFlow = async (trade: typeof trades[number]) => {
    const type: "deposit" | "withdrawal" = trade.pnl >= 0 ? "deposit" : "withdrawal";
    const ok = window.confirm(
      `Convert this ${trade.asset} entry into a ${type} of $${Math.abs(trade.pnl).toFixed(2)}?\n\nThe trade will be removed and re-registered under Deposits / Withdrawals.`
    );
    if (!ok) return;
    const saved = await addCashFlow({
      accountId: trade.accountId,
      flowType: type,
      amount: Math.abs(trade.pnl),
      occurredAt: new Date(trade.date).toISOString(),
      source: "manual",
      note: `Converted from imported entry (${trade.asset || "UNKNOWN"})`,
    });
    if (!saved) return;
    await deleteTrade(trade.id);
    toast.success(`Registered as ${type}`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Trade Log</h2>
          <p className="text-sm text-muted-foreground mt-1">{trades.length} total trades</p>
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
                <th className="text-left text-xs text-muted-foreground font-medium p-3">State</th>
                <th className="text-right text-xs text-muted-foreground font-medium p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((trade, i) => (
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
                  <td className="p-3 text-xs text-muted-foreground capitalize">{trade.mentalState}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {(!trade.positionSize || trade.positionSize === 0 || trade.asset === "UNKNOWN") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-primary hover:text-primary"
                          title={`Register as ${trade.pnl >= 0 ? "deposit" : "withdrawal"}`}
                          onClick={() => convertToCashFlow(trade)}
                        >
                          <Wallet className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/trade/${trade.id}`)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-loss" onClick={() => deleteTrade(trade.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
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
