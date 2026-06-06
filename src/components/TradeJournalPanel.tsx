import { useState, useEffect } from "react";
import { useTrading } from "@/contexts/TradingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link2, Plus, X, ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";
import type { Trade } from "@/types/trading";
import { LinkTradesDialog } from "./LinkTradesDialog";

interface Props { trade: Trade }

function normalizeTV(raw: string): string {
  const url = raw.trim();
  const xMatch = url.match(/tradingview\.com\/x\/([A-Za-z0-9]+)/i);
  if (xMatch) return `https://s3.tradingview.com/snapshots/${xMatch[1][0].toLowerCase()}/${xMatch[1]}.png`;
  return url;
}

export function TradeJournalPanel({ trade }: Props) {
  const { updateTrade, allTrades } = useTrading();
  const [notes, setNotes] = useState(trade.journalNotes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [links, setLinks] = useState<string[]>(trade.tradingviewLinks || []);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  useEffect(() => {
    setNotes(trade.journalNotes || "");
    setLinks(trade.tradingviewLinks || []);
  }, [trade.id]);

  const groupCount = trade.linkedGroupId
    ? allTrades.filter((t) => t.linkedGroupId === trade.linkedGroupId).length
    : 0;

  async function saveNotes() {
    setSavingNotes(true);
    await updateTrade(trade.id, { journalNotes: notes });
    setSavingNotes(false);
    toast.success("Journal saved");
  }

  async function addLink() {
    if (!linkInput.trim()) return;
    const next = [...links, normalizeTV(linkInput)];
    setLinks(next);
    setLinkInput("");
    await updateTrade(trade.id, { tradingviewLinks: next });
  }

  async function removeLink(i: number) {
    const next = links.filter((_, idx) => idx !== i);
    setLinks(next);
    await updateTrade(trade.id, { tradingviewLinks: next });
  }

  return (
    <div className="space-y-4">
      {/* Link trades */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" /> Linked Position
          </h3>
          <Button size="sm" variant="outline" onClick={() => setLinkDialogOpen(true)}>
            {groupCount > 0 ? `Manage (${groupCount})` : "Link partial fills"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {groupCount > 0
            ? `This trade is part of a group of ${groupCount} fills on ${trade.asset}.`
            : `Did you scale in/out of ${trade.asset}? Link other fills here to treat them as one position.`}
        </p>
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

      {/* Long-form journal */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">📝 Trade Journal</h3>
          <Button size="sm" variant="outline" onClick={saveNotes} disabled={savingNotes} className="gap-1">
            <Save className="h-3.5 w-3.5" /> {savingNotes ? "Saving..." : "Save"}
          </Button>
        </div>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write freely — context, emotions, what went right, what to fix next time. This stays attached to this trade."
          className="min-h-[200px] resize-y text-sm leading-relaxed"
        />
      </div>

      <LinkTradesDialog trade={trade} open={linkDialogOpen} onOpenChange={setLinkDialogOpen} />
    </div>
  );
}
