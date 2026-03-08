import { useState } from "react";
import { useTrading } from "@/contexts/TradingContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, TrendingUp, CircleDot, Award } from "lucide-react";
import { toast } from "sonner";
import type { AccountType, Currency } from "@/types/trading";

export function CreateAccountDialog() {
  const { addAccount } = useTrading();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("demo");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [balance, setBalance] = useState(10000);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Account name required"); return; }
    setLoading(true);
    await addAccount({ name: name.trim(), type, currency, balance, initialBalance: balance });
    toast.success(`Account "${name}" created!`);
    setName("");
    setType("demo");
    setBalance(10000);
    setLoading(false);
    setOpen(false);
  };

  const typeOptions = [
    { value: "demo" as const, label: "Demo", icon: CircleDot, desc: "Practice account" },
    { value: "live" as const, label: "Live", icon: TrendingUp, desc: "Real money" },
    { value: "funded" as const, label: "Funded", icon: Award, desc: "Prop firm" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full gap-2 border-dashed border-primary/20 text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all">
          <Plus className="h-3.5 w-3.5" />
          New Account
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card border-primary/15 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider text-sm">CREATE ACCOUNT</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Account Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. FTMO Challenge" className="bg-secondary/50 border-border/50 focus:border-primary/50" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs transition-all duration-200 ${
                    type === opt.value
                      ? "border-primary/30 bg-primary/10 text-primary shadow-[0_0_10px_hsl(var(--primary)/0.08)]"
                      : "border-border/30 bg-secondary/30 text-muted-foreground hover:border-primary/15"
                  }`}
                >
                  <opt.icon className="h-4 w-4" />
                  <span className="font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Currency</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Starting Balance</Label>
              <Input type="number" min={0} value={balance} onChange={(e) => setBalance(Number(e.target.value))} className="bg-secondary/50 border-border/50 font-mono-numbers" />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full gap-2 font-semibold tracking-wider">
            {loading ? "Creating..." : "Initialize Account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
