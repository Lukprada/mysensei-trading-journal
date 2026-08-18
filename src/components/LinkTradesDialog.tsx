import { useState } from "react";
import { useTrading } from "@/contexts/TradingContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Link2, Unlink } from "lucide-react";
import type { Trade } from "@/types/trading";

interface Props {
  trade: Trade;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LinkTradesDialog({ trade, open, onOpenChange }: Props) {
  const { allTrades, linkTrades, unlinkTrade } = useTrading();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Suggestions: same account, symbol and direction, closed within six hours.
  const tradeTime = new Date(trade.exitTime || `${trade.date}T12:00:00`).getTime();
  const suggestionWindow = 6 * 60 * 60 * 1000;
  const candidates = allTrades.filter((t) =>
    t.id !== trade.id &&
    t.accountId === trade.accountId &&
    t.asset === trade.asset &&
    t.direction === trade.direction &&
    (!t.linkedGroupId || t.linkedGroupId === trade.linkedGroupId) &&
    Math.abs(new Date(t.exitTime || `${t.date}T12:00:00`).getTime() - tradeTime) <= suggestionWindow
  );

  // Already linked group members
  const groupMembers = trade.linkedGroupId
    ? allTrades.filter((t) => t.linkedGroupId === trade.linkedGroupId && t.id !== trade.id)
    : [];

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }

  async function handleLink() {
    const ids = [trade.id, ...Array.from(selected)];
    if (groupMembers.length) groupMembers.forEach((m) => ids.push(m.id));
    await linkTrades(Array.from(new Set(ids)));
    setSelected(new Set());
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-primary/15 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider text-sm">LINK TRADES INTO ONE POSITION</DialogTitle>
          <DialogDescription className="text-xs">
            Group partial fills (e.g. several 0.1 lots on {trade.asset}) so they show up as one position with combined P&L.
          </DialogDescription>
        </DialogHeader>

        {groupMembers.length > 0 && (
          <div className="text-xs space-y-2 border border-primary/20 rounded-md p-3 bg-primary/5">
             <p className="font-medium text-primary">Already linked ({groupMembers.length + 1} trades)</p>
            {groupMembers.map((m) => (
              <div key={m.id} className="flex items-center justify-between">
                <span className="font-mono-numbers">{m.date} · {m.positionSize} lots · {m.pnl >= 0 ? "+" : ""}${m.pnl.toFixed(2)}</span>
                <Button size="sm" variant="ghost" className="h-7 text-loss" onClick={() => unlinkTrade(m.id)}>
                  <Unlink className="h-3 w-3 mr-1" /> Unlink
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2 mt-2">
          <p className="text-xs text-muted-foreground">Suggested {trade.asset} fills closed within 6 hours:</p>
          {candidates.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No other trades match.</p>
          ) : (
            candidates.map((c) => {
              const inGroup = c.linkedGroupId && c.linkedGroupId === trade.linkedGroupId;
              return (
                <label key={c.id} className={`flex items-center gap-3 p-2 rounded-md border cursor-pointer transition-colors ${
                  selected.has(c.id) ? "border-primary/40 bg-primary/5" : "border-border/40 hover:bg-muted/40"
                } ${inGroup ? "opacity-50" : ""}`}>
                  <Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggle(c.id)} disabled={!!inGroup} />
                  <div className="flex-1 text-sm flex items-center justify-between font-mono-numbers">
                    <span>{c.date} · {c.direction} · {c.positionSize} lots</span>
                    <span className={c.pnl >= 0 ? "text-profit" : "text-loss"}>
                      {c.pnl >= 0 ? "+" : ""}${c.pnl.toFixed(2)}
                    </span>
                  </div>
                </label>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleLink} disabled={selected.size === 0} className="gap-2">
            <Link2 className="h-4 w-4" /> Link {selected.size > 0 ? `(${selected.size + 1})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
