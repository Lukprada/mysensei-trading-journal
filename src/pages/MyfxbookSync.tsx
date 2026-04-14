import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Link2, Trash2, CheckCircle2, AlertCircle, Clock, Upload, Info, ExternalLink } from "lucide-react";

interface CSVTrade {
  openTime: string;
  closeTime: string;
  symbol: string;
  action: string;
  lots: number;
  openPrice: number;
  closePrice: number;
  pips: number;
  profit: number;
  comment: string;
}

function parseMyfxbookCSV(text: string): CSVTrade[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));

  const findCol = (names: string[]) =>
    header.findIndex((h) => names.some((n) => h.includes(n)));

  const colOpen = findCol(["open date", "open time"]);
  const colClose = findCol(["close date", "close time"]);
  const colSymbol = findCol(["symbol", "pair"]);
  const colAction = findCol(["action", "type"]);
  const colLots = findCol(["lots", "size", "volume"]);
  const colOpenPrice = findCol(["open price"]);
  const colClosePrice = findCol(["close price"]);
  const colPips = findCol(["pips"]);
  const colProfit = findCol(["profit"]);
  const colComment = findCol(["comment"]);

  const trades: CSVTrade[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/"/g, ""));
    if (cols.length < 5) continue;

    trades.push({
      openTime: cols[colOpen] || "",
      closeTime: cols[colClose] || "",
      symbol: cols[colSymbol] || "UNKNOWN",
      action: cols[colAction] || "",
      lots: parseFloat(cols[colLots]) || 0.01,
      openPrice: parseFloat(cols[colOpenPrice]) || 0,
      closePrice: parseFloat(cols[colClosePrice]) || 0,
      pips: parseFloat(cols[colPips]) || 0,
      profit: parseFloat(cols[colProfit]) || 0,
      comment: cols[colComment] || "",
    });
  }

  return trades;
}

