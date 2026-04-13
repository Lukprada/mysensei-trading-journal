import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Link2, Trash2, CheckCircle2, AlertCircle, Clock } from "lucide-react";

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
    </div>
  );
}
