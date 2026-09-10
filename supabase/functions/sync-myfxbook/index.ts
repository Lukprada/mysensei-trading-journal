import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MYFXBOOK_API = "https://www.myfxbook.com/api";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let session: string | null = null;

  try {
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

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: userError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Body is optional — never let a missing/invalid body crash the sync.
    await req.json().catch(() => ({}));

    const { data: creds, error: credsError } = await supabase
      .from("myfxbook_credentials")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (credsError || !creds) {
      return new Response(JSON.stringify({ error: "No Myfxbook credentials found. Please add your credentials first." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Logging into Myfxbook...");
    const loginRes = await fetch(
      `${MYFXBOOK_API}/login.json?email=${encodeURIComponent(creds.email.trim())}&password=${encodeURIComponent(creds.password.trim())}`,
    );
    const loginData = await loginRes.json();

    if (loginData.error === true) {
      return new Response(JSON.stringify({ error: `Myfxbook login failed: ${loginData.message}` }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    session = loginData.session;
    console.log("Myfxbook login successful");

    await supabase
      .from("myfxbook_credentials")
      .update({ session_token: session, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    const accountsRes = await fetch(`${MYFXBOOK_API}/get-my-accounts.json?session=${session}`);
    const accountsData = await accountsRes.json();

    if (accountsData.error === true) {
      return new Response(JSON.stringify({ error: `Failed to get accounts: ${accountsData.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const myfxbookAccounts = accountsData.accounts || [];
    console.log(`Found ${myfxbookAccounts.length} Myfxbook accounts`);

    let totalTradesSynced = 0;
    const syncedAccounts: string[] = [];
    let latestTradeAt: string | null = null;

    for (const mfxAcc of myfxbookAccounts) {
      const { data: existingAcc } = await supabase
        .from("accounts")
        .select("id")
        .eq("user_id", user.id)
        .eq("myfxbook_account_id", String(mfxAcc.id))
        .maybeSingle();

      let accountId: string;

      if (existingAcc) {
        accountId = existingAcc.id;
        await supabase.from("accounts").update({ balance: mfxAcc.balance }).eq("id", accountId);
      } else {
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

        if (newAccError || !newAcc) {
          console.error(`Failed to create account for ${mfxAcc.id}:`, newAccError?.message);
          continue;
        }
        accountId = newAcc.id;
      }

      const historyRes = await fetch(`${MYFXBOOK_API}/get-history.json?session=${session}&id=${mfxAcc.id}`);
      const historyData = await historyRes.json();
      if (historyData.error === true) {
        console.error(`Failed to get history for account ${mfxAcc.id}:`, historyData.message);
        continue;
      }

      const trades = historyData.history || [];
      console.log(`Account ${mfxAcc.name}: ${trades.length} trades`);

      const tradeRows: Record<string, unknown>[] = [];
      const cashRows: Record<string, unknown>[] = [];

      for (const trade of trades) {
        const tradeTimestamp = trade.closeTime || trade.openTime;
        if (tradeTimestamp) {
          const parsed = new Date(tradeTimestamp).toISOString();
          if (!latestTradeAt || parsed > latestTradeAt) latestTradeAt = parsed;
        }

        const symbol = (trade.symbol || "").replace(/[^A-Za-z0-9]/g, "");
        const action = (trade.action || "").toLowerCase();
        const isBalanceEntry =
          !symbol ||
          action.includes("balance") ||
          action.includes("credit") ||
          action.includes("deposit") ||
          action.includes("withdraw") ||
          ((trade.openPrice || 0) === 0 && (trade.closePrice || 0) === 0);

        if (isBalanceEntry) {
          const amt = Number(trade.profit || 0);
          if (amt === 0) continue;
          const when = trade.closeTime || trade.openTime || new Date().toISOString();
          cashRows.push({
            user_id: user.id,
            account_id: accountId,
            flow_type: amt >= 0 ? "deposit" : "withdrawal",
            amount: Math.abs(amt),
            occurred_at: new Date(when).toISOString(),
            source: "myfxbook",
            external_id: `mfxb_bal_${mfxAcc.id}_${when}_${amt}`,
            note: trade.comment || action || "Balance entry",
          });
          continue;
        }

        tradeRows.push({
          user_id: user.id,
          account_id: accountId,
          asset: symbol,
          entry_price: trade.openPrice || 0,
          exit_price: trade.closePrice || 0,
          direction: action.includes("buy") ? "long" : "short",
          position_size: Number(trade.sizing?.value ?? 0),
          date: trade.closeTime
            ? new Date(trade.closeTime).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          pips: trade.pips || 0,
          pnl: trade.profit || 0,
          mental_state: "confident",
          notes: "",
          broker_comment: trade.comment || null,
          magic_number: trade.magic ? String(trade.magic) : null,
          commission: trade.commission || 0,
          swap: (trade.swap || 0) + (trade.interest || 0),
          source: "myfxbook",
          external_id: `mfxb_${mfxAcc.id}_${trade.openTime}_${symbol}_${trade.openPrice}`,
          stop_loss: trade.sl && trade.sl > 0 ? trade.sl : null,
          take_profit: trade.tp && trade.tp > 0 ? trade.tp : null,
          exit_time: trade.closeTime ? new Date(trade.closeTime).toISOString() : null,
        });
      }

      if (cashRows.length) {
        await supabase.from("cash_flows").upsert(cashRows, { onConflict: "external_id" });
      }

      if (tradeRows.length) {
        const ids = tradeRows.map((r) => r.external_id as string);
        const { data: existingTrades } = await supabase
          .from("trades")
          .select("external_id")
          .eq("user_id", user.id)
          .in("external_id", ids);
        const known = new Set((existingTrades || []).map((t: { external_id: string }) => t.external_id));
        const fresh = tradeRows.filter((r) => !known.has(r.external_id as string));
        if (fresh.length) {
          const { error: insertError } = await supabase.from("trades").insert(fresh);
          if (insertError) console.error("Failed to insert trades:", insertError.message);
          else totalTradesSynced += fresh.length;
        }
      }

      syncedAccounts.push(mfxAcc.name || `Account ${mfxAcc.id}`);
    }

    await supabase
      .from("myfxbook_credentials")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("user_id", user.id);

    return new Response(JSON.stringify({
      success: true,
      accounts: syncedAccounts,
      tradesImported: totalTradesSynced,
      totalAccounts: myfxbookAccounts.length,
      latestTradeAt,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Sync failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } finally {
    if (session) await fetch(`${MYFXBOOK_API}/logout.json?session=${session}`).catch(() => {});
  }
});