export default function MyfxbookSync() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) loadCredentials();
  }, [user]);

  async function loadCredentials() {
    setLoading(true);
    const { data } = await supabase
      .from("myfxbook_credentials")
      .select("email, last_synced_at")
      .eq("user_id", user!.id)
      .single();

    if (data) {
      setHasCredentials(true);
      setEmail(data.email);
      setLastSynced(data.last_synced_at);
    }
    setLoading(false);
  }

  async function handleSaveCredentials() {
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }
    setSaving(true);
    try {
      if (hasCredentials) {
        const { error } = await supabase
          .from("myfxbook_credentials")
          .update({ email, password, updated_at: new Date().toISOString() })
          .eq("user_id", user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("myfxbook_credentials")
          .insert({ user_id: user!.id, email, password });
        if (error) throw error;
      }
      setHasCredentials(true);
      setPassword("");
      toast.success("Credentials saved securely");
    } catch (err: any) {
      toast.error("Failed to save credentials");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("sync-myfxbook", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: { action: "sync" },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSyncResult(data);
      setLastSynced(new Date().toISOString());
      toast.success(`Synced ${data.tradesImported} trades from ${data.totalAccounts} account(s)`);
    } catch (err: any) {
      toast.error(err.message || "Sync failed");
      console.error(err);
    } finally {
      setSyncing(false);
    }
  }

  async function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const trades = parseMyfxbookCSV(text);

      if (trades.length === 0) {
        toast.error("No trades found in the CSV. Make sure it's a valid Myfxbook export.");
        return;
      }

      // Get or create a default account for CSV imports
      let accountId: string;
      const { data: existingAcc } = await supabase
        .from("accounts")
        .select("id")
        .eq("user_id", user!.id)
        .eq("name", "Myfxbook CSV Import")
        .single();

      if (existingAcc) {
        accountId = existingAcc.id;
      } else {
        const { data: newAcc, error: accErr } = await supabase
          .from("accounts")
          .insert({
            user_id: user!.id,
            name: "Myfxbook CSV Import",
            type: "live",
            currency: "USD",
            balance: 0,
            initial_balance: 0,
          })
          .select("id")
          .single();

        if (accErr || !newAcc) throw new Error("Failed to create account for CSV import");
        accountId = newAcc.id;
      }

      let imported = 0;
      let skipped = 0;

      for (const trade of trades) {
        const externalId = `csv_${trade.openTime}_${trade.symbol}_${trade.openPrice}`;

        // Check for duplicate
        const { data: existing } = await supabase
          .from("trades")
          .select("id")
          .eq("external_id", externalId)
          .single();

        if (existing) {
          skipped++;
          continue;
        }

        const direction = trade.action?.toLowerCase().includes("buy") ? "long" : "short";
        const closeDate = trade.closeTime
          ? new Date(trade.closeTime).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];

        const { error: insertErr } = await supabase.from("trades").insert({
          user_id: user!.id,
          account_id: accountId,
          asset: trade.symbol.replace(/[^A-Za-z0-9]/g, "") || "UNKNOWN",
          entry_price: trade.openPrice || 0,
          exit_price: trade.closePrice || 0,
          direction,
          position_size: trade.lots || 0.01,
          date: closeDate,
          pips: trade.pips || 0,
          pnl: trade.profit || 0,
          mental_state: "confident",
          notes: trade.comment || "",
          source: "myfxbook_csv",
          external_id: externalId,
        });

        if (insertErr) {
          console.error("Failed to insert CSV trade:", insertErr);
        } else {
          imported++;
        }
      }

      setImportResult({ imported, skipped });
      toast.success(`Imported ${imported} trades (${skipped} duplicates skipped)`);
    } catch (err: any) {
      toast.error(err.message || "CSV import failed");
      console.error(err);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDisconnect() {
    const { error } = await supabase
      .from("myfxbook_credentials")
      .delete()
      .eq("user_id", user!.id);

    if (error) {
      toast.error("Failed to disconnect");
      return;
    }
    setHasCredentials(false);
    setEmail("");
    setPassword("");
    setLastSynced(null);
    setSyncResult(null);
    toast.success("Myfxbook disconnected");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Myfxbook Sync</h1>
        <p className="text-muted-foreground mt-1">
          Connect your Myfxbook account to automatically import your trades
        </p>
      </div>

      {/* Google Sign-In Help Note */}
      <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div className="space-y-1 text-sm">
          <p className="font-medium text-foreground">
            Sign in to Myfxbook with Google?
          </p>
          <p className="text-muted-foreground">
            If you use "Continue with Google" on Myfxbook, you'll need to set a password first. 
            Go to{" "}
            <a
              href="https://www.myfxbook.com/settings"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 inline-flex items-center gap-1"
            >
              Myfxbook Settings <ExternalLink className="h-3 w-3" />
            </a>{" "}
            → Change Password, then use those credentials here. Alternatively, you can use the CSV import below.
          </p>
        </div>
      </div>

      {/* Credentials Card */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link2 className="h-5 w-5 text-primary" />
            {hasCredentials ? "Account Connected" : "Connect Myfxbook"}
          </CardTitle>
          <CardDescription>
            {hasCredentials
              ? "Your Myfxbook credentials are saved. You can update them or sync your trades."
              : "Enter your Myfxbook email and password to get started. Your credentials are stored securely and only accessible by you."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mfx-email">Myfxbook Email</Label>
            <Input
              id="mfx-email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mfx-password">
              Myfxbook Password {hasCredentials && "(leave blank to keep current)"}
            </Label>
            <Input
              id="mfx-password"
              type="password"
              placeholder={hasCredentials ? "••••••••" : "Enter password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSaveCredentials} disabled={saving}>
              {saving ? "Saving..." : hasCredentials ? "Update Credentials" : "Save & Connect"}
            </Button>
            {hasCredentials && (
              <Button variant="destructive" size="icon" onClick={handleDisconnect}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sync Card */}
      {hasCredentials && (
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <RefreshCw className="h-5 w-5 text-primary" />
              Sync Trades
            </CardTitle>
            <CardDescription>
              Import your latest trades from Myfxbook. The API provides the last 50 closed trades per account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lastSynced && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Last synced: {new Date(lastSynced).toLocaleString()}
              </div>
            )}

            <Button onClick={handleSync} disabled={syncing} className="w-full">
              {syncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </>
              )}
            </Button>

            {syncResult && (
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-green-500">
                  <CheckCircle2 className="h-4 w-4" />
                  Sync Complete
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                  <li>Accounts found: {syncResult.totalAccounts}</li>
                  <li>New trades imported: {syncResult.tradesImported}</li>
                  {syncResult.accounts?.map((name: string, i: number) => (
                    <li key={i}>• {name}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/20 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Myfxbook API returns only the last 50 closed trades per account. 
                Duplicates are automatically detected and skipped. Sync regularly to keep your journal up to date.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CSV Import Card */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="h-5 w-5 text-primary" />
            CSV Import (Alternative)
          </CardTitle>
          <CardDescription>
            Can't use the API? Export your trade history from Myfxbook as CSV and upload it here instead.
            This works for everyone — including Google Sign-In users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              To export: Go to your{" "}
              <a
                href="https://www.myfxbook.com/statements"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 inline-flex items-center gap-1"
              >
                Myfxbook Statements <ExternalLink className="h-3 w-3" />
              </a>{" "}
              → Select your account → Click "Export" → Choose CSV.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleCSVImport}
            className="hidden"
          />

          <Button
            variant="outline"
            className="w-full"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
          >
            {importing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Myfxbook CSV
              </>
            )}
          </Button>

          {importResult && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-green-500">
                <CheckCircle2 className="h-4 w-4" />
                CSV Import Complete
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>New trades imported: {importResult.imported}</li>
                <li>Duplicates skipped: {importResult.skipped}</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
