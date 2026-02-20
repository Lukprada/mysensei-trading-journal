import { useTrading } from "@/contexts/TradingContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, CircleDot, Award } from "lucide-react";
import type { AccountType } from "@/types/trading";

const typeIcons: Record<AccountType, React.ReactNode> = {
  live: <TrendingUp className="h-3.5 w-3.5 text-profit" />,
  demo: <CircleDot className="h-3.5 w-3.5 text-muted-foreground" />,
  funded: <Award className="h-3.5 w-3.5 text-warning" />,
};

const typeLabels: Record<AccountType, string> = {
  live: "Live",
  demo: "Demo",
  funded: "Funded",
};

export function AccountSelector() {
  const { accounts, activeAccountId, setActiveAccount } = useTrading();

  return (
    <Select value={activeAccountId || "all"} onValueChange={(v) => setActiveAccount(v === "all" ? null : v)}>
      <SelectTrigger className="w-full bg-secondary border-border">
        <SelectValue placeholder="All Accounts" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          <span className="flex items-center gap-2">
            <CircleDot className="h-3.5 w-3.5" />
            Global (All Accounts)
          </span>
        </SelectItem>
        {accounts.map((acc) => (
          <SelectItem key={acc.id} value={acc.id}>
            <span className="flex items-center gap-2">
              {typeIcons[acc.type]}
              <span>{acc.name}</span>
              <span className="text-muted-foreground text-xs ml-1">({typeLabels[acc.type]})</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
