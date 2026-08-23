import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import { useTrading } from "@/contexts/TradingContext";
import { format } from "date-fns";

export function CashFlowDialog() {
  const { accounts, cashFlows } = useTrading();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8">
          <Wallet className="h-3.5 w-3.5 mr-2" />
          Deposits / Withdrawals
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Cash Flows</DialogTitle>
          <DialogDescription className="text-xs">
            Deposits and withdrawals are imported automatically from your broker feed — they can't be added by hand.
          </DialogDescription>
        </DialogHeader>

        {cashFlows.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            No deposits or withdrawals synced yet.
          </p>
        ) : (
          <div className="space-y-1.5 max-h-96 overflow-auto">
            {[...cashFlows].sort((a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt)).map((f) => {
              const acc = accounts.find((a) => a.id === f.accountId);
              const sym = acc?.currency === "EUR" ? "€" : acc?.currency === "GBP" ? "£" : "$";
              return (
                <div key={f.id} className="flex items-center gap-2 p-2 rounded-md border border-border/40 bg-secondary/20 text-xs">
                  {f.flowType === "deposit"
                    ? <ArrowDownLeft className="h-3.5 w-3.5 text-profit shrink-0" />
                    : <ArrowUpRight className="h-3.5 w-3.5 text-loss shrink-0" />}
                  <div className="min-w-0">
                    <div className="font-medium truncate">{acc?.name || "—"} · {sym}{f.amount.toFixed(2)}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {format(new Date(f.occurredAt), "MMM d, yyyy")} · {f.source}
                      {f.note ? ` · ${f.note}` : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
