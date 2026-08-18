import { useParams, useNavigate } from "react-router-dom";
import { useTrading } from "@/contexts/TradingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Brain, Sparkles, Eye, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { streamSenseiChat, type ChatMessage } from "@/lib/streamChat";
import { TradeJournalPanel } from "@/components/TradeJournalPanel";

const mentalStateEmoji: Record<string, string> = {
  confident: "😎",
  anxious: "😰",
  impulsive: "⚡",
};

const TradeView = () => {
  const { id } = useParams();
  const { getTradeById, updateTradeCritique, accounts } = useTrading();
  const navigate = useNavigate();
  const trade = getTradeById(id || "");
  const account = accounts.find((a) => a.id === trade?.accountId);

  const [senseiOpen, setSenseiOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load saved conversation
  useEffect(() => {
    if (trade?.aiCritique) {
      try {
        const parsed = JSON.parse(trade.aiCritique);
        if (Array.isArray(parsed)) {
          setChatMessages(parsed);
          setSenseiOpen(true);
          return;
        }
      } catch { /* legacy string format */ }
      // Legacy: single string critique → convert to message
      setChatMessages([{ role: "assistant", content: trade.aiCritique }]);
      setSenseiOpen(true);
    }
  }, [trade?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const tradeContext = trade && account ? {
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
  } : undefined;

  const sendMessage = useCallback(async (initialCritique = false) => {
    if (!trade || !tradeContext) return;

    const newMessages = [...chatMessages];
    if (!initialCritique && userInput.trim()) {
      newMessages.push({ role: "user", content: userInput.trim() });
      setUserInput("");
    }

    setChatMessages(newMessages);
    setIsStreaming(true);
    setSenseiOpen(true);

    let assistantText = "";

    // Determine which messages to send to API
    const apiMessages = initialCritique ? [] : newMessages;

    try {
      await streamSenseiChat({
        messages: initialCritique ? [] : newMessages,
        tradeContext,
        onDelta: (chunk) => {
          assistantText += chunk;
          setChatMessages([...newMessages, { role: "assistant", content: assistantText }]);
        },
        onDone: () => {
          setIsStreaming(false);
          const final = [...newMessages, { role: "assistant" as const, content: assistantText }];
          setChatMessages(final);
          updateTradeCritique(trade.id, JSON.stringify(final));
        },
        onError: (status) => {
          setIsStreaming(false);
          if (status === 429) toast.error("Rate limit hit — try again in a moment.");
          else if (status === 402) toast.error("AI credits exhausted.");
          else toast.error("Sensei couldn't respond.");
        },
      });
    } catch (e) {
      console.error("Sensei error:", e);
      toast.error("Failed to reach Sensei.");
      setIsStreaming(false);
    }
  }, [trade, tradeContext, chatMessages, userInput, updateTradeCritique]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && userInput.trim() && !isStreaming) {
      e.preventDefault();
      sendMessage(false);
    }
  };

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

      <div className="flex flex-col lg:flex-row gap-6">
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

          {/* Broker economics */}
          {(trade.commission !== undefined || trade.swap !== undefined || trade.brokerComment || trade.magicNumber) && (
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">💼 Broker Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {trade.commission !== undefined && (
                  <div><span className="text-xs text-muted-foreground block">Commission</span>
                    <span className={`font-mono-numbers ${trade.commission < 0 ? "text-loss" : ""}`}>
                      ${trade.commission.toFixed(2)}
                    </span></div>
                )}
                {trade.swap !== undefined && (
                  <div><span className="text-xs text-muted-foreground block">Swap</span>
                    <span className={`font-mono-numbers ${trade.swap < 0 ? "text-loss" : trade.swap > 0 ? "text-profit" : ""}`}>
                      ${trade.swap.toFixed(2)}
                    </span></div>
                )}
                {trade.commission !== undefined && trade.swap !== undefined && (
                  <div><span className="text-xs text-muted-foreground block">Net P&L</span>
                    <span className={`font-mono-numbers font-semibold ${(trade.pnl + trade.commission + trade.swap) >= 0 ? "text-profit" : "text-loss"}`}>
                      ${(trade.pnl + trade.commission + trade.swap).toFixed(2)}
                    </span></div>
                )}
                {trade.magicNumber && (
                  <div><span className="text-xs text-muted-foreground block">Magic #</span>
                    <span className="font-mono-numbers">{trade.magicNumber}</span></div>
                )}
              </div>
              {trade.brokerComment && (
                <p className="text-xs text-muted-foreground border-t border-border/40 pt-2">
                  <span className="font-medium text-foreground">Broker comment:</span> {trade.brokerComment}
                </p>
              )}
            </div>
          )}

          {/* Plan & Risk panel — only renders if any of the new fields exist */}
          {(trade.stopLoss || trade.takeProfit || trade.riskAmount || trade.setupTag || trade.rulesFollowed !== undefined) && (
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                🎯 Plan & Risk
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                {trade.stopLoss !== undefined && (
                  <div><span className="text-xs text-muted-foreground block">Stop Loss</span><span className="font-mono-numbers text-loss">{trade.stopLoss}</span></div>
                )}
                {trade.takeProfit !== undefined && (
                  <div><span className="text-xs text-muted-foreground block">Take Profit</span><span className="font-mono-numbers text-profit">{trade.takeProfit}</span></div>
                )}
                {trade.riskAmount !== undefined && (
                  <div><span className="text-xs text-muted-foreground block">Risk</span><span className="font-mono-numbers">${trade.riskAmount}</span></div>
                )}
                {trade.riskAmount !== undefined && trade.riskAmount > 0 && (
                  <div><span className="text-xs text-muted-foreground block">R-Multiple</span>
                    <span className={`font-mono-numbers ${trade.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                      {(trade.pnl / trade.riskAmount).toFixed(2)}R
                    </span>
                  </div>
                )}
                {trade.setupTag && (
                  <div><span className="text-xs text-muted-foreground block">Setup</span><span>{trade.setupTag}</span></div>
                )}
                {trade.rulesFollowed !== undefined && (
                  <div><span className="text-xs text-muted-foreground block">Rules</span>
                    <span className={trade.rulesFollowed ? "text-profit" : "text-loss"}>
                      {trade.rulesFollowed ? "✓ Followed" : "✗ Broke plan"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          {trade.screenshotUrl && (
            <div className="rounded-lg border border-border overflow-hidden">
              <img src={trade.screenshotUrl} alt="Trade chart" className="w-full object-cover max-h-80" />
            </div>
          )}

          {trade.notes && (
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-medium text-foreground mb-2">Quick Notes</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{trade.notes}</p>
            </div>
          )}

          {/* Journal, TradingView links, link partial fills */}
          <TradeJournalPanel trade={trade} />

          {chatMessages.length === 0 && (
            <Button
              onClick={() => sendMessage(true)}
              disabled={isStreaming}
              className="bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 gap-2 font-semibold"
            >
              <Sparkles className="h-4 w-4" /> Get Sensei's Critique
            </Button>
          )}
        </motion.div>

        {/* Sensei Chat Panel */}
        <AnimatePresence>
          {senseiOpen && (
            <motion.div
              initial={{ opacity: 0, x: 30, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 380 }}
              exit={{ opacity: 0, x: 30, width: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full lg:w-auto shrink-0 rounded-lg border border-border bg-card self-start lg:sticky top-20 overflow-hidden flex flex-col"
              style={{ maxHeight: "calc(100vh - 120px)" }}
            >
              {/* Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Sensei's Corner</h3>
                    <p className="text-xs text-muted-foreground">Ask follow-ups about this trade</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 && isStreaming && (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Eye className="h-6 w-6 text-primary animate-pulse" />
                    </div>
                    <p className="text-sm text-muted-foreground text-center animate-pulse">
                      Sensei is reviewing your trade...
                    </p>
                  </div>
                )}

                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/5 border border-primary/20 text-foreground"
                    }`}>
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-1 [&>p:last-child]:mb-0">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                          {isStreaming && i === chatMessages.length - 1 && (
                            <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-pulse rounded-sm" />
                          )}
                        </div>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              {chatMessages.length > 0 && (
                <div className="p-3 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask Sensei a follow-up..."
                      disabled={isStreaming}
                      className="text-sm"
                    />
                    <Button
                      size="icon"
                      onClick={() => sendMessage(false)}
                      disabled={isStreaming || !userInput.trim()}
                      className="shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TradeView;
