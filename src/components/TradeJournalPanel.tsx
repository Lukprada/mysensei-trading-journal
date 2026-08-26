import { useState, useEffect } from "react";
import { useTrading } from "@/contexts/TradingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link2, Plus, X, ExternalLink, Save, BookOpen, Target, Brain, CheckCircle2, Share2, Users, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Trade } from "@/types/trading";
import { LinkTradesDialog } from "./LinkTradesDialog";
import { ForexFactoryNews } from "./ForexFactoryNews";
import { bundleFromTrade, bundleToTradeDetails, bundleToNarrative } from "@/lib/tradeBundle";
import { streamSenseiChat } from "@/lib/streamChat";


interface Props {
  trade: Trade;
  /** Hide the news block in tight spaces (e.g. inline in the trade log) */
  compact?: boolean;
}

function normalizeTV(raw: string): string {
  const url = raw.trim();
  const xMatch = url.match(/tradingview\.com\/x\/([A-Za-z0-9]+)/i);
  if (xMatch) return `https://s3.tradingview.com/snapshots/${xMatch[1][0].toLowerCase()}/${xMatch[1]}.png`;
  return url;
}

export function TradeJournalPanel({ trade, compact = false }: Props) {
  const { updateTrade, allTrades, accounts, updateTradeCritique } = useTrading();
  const [notes, setNotes] = useState(trade.journalNotes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [links, setLinks] = useState<string[]>(trade.tradingviewLinks || []);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [critique, setCritique] = useState(trade.aiCritique || "");
  const [analyzing, setAnalyzing] = useState(false);


  useEffect(() => {
    setNotes(trade.journalNotes || "");
    setLinks(trade.tradingviewLinks || []);
  }, [trade.id, trade.journalNotes, trade.tradingviewLinks]);

  const groupTrades = trade.linkedGroupId
    ? allTrades.filter((t) => t.linkedGroupId === trade.linkedGroupId)
    : [];
  const groupCount = groupTrades.length;
  const shared = groupCount > 1;
  const groupPnl = groupTrades.reduce((sum, t) => sum + t.pnl, 0);
  const groupLots = groupTrades.reduce((sum, t) => sum + (t.positionSize || 0), 0);

  const bundle = bundleFromTrade(trade, allTrades);

  async function analyzeBundle() {
    setAnalyzing(true);
    setCritique("");
    let acc = "";
    const accountType = accounts.find((a) => a.id === trade.accountId)?.type || "unknown";
    try {
      await streamSenseiChat({
        messages: [],
        tradeContext: {
          trade_details: bundleToTradeDetails(bundle),
          user_notes: bundleToNarrative(bundle, notes),
          user_mood: trade.mentalState,
          screenshot_url: links[0] || trade.screenshotUrl || null,
          account_type: accountType,
        },
        onDelta: (chunk) => {
          acc += chunk;
          setCritique(acc);
        },
        onDone: () => {
          setAnalyzing(false);
          if (acc.trim()) updateTradeCritique(trade.id, acc);
        },
        onError: (status) => {
          setAnalyzing(false);
          toast.error(status === 429 ? "Rate limited — try again shortly" : "Sensei couldn't analyse this bundle");
        },
      });
    } catch {
      setAnalyzing(false);
      toast.error("Sensei couldn't analyse this bundle");
    }
  }



  async function saveNotes() {
    setSavingNotes(true);
    await updateTrade(trade.id, { journalNotes: notes }, { shareWithGroup: true });
    setSavingNotes(false);
    toast.success(shared ? `Journal saved for all ${groupCount} linked fills` : "Journal saved");
  }

  async function addLink() {
    if (!linkInput.trim()) return;
    const next = [...links, normalizeTV(linkInput)];
    setLinks(next);
    setLinkInput("");
    await updateTrade(trade.id, { tradingviewLinks: next }, { shareWithGroup: true });
  }

  async function removeLink(i: number) {
    const next = links.filter((_, idx) => idx !== i);
    setLinks(next);
    await updateTrade(trade.id, { tradingviewLinks: next }, { shareWithGroup: true });
  }

  async function shareJournal() {
    const header = shared
      ? `${trade.asset} ${trade.direction} — linked position (${groupCount} fills, ${groupLots.toFixed(2)} lots, ${groupPnl >= 0 ? "+" : ""}$${groupPnl.toFixed(2)})`
      : `${trade.asset} ${trade.direction} — ${trade.date} (${trade.pnl >= 0 ? "+" : ""}$${trade.pnl.toFixed(2)})`;
    const text = [
      `# Trading Journal — ${header}`,
      "",
      `Entry ${trade.entryPrice} → Exit ${trade.exitPrice} · ${trade.positionSize} lots · ${trade.pips} pips`,
      trade.setupTag ? `Setup: ${trade.setupTag}` : "",
      "",
      notes || "(no journal written yet)",
      "",
      links.length ? `Charts:\n${links.join("\n")}` : "",
    ].filter(Boolean).join("\n");

    try {
      if (navigator.share) {
        await navigator.share({ title: `Trading Journal — ${trade.asset}`, text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Journal page copied to clipboard");
      }
    } catch {
      /* user cancelled */
    }
  }

  return (
    <div className="space-y-4">
      {/* Linked position — one journal for every fill */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" /> Linked Position
          </h3>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" className="gap-1" onClick={shareJournal}>
              <Share2 className="h-3.5 w-3.5" /> Share
            </Button>
            <Button size="sm" variant="outline" onClick={() => setLinkDialogOpen(true)}>
              {shared ? `Manage (${groupCount})` : "Link fills"}
            </Button>
          </div>
        </div>
        {shared ? (
          <div className="space-y-2">
            <p className="text-xs text-primary flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              One position, {groupCount} layered fills · {groupLots.toFixed(2)} lots · combined{" "}
              <span className={groupPnl >= 0 ? "text-profit" : "text-loss"}>
                {groupPnl >= 0 ? "+" : ""}${groupPnl.toFixed(2)}
              </span>
            </p>
            <p className="text-[11px] text-muted-foreground">
              This journal page is shared — anything you write or attach here appears on every fill in the group.
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Did you scale in/out of {trade.asset}? Link the other fills so they share one journal page.
          </p>
        )}
      </div>

      {/* TradingView chart links */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          📈 TradingView Chart Links
        </h3>
        <div className="flex gap-2">
          <Input
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLink())}
            placeholder="Paste tradingview.com/x/... or any image URL"
            className="text-sm"
          />
          <Button size="sm" onClick={addLink} className="gap-1"><Plus className="h-3.5 w-3.5" /> Add</Button>
        </div>
        {links.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {links.map((url, i) => (
              <div key={i} className="relative group rounded-md overflow-hidden border border-border">
                <img src={url} alt={`Chart ${i + 1}`} className="w-full h-32 object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <a href={url} target="_blank" rel="noreferrer">
                    <Button size="icon" variant="secondary" className="h-8 w-8"><ExternalLink className="h-3.5 w-3.5" /></Button>
                  </a>
                  <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => removeLink(i)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Real-world news for the record */}
      {!compact && (
        <ForexFactoryNews
          date={trade.date}
          onAttach={(snapshot) => setNotes((prev) => `${prev}${snapshot}`)}
        />
      )}

      {/* Long-form journal */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">📝 Trade Journal</h3>
          <Button size="sm" variant="outline" onClick={saveNotes} disabled={savingNotes} className="gap-1">
            <Save className="h-3.5 w-3.5" /> {savingNotes ? "Saving..." : "Save"}
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5 text-primary" /> Market context</span>
          <span className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5 text-primary" /> Entry & exit plan</span>
          <span className="flex items-center gap-1.5"><Brain className="h-3.5 w-3.5 text-primary" /> Emotions</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Lesson & next action</span>
        </div>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write freely — context, emotions, what went right, what to fix next time. This stays attached to this trade."
          className={`${compact ? "min-h-[200px]" : "min-h-[320px]"} resize-y text-sm leading-relaxed`}
        />
      </div>

      <LinkTradesDialog trade={trade} open={linkDialogOpen} onOpenChange={setLinkDialogOpen} />
    </div>
  );
}
