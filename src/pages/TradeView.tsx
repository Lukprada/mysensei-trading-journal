import { useParams, useNavigate } from "react-router-dom";
import { useTrading } from "@/contexts/TradingContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Brain, Sparkles, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";

const mentalStateEmoji: Record<string, string> = {
  confident: "😎",
  anxious: "😰",
  impulsive: "⚡",
};

const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-trade-sensei`;

const TradeView = () => {
  const { id } = useParams();
  const { getTradeById, updateTradeCritique, accounts } = useTrading();
  const navigate = useNavigate();
  const trade = getTradeById(id || "");
  const account = accounts.find((a) => a.id === trade?.accountId);

  const [senseiOpen, setSenseiOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Show saved critique on load
  useEffect(() => {
    if (trade?.aiCritique) {
      setStreamedText(trade.aiCritique);
      setSenseiOpen(true);
    }
  }, [trade?.aiCritique]);

  // Auto-scroll critique panel
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamedText]);

  const analyzeTrade = useCallback(async () => {
    if (!trade || !account) return;
    setIsAnalyzing(true);
    setSenseiOpen(true);
    setStreamedText("");

    try {
      const resp = await fetch(ANALYZE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          trade_details: {
            asset: trade.asset,
            direction: trade.direction,
            entry_price: trade.entryPrice,
            exit_price: trade.exitPrice,
            pips: trade.pips,
            pnl: trade.pnl,
            position_size: trade.positionSize,
          },
          user_notes: trade.notes,
          user_mood: trade.mentalState,
          screenshot_url: trade.screenshotUrl || null,
          account_type: account.type,
        }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) {
          toast.error("Rate limit hit — try again in a moment.");
        } else if (resp.status === 402) {
          toast.error("AI credits exhausted. Top up your workspace to continue.");
        } else {
          toast.error("Sensei couldn't analyze this trade.");
        }
        setIsAnalyzing(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setStreamedText(fullText);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Persist the critique
      if (fullText && trade.id) {
        updateTradeCritique(trade.id, fullText);
      }
    } catch (e) {
      console.error("Sensei error:", e);
      toast.error("Failed to reach Sensei. Check your connection.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [trade, account, updateTradeCritique]);

  if (!trade) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Trade not found.
        <Button variant="ghost" className="ml-2" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
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
                {account && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                    {account.type}
                  </span>
                )}
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

          {/* Sensei Button */}
          <Button
            onClick={analyzeTrade}
            disabled={isAnalyzing}
            className="bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 gap-2 font-semibold"
          >
            {isAnalyzing ? (
              <>
                <Eye className="h-4 w-4 animate-pulse" /> Sensei is reviewing...
              </>
            ) : trade.aiCritique ? (
              <>
                <Sparkles className="h-4 w-4" /> Re-analyze with Sensei
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Get Sensei's Critique
              </>
            )}
          </Button>
        </motion.div>

        {/* Sensei Side Panel */}
        <AnimatePresence>
          {senseiOpen && (
            <motion.div
              initial={{ opacity: 0, x: 30, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 340 }}
              exit={{ opacity: 0, x: 30, width: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="shrink-0 rounded-lg border border-border bg-card self-start sticky top-20 overflow-hidden"
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Sensei's Corner</h3>
                    <p className="text-xs text-muted-foreground">Trading Psychologist & Risk Manager</p>
                  </div>
                </div>

                {/* Trade context badge */}
                <div className="rounded-lg bg-secondary p-3 mb-4">
                  <p className="text-xs text-muted-foreground mb-1">Reviewing</p>
                  <p className="text-sm text-foreground font-medium">
                    {trade.asset} {trade.direction} · {trade.pips > 0 ? "+" : ""}{trade.pips} pips · {mentalStateEmoji[trade.mentalState]} {trade.mentalState}
                  </p>
                </div>

                {/* Analysis content */}
                <div
                  ref={scrollRef}
                  className="rounded-lg bg-primary/5 border border-primary/20 p-4 max-h-[400px] overflow-y-auto"
                >
                  {isAnalyzing && !streamedText && (
                    <div className="flex flex-col items-center gap-3 py-6">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Eye className="h-6 w-6 text-primary animate-pulse" />
                      </div>
                      <p className="text-sm text-muted-foreground text-center animate-pulse">
                        Sensei is reviewing your charts...
                      </p>
                    </div>
                  )}

                  {streamedText && (
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {streamedText}
                      {isAnalyzing && (
                        <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-pulse rounded-sm" />
                      )}
                    </p>
                  )}
                </div>

                {trade.aiCritique && !isAnalyzing && (
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    Critique saved · click re-analyze to refresh
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TradeView;
