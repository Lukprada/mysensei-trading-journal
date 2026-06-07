import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownLeft, ArrowUpRight, Trash2, Wallet } from "lucide-react";
import { useTrading } from "@/contexts/TradingContext";
import { toast } from "sonner";
import { format } from "date-fns";

export function CashFlowDialog() {
  const { accounts, activeAccountId, cashFlows, addCashFlow, deleteCashFlow } = useTrading();
  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState<string>(activeAccountId || accounts[0]?.id || "");
  const [type, setType] = useState<"deposit" | "withdrawal">("deposit");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const amt = parseFloat(amount);
    if (!accountId) return toast.error("Pick an account");
    if (!amt || amt <= 0) return toast.error("Enter a positive amount");
    setSaving(true);
    await addCashFlow({
      accountId,
      flowType: type,
      amount: amt,
      occurredAt: new Date(date).toISOString(),
      source: "manual",
      note: note || undefined,
    });
    setSaving(false);
    setAmount("");
    setNote("");
    toast.success(`${type === "deposit" ? "Deposit" : "Withdrawal"} logged`);
  };

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
        </DialogHeader>

        <Tabs defaultValue="add">
          <TabsList className="w-full">
            <TabsTrigger value="add" className="flex-1">Add</TabsTrigger>
            <TabsTrigger value="history" className="flex-1">History ({cashFlows.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="space-y-3 pt-3">
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant={type === "deposit" ? "default" : "outline"} onClick={() => setType("deposit")} size="sm">
                <ArrowDownLeft className="h-4 w-4 mr-2" /> Deposit
              </Button>
              <Button type="button" variant={type === "withdrawal" ? "default" : "outline"} onClick={() => setType("withdrawal")} size="sm">
                <ArrowUpRight className="h-4 w-4 mr-2" /> Withdrawal
              </Button>
            </div>

            <div>
              <Label className="text-xs">Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name} ({a.currency})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Amount</Label>
                <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100.00" />
              </div>
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>

            <div>
              <Label className="text-xs">Note (optional)</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="e.g. Initial funding" />
            </div>

            <DialogFooter>
              <Button onClick={submit} disabled={saving} className="w-full">
                {saving ? "Saving..." : `Log ${type}`}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="history" className="pt-3">
            {cashFlows.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No deposits or withdrawals yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-80 overflow-auto">
                {[...cashFlows].sort((a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt)).map((f) => {
                  const acc = accounts.find((a) => a.id === f.accountId);
                  const sym = acc?.currency === "EUR" ? "€" : acc?.currency === "GBP" ? "£" : "$";
                  return (
                    <div key={f.id} className="flex items-center justify-between gap-2 p-2 rounded-md border border-border/40 bg-secondary/20 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
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
                      <button onClick={() => deleteCashFlow(f.id)} className="text-muted-foreground hover:text-loss p-1">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
