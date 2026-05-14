import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const MYFXBOOK_API = "https://www.myfxbook.com/api";

Deno.serve(async (req) => {
  // This function is called by pg_cron — no user auth needed
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get all users with myfxbook credentials
  const { data: allCreds, error: credsErr } = await supabase
    .from("myfxbook_credentials")
    .select("user_id, email, password");

  if (credsErr || !allCreds || allCreds.length === 0) {
    return new Response(JSON.stringify({ message: "No users to sync", error: credsErr?.message }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const results: { userId: string; trades: number; error?: string }[] = [];

  for (const creds of allCreds) {
    try {
      // Login
      const loginUrl = `${MYFXBOOK_API}/login.json?email=${encodeURIComponent(creds.email)}&password=${encodeURIComponent(creds.password)}`;
      const loginRes = await fetch(loginUrl);
      const loginData = await loginRes.json();

      if (loginData.error === true) {
        results.push({ userId: creds.user_id, trades: 0, error: loginData.message });
        continue;
      }

      const session = loginData.session;

      // Update session token
      await supabase
        .from("myfxbook_credentials")
        .update({ session_token: session, updated_at: new Date().toISOString() })
        .eq("user_id", creds.user_id);

      // Get accounts
      const accountsRes = await fetch(`${MYFXBOOK_API}/get-my-accounts.json?session=${session}`);
      const accountsData = await accountsRes.json();

      if (accountsData.error === true) {
        results.push({ userId: creds.user_id, trades: 0, error: accountsData.message });
        await fetch(`${MYFXBOOK_API}/logout.json?session=${session}`).catch(() => {});
        continue;
      }

      let userTradeCount = 0;

      for (const mfxAcc of accountsData.accounts || []) {
        // Upsert account
        const { data: existingAcc } = await supabase
          .from("accounts")
          .select("id")
          .eq("user_id", creds.user_id)
          .eq("myfxbook_account_id", String(mfxAcc.id))
          .single();

        let accountId: string;

        if (existingAcc) {
          accountId = existingAcc.id;
          await supabase.from("accounts").update({ balance: mfxAcc.balance }).eq("id", accountId);
        } else {
          const { data: newAcc, error: newAccErr } = await supabase
            .from("accounts")
            .insert({
              user_id: creds.user_id,
              name: mfxAcc.name || `Myfxbook ${mfxAcc.id}`,
              type: "live",
              currency: mfxAcc.currency || "USD",
              balance: mfxAcc.balance,
              initial_balance: mfxAcc.balance - (mfxAcc.profit || 0),
              myfxbook_account_id: String(mfxAcc.id),
            })
            .select("id")
            .single();

          if (newAccErr || !newAcc) continue;
          accountId = newAcc.id;
        }

        // Fetch trades
        const historyRes = await fetch(`${MYFXBOOK_API}/get-history.json?session=${session}&id=${mfxAcc.id}`);
        const historyData = await historyRes.json();

        if (historyData.error === true) continue;

        for (const trade of historyData.history || []) {
          const externalId = `mfxb_${mfxAcc.id}_${trade.openTime}_${trade.symbol}_${trade.openPrice}`;

          const { data: existing } = await supabase
            .from("trades")
            .select("id")
            .eq("external_id", externalId)
            .single();

          if (existing) continue;

          const direction = trade.action?.toLowerCase().includes("buy") ? "long" : "short";
          const closeDate = trade.closeTime
            ? new Date(trade.closeTime).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0];

          const { error: insertErr } = await supabase.from("trades").insert({
            user_id: creds.user_id,
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

          if (!insertErr) userTradeCount++;
        }
      }

      // Update last synced
      await supabase
        .from("myfxbook_credentials")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("user_id", creds.user_id);

      // Logout
      await fetch(`${MYFXBOOK_API}/logout.json?session=${session}`).catch(() => {});

      results.push({ userId: creds.user_id, trades: userTradeCount });
    } catch (err) {
      results.push({ userId: creds.user_id, trades: 0, error: String(err) });
    }
  }

  console.log("Auto-sync results:", JSON.stringify(results));

  return new Response(JSON.stringify({ synced: results.length, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
