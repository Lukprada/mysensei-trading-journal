import { useParams, useNavigate } from "react-router-dom";
import { useTrading } from "@/contexts/TradingContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Brain, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const mentalStateEmoji: Record<string, string> = {
  confident: "😎",
  anxious: "😰",
  impulsive: "⚡",
};

const TradeView = () => {
  const { id } = useParams();
  const { getTradeById } = useTrading();
  const navigate = useNavigate();
  const trade = getTradeById(id || "");
  const [aiOpen, setAiOpen] = useState(false);

  if (!trade) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Trade not found.
        <Button variant="ghost" className="ml-2" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Button variant="ghost" className="mb-4 text-muted-foreground" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>

      <div className="flex gap-6">
        {/* Main trade detail */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                {trade.asset}
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                  trade.direction === "long" ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"
                }`}>
                  {trade.direction === "long" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {trade.direction}
                </span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">{trade.date}</p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold font-mono-numbers ${trade.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground font-mono-numbers">{trade.pips > 0 ? "+" : ""}{trade.pips} pips</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Entry", value: trade.entryPrice.toString() },
              { label: "Exit", value: trade.exitPrice.toString() },
              { label: "Lot Size", value: trade.positionSize.toString() },
              { label: "Mental State", value: `${mentalStateEmoji[trade.mentalState] || ""} ${trade.mentalState}` },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-sm font-medium font-mono-numbers text-foreground mt-1 capitalize">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Screenshot */}
          {trade.screenshotUrl && (
            <div className="rounded-lg border border-border overflow-hidden">
              <img src={trade.screenshotUrl} alt="Trade chart" className="w-full object-cover max-h-80" />
            </div>
          )}

          {/* Notes */}
          {trade.notes && (
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-medium text-foreground mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{trade.notes}</p>
            </div>
          )}

          {/* AI Mentor Button */}
          <Button onClick={() => setAiOpen(!aiOpen)} className="bg-secondary text-foreground hover:bg-accent border border-border gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Analyze with Sensei
          </Button>
        </motion.div>

        {/* AI Mentor Side Panel */}
        {aiOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-80 shrink-0 rounded-lg border border-border bg-card p-4 self-start sticky top-20"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">AI Sensei</h3>
                <p className="text-xs text-muted-foreground">Trade Mentor</p>
              </div>
            </div>

            <div className="rounded-lg bg-secondary p-3 mb-3">
              <p className="text-xs text-muted-foreground mb-1">Trade Summary</p>
              <p className="text-sm text-foreground">
                {trade.asset} {trade.direction} · {trade.pips > 0 ? "+" : ""}{trade.pips} pips · {trade.mentalState}
              </p>
            </div>

            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
              <p className="text-sm text-foreground leading-relaxed">
                🧠 Connect to an AI API to get personalized trade analysis, pattern recognition, and improvement suggestions based on your trading history.
              </p>
            </div>

            <p className="text-xs text-muted-foreground mt-3 text-center">
              AI integration ready — connect your API to activate
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TradeView;
