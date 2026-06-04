import { useState } from "react";
import { useTrading } from "@/contexts/TradingContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings2, Trash2, TrendingUp, CircleDot, Award, Check, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import type { Account, AccountType } from "@/types/trading";

const typeOptions: { value: AccountType; label: string; icon: typeof TrendingUp }[] = [
  { value: "demo", label: "Demo", icon: CircleDot },
  { value: "live", label: "Live", icon: TrendingUp },
  { value: "funded", label: "Funded", icon: Award },
];

function AccountRow({ account, tradeCount }: { account: Account; tradeCount: number }) {
  const { updateAccount, deleteAccount } = useTrading();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(account.name);
  const [type, setType] = useState<AccountType>(account.type);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) { toast.error("Name required"); return; }
    setSaving(true);
    await updateAccount(account.id, { name: name.trim(), type });
    setSaving(false);
    setEditing(false);
    toast.success("Account updated");
  }

  async function handleDelete() {
    await deleteAccount(account.id);
    toast.success(`Removed "${account.name}"`);
    setConfirmOpen(false);
  }

  const TypeIcon = typeOptions.find((t) => t.value === account.type)?.icon || CircleDot;

  return (
    <div className="rounded-lg border border-border/40 bg-secondary/30 p-3 space-y-3">
      {editing ? (
        <>
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-background/60 h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Type</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={`flex items-center justify-center gap-1 py-1.5 rounded-md border text-xs transition-all ${
                    type === opt.value
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/30 bg-background/40 text-muted-foreground hover:border-primary/20"
                  }`}
                >
                  <opt.icon className="h-3 w-3" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving} className="flex-1 gap-1.5">
              <Check className="h-3.5 w-3.5" /> Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setName(account.name); setType(account.type); }} className="gap-1.5">
              <X className="h-3.5 w-3.5" /> Cancel
            </Button>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <TypeIcon className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{account.name}</div>
              <div className="text-[11px] text-muted-foreground font-mono-numbers">
                {account.type.toUpperCase()} · {account.currency} · {tradeCount} trade{tradeCount === 1 ? "" : "s"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-loss hover:text-loss hover:bg-loss/10" onClick={() => setConfirmOpen(true)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{account.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the account and all {tradeCount} trade{tradeCount === 1 ? "" : "s"} associated with it. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-loss text-white hover:bg-loss/90">
              Delete account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function ManageAccountsDialog() {
  const { accounts, allTrades } = useTrading();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full gap-2 text-[11px] text-muted-foreground hover:text-primary justify-center">
          <Settings2 className="h-3 w-3" />
          Manage Accounts
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card border-primary/15 sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider text-sm">MANAGE ACCOUNTS</DialogTitle>
          <DialogDescription className="text-xs">
            Rename, retag as Live/Demo/Funded, or remove accounts. Deleting an account also removes its trades.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          {accounts.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">No accounts yet.</div>
          ) : (
            accounts.map((acc) => (
              <AccountRow key={acc.id} account={acc} tradeCount={allTrades.filter((t) => t.accountId === acc.id).length} />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
