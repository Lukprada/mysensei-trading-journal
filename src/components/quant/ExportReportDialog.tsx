import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, Lock, Share2, Sparkles } from "lucide-react";
import { generateQuantPdf, ExportOptions } from "@/lib/exportPdf";
import { QuantMetrics } from "@/lib/quantMetrics";
import { Account } from "@/types/trading";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  metrics: QuantMetrics;
  account: Account | null;
  username: string;
}

export function ExportReportDialog({ open, onOpenChange, metrics, account, username }: Props) {
  const [mode, setMode] = useState<"private" | "shareable">("shareable");

  // Sanitization toggles (only meaningful in shareable mode)
  const [includeAccount, setIncludeAccount] = useState(false);
  const [includeDollarValues, setIncludeDollarValues] = useState(false);
  const [includeExtremes, setIncludeExtremes] = useState(false);
  const [includeStreaks, setIncludeStreaks] = useState(true);
  const [includeBehavior, setIncludeBehavior] = useState(true);

  function handleDownload() {
    const opts: ExportOptions = {
      mode,
      username,
      includeAccount: mode === "private" ? true : includeAccount,
      includeDollarValues: mode === "private" ? true : includeDollarValues,
      includeExtremes: mode === "private" ? true : includeExtremes,
      includeStreaks,
      includeBehavior,
    };
    try {
      const doc = generateQuantPdf(metrics, account, opts);
      const date = new Date().toISOString().split("T")[0];
      const label = mode === "private" ? "private" : "shareable";
      doc.save(`edge-report_${username || "trader"}_${label}_${date}.pdf`);
      toast.success("Report downloaded");
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card/95 backdrop-blur border-primary/30">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">
              EXPORT
            </Badge>
            <Badge variant="outline" className="border-primary/20 text-muted-foreground text-[10px]">
              PDF · CYBERPUNK
            </Badge>
          </div>
          <DialogTitle className="text-xl font-display tracking-[0.05em] text-gradient">
            Download Edge Report
          </DialogTitle>
          <DialogDescription>
            Pick a mode. Shareable strips personal data so you can post it without exposing your balance or broker.
          </DialogDescription>
        </DialogHeader>

        {/* Mode toggle */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          <button
            type="button"
            onClick={() => setMode("private")}
            className={`rounded-lg p-4 text-left border transition-all ${
              mode === "private"
                ? "border-primary bg-primary/10 shadow-[0_0_20px_-5px_hsl(var(--primary)/0.5)]"
                : "border-border/40 bg-background/40 hover:border-primary/30"
            }`}
          >
            <Lock className={`h-4 w-4 mb-2 ${mode === "private" ? "text-primary" : "text-muted-foreground"}`} />
            <div className="text-sm font-display tracking-wide font-semibold">Private Vault</div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Everything visible. Account, $ values, biggest win/loss. For your eyes.
            </div>
          </button>
          <button
            type="button"
            onClick={() => setMode("shareable")}
            className={`rounded-lg p-4 text-left border transition-all ${
              mode === "shareable"
                ? "border-primary bg-primary/10 shadow-[0_0_20px_-5px_hsl(var(--primary)/0.5)]"
                : "border-border/40 bg-background/40 hover:border-primary/30"
            }`}
          >
            <Share2 className={`h-4 w-4 mb-2 ${mode === "shareable" ? "text-primary" : "text-muted-foreground"}`} />
            <div className="text-sm font-display tracking-wide font-semibold">Shareable</div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Sanitized. Hides $ and account by default. Show your edge, not your wallet.
            </div>
          </button>
        </div>

        {/* Granular toggles — only for shareable */}
        {mode === "shareable" && (
          <div className="space-y-3 mt-4 rounded-lg border border-primary/15 bg-background/30 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-display">
                What to include
              </span>
            </div>
            <ToggleRow
              label="Account name & type"
              hint="Reveals broker name and Live/Demo/Funded."
              checked={includeAccount}
              onChange={setIncludeAccount}
            />
            <ToggleRow
              label="Dollar values ($)"
              hint="Off shows R-multiples & % only. Protects balance size."
              checked={includeDollarValues}
              onChange={setIncludeDollarValues}
            />
            <ToggleRow
              label="Largest win / loss"
              hint="Single-trade extremes can leak risk-per-trade."
              checked={includeExtremes}
              onChange={setIncludeExtremes}
            />
            <ToggleRow
              label="Streaks & CAGR"
              hint="Win/loss streaks and growth rate."
              checked={includeStreaks}
              onChange={setIncludeStreaks}
            />
            <ToggleRow
              label="Behavior & Discipline"
              hint="R-Expectancy, revenge trades, plan adherence."
              checked={includeBehavior}
              onChange={setIncludeBehavior}
            />
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" /> Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ToggleRow({
  label, hint, checked, onChange,
}: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <Label className="text-sm">{label}</Label>
        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
