import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MYFXBOOK_API = "https://www.myfxbook.com/api";

interface MyfxbookAccount {
  id: number;
  name: string;
  balance: number;
  equity: number;
  profit: number;
  currency: string;
}

interface MyfxbookTrade {
  openTime: string;
  closeTime: string;
  symbol: string;
  action: string;
  sizing: { value: number };
  openPrice: number;
  closePrice: number;
  tp: number;
  sl: number;
  pips: number;
  profit: number;
  comment: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: userError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action } = await req.json();

    if (action === "save-credentials") {
      const { email, password } = await req.json().catch(() => ({}));
      // Credentials are saved client-side via supabase SDK, this endpoint just tests login
    }

    // 1. Get user's Myfxbook credentials
    const { data: creds, error: credsError } = await supabase
      .from("myfxbook_credentials")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (credsError || !creds) {
      return new Response(JSON.stringify({ error: "No Myfxbook credentials found. Please add your credentials first." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Login to Myfxbook API
    console.log("Logging into Myfxbook...");
    const loginUrl = `${MYFXBOOK_API}/login.json?email=${encodeURIComponent(creds.email)}&password=${encodeURIComponent(creds.password)}`;
    const loginRes = await fetch(loginUrl);
    const loginData = await loginRes.json();

    if (loginData.error === true) {
      return new Response(JSON.stringify({ error: `Myfxbook login failed: ${loginData.message}` }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const session = loginData.session;
    console.log("Myfxbook login successful");

    // Save session token
    await supabase
      .from("myfxbook_credentials")
      .update({ session_token: session, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    // 3. Get Myfxbook accounts
    const accountsUrl = `${MYFXBOOK_API}/get-my-accounts.json?session=${session}`;
    const accountsRes = await fetch(accountsUrl);
    const accountsData = await accountsRes.json();

    if (accountsData.error === true) {
      return new Response(JSON.stringify({ error: `Failed to get accounts: ${accountsData.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const myfxbookAccounts: MyfxbookAccount[] = accountsData.accounts || [];
    console.log(`Found ${myfxbookAccounts.length} Myfxbook accounts`);

    let totalTradesSynced = 0;
    const syncedAccounts: string[] = [];

    for (const mfxAcc of myfxbookAccounts) {
      // 4. Upsert account in our DB
      const { data: existingAcc } = await supabase
        .from("accounts")
        .select("id")
        .eq("user_id", user.id)
        .eq("myfxbook_account_id", String(mfxAcc.id))
        .single();

      let accountId: string;

      if (existingAcc) {
        accountId = existingAcc.id;
        // Update balance
        await supabase
          .from("accounts")
          .update({ balance: mfxAcc.balance })
          .eq("id", accountId);
      } else {
        // Create new account
        const { data: newAcc, error: newAccError } = await supabase
          .from("accounts")
          .insert({
            user_id: user.id,
            name: mfxAcc.name || `Myfxbook ${mfxAcc.id}`,
            type: "live",
            currency: mfxAcc.currency || "USD",
            balance: mfxAcc.balance,
            initial_balance: mfxAcc.balance - (mfxAcc.profit || 0),
            myfxbook_account_id: String(mfxAcc.id),
          })
          .select("id")
          .single();

        if (newAccError) {
          console.error(`Failed to create account for ${mfxAcc.id}:`, newAccError);
          continue;
        }
        accountId = newAcc.id;
      }

      // 5. Fetch trade history (limited to last 50 by API)
      const historyUrl = `${MYFXBOOK_API}/get-history.json?session=${session}&id=${mfxAcc.id}`;
      const historyRes = await fetch(historyUrl);
      const historyData = await historyRes.json();

      if (historyData.error === true) {
        console.error(`Failed to get history for account ${mfxAcc.id}:`, historyData.message);
        continue;
      }

      const trades: MyfxbookTrade[] = historyData.history || [];
      console.log(`Account ${mfxAcc.name}: ${trades.length} trades`);

      for (const trade of trades) {
        // Use a composite external_id to prevent duplicates
        const externalId = `mfxb_${mfxAcc.id}_${trade.openTime}_${trade.symbol}_${trade.openPrice}`;

        // Check if trade already exists
        const { data: existing } = await supabase
          .from("trades")
          .select("id")
          .eq("external_id", externalId)
          .single();

        if (existing) continue; // Skip duplicates

        const direction = trade.action?.toLowerCase().includes("buy") ? "long" : "short";
        const closeDate = trade.closeTime ? new Date(trade.closeTime).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];

        const { error: insertError } = await supabase
          .from("trades")
          .insert({
            user_id: user.id,
            account_id: accountId,
            asset: trade.symbol?.replace(/[^A-Za-z0-9]/g, "") || "UNKNOWN",
            entry_price: trade.openPrice || 0,
            exit_price: trade.closePrice || 0,
            direction,
            position_size: trade.sizing?.value || 0.01,
            date: closeDate,
            pips: trade.pips || 0,
            pnl: trade.profit || 0,
            mental_state: "confident",
            notes: trade.comment || "",
            source: "myfxbook",
            external_id: externalId,
            stop_loss: trade.sl && trade.sl > 0 ? trade.sl : null,
            take_profit: trade.tp && trade.tp > 0 ? trade.tp : null,
            exit_time: trade.closeTime ? new Date(trade.closeTime).toISOString() : null,
          });

        if (insertError) {
          console.error("Failed to insert trade:", insertError);
        } else {
          totalTradesSynced++;
        }
      }

      syncedAccounts.push(mfxAcc.name || `Account ${mfxAcc.id}`);
    }

    // Update last synced timestamp
    await supabase
      .from("myfxbook_credentials")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("user_id", user.id);

    // 6. Logout from Myfxbook
    await fetch(`${MYFXBOOK_API}/logout.json?session=${session}`).catch(() => {});

    return new Response(JSON.stringify({
      success: true,
      accounts: syncedAccounts,
      tradesImported: totalTradesSynced,
      totalAccounts: myfxbookAccounts.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Sync failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
