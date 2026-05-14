import { useState, useCallback, useMemo } from "react";
import { useTrading } from "@/contexts/TradingContext";
import { useNavigate } from "react-router-dom";
import { COMMON_ASSETS, SETUP_TAGS, calculatePlannedRR, type TradeFormData, type Direction, type MentalState, type SetupTag } from "@/types/trading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Upload, X, ArrowUpRight, ArrowDownRight, Loader2, Target, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const NewTrade = () => {
  const { addTrade, activeAccountId, accounts, uploadScreenshot } = useTrading();
  const navigate = useNavigate();

  const [form, setForm] = useState<TradeFormData>({
    asset: "EURUSD",
    entryPrice: 0,
    exitPrice: 0,
    direction: "long",
    positionSize: 1,
    date: new Date().toISOString().split("T")[0],
    mentalState: "confident",
    notes: "",
    stopLoss: undefined,
    takeProfit: undefined,
    setupTag: undefined,
    rulesFollowed: undefined,
    riskAmount: undefined,
  });

  const plannedRR = useMemo(
    () => calculatePlannedRR(form.entryPrice, form.stopLoss, form.takeProfit, form.direction),
    [form.entryPrice, form.stopLoss, form.takeProfit, form.direction]
  );

  const [dragOver, setDragOver] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    const url = await uploadScreenshot(file);
    if (url) {
      setScreenshot(url);
      toast.success("Screenshot uploaded!");
    }
    setUploading(false);
  }, [uploadScreenshot]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccountId && accounts.length > 0) {
      toast.error("Please select an account first");
      return;
    }
    if (accounts.length === 0) {
      toast.error("Create an account first from the sidebar");
      return;
    }
    if (form.entryPrice <= 0 || form.exitPrice <= 0) {
      toast.error("Prices must be greater than 0");
      return;
    }
    setSubmitting(true);
    await addTrade({ ...form, screenshotUrl: screenshot || undefined });
    toast.success("Trade logged successfully!");
    setSubmitting(false);
    navigate("/trade-log");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-semibold text-foreground mb-1">Log New Trade</h2>
        <p className="text-sm text-muted-foreground mb-6">Record your trade details for analysis</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Asset & Direction */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Asset</Label>
              <Select value={form.asset} onValueChange={(v) => setForm((f) => ({ ...f, asset: v }))}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COMMON_ASSETS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Direction</Label>
              <div className="flex gap-2">
                {(["long", "short"] as Direction[]).map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, direction: dir }))}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md border text-sm font-medium transition-all ${
                      form.direction === dir
                        ? dir === "long"
                          ? "border-profit bg-profit/10 text-profit"
                          : "border-loss bg-loss/10 text-loss"
                        : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {dir === "long" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {dir.charAt(0).toUpperCase() + dir.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Entry Price</Label>
              <Input type="number" step="any" className="bg-secondary border-border font-mono-numbers"
                value={form.entryPrice || ""} onChange={(e) => setForm((f) => ({ ...f, entryPrice: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Exit Price</Label>
              <Input type="number" step="any" className="bg-secondary border-border font-mono-numbers"
                value={form.exitPrice || ""} onChange={(e) => setForm((f) => ({ ...f, exitPrice: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Lot Size</Label>
              <Input type="number" step="0.01" min="0.01" className="bg-secondary border-border font-mono-numbers"
                value={form.positionSize || ""} onChange={(e) => setForm((f) => ({ ...f, positionSize: parseFloat(e.target.value) || 0 }))} />
            </div>
          </div>

          {/* Date & Mental State */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Date</Label>
              <Input type="date" className="bg-secondary border-border"
                value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Mental State</Label>
              <Select value={form.mentalState} onValueChange={(v) => setForm((f) => ({ ...f, mentalState: v as MentalState }))}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="confident">😎 Confident</SelectItem>
                  <SelectItem value="anxious">😰 Anxious</SelectItem>
                  <SelectItem value="impulsive">⚡ Impulsive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Screenshot */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Chart Screenshot</Label>
            {uploading ? (
              <div className="flex items-center justify-center h-32 rounded-lg border-2 border-dashed border-primary bg-primary/5">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
              </div>
            ) : screenshot ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img src={screenshot} alt="Chart" className="w-full h-48 object-cover" />
                <button type="button" onClick={() => setScreenshot(null)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center h-32 rounded-lg border-2 border-dashed transition-colors cursor-pointer ${
                  dragOver ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                }`}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleFileUpload(file);
                  };
                  input.click();
                }}
              >
                <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
                <p className="text-xs text-muted-foreground mt-1">Screenshots saved to cloud</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Notes</Label>
            <Textarea className="bg-secondary border-border min-h-[100px] resize-none"
              placeholder="What was your reasoning? What did you learn?"
              value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>

          <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : "Log Trade"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default NewTrade;
