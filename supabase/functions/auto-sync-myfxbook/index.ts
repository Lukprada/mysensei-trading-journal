import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const MYFXBOOK_API = "https://www.myfxbook.com/api";

async function runSync() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: allCreds, error: credsErr } = await supabase
    .from("myfxbook_credentials")
    .select("user_id, email, password");

  if (credsErr || !allCreds || allCreds.length === 0) {
    console.log("No users to sync", credsErr?.message ?? "");
    return;
  }

  for (const creds of allCreds) {
    let session: string | null = null;
    try {
      const loginUrl = new URL(`${MYFXBOOK_API}/login.json`);
      loginUrl.searchParams.set("email", String(creds.email ?? "").trim());
      loginUrl.searchParams.set("password", String(creds.password ?? ""));
      const loginRes = await fetch(loginUrl, { headers: { Accept: "application/json" } });
      if (!loginRes.ok) {
        console.error(`Myfxbook login endpoint returned HTTP ${loginRes.status} for user ${creds.user_id}`);
        continue;
      }
      const loginData = await loginRes.json();
      if (loginData.error === true) {
        console.error(`Myfxbook rejected the saved credentials for user ${creds.user_id}`);
        continue;
      }
      session = loginData.session;

      await supabase
        .from("myfxbook_credentials")
        .update({ session_token: session, updated_at: new Date().toISOString() })
        .eq("user_id", creds.user_id);

      const accountsRes = await fetch(`${MYFXBOOK_API}/get-my-accounts.json?session=${session}`);
      const accountsData = await accountsRes.json();
      if (accountsData.error === true) {
        console.error(`Accounts failed for ${creds.user_id}: ${accountsData.message}`);
        continue;
      }

      let userTradeCount = 0;

      for (const mfxAcc of accountsData.accounts || []) {
        const { data: existingAcc } = await supabase
          .from("accounts")
          .select("id")
          .eq("user_id", creds.user_id)
          .eq("myfxbook_account_id", String(mfxAcc.id))
          .maybeSingle();

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

        const historyRes = await fetch(`${MYFXBOOK_API}/get-history.json?session=${session}&id=${mfxAcc.id}`);
        const historyData = await historyRes.json();
        if (historyData.error === true) continue;

        const history = historyData.history || [];

        // Build rows first, then dedupe in ONE query instead of one query per trade.
        const tradeRows: Record<string, unknown>[] = [];
        const cashRows: Record<string, unknown>[] = [];

        for (const trade of history) {
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
            const amount = Number(trade.profit || 0);
            if (amount === 0) continue;
            const occurredAt = trade.closeTime || trade.openTime || new Date().toISOString();
            cashRows.push({
              user_id: creds.user_id,
              account_id: accountId,
              flow_type: amount >= 0 ? "deposit" : "withdrawal",
              amount: Math.abs(amount),
              occurred_at: new Date(occurredAt).toISOString(),
              source: "myfxbook",
              external_id: `mfxb_bal_${mfxAcc.id}_${occurredAt}_${amount}`,
              note: trade.comment || action || "Balance entry",
            });
            continue;
          }

          tradeRows.push({
            user_id: creds.user_id,
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
            .eq("user_id", creds.user_id)
            .in("external_id", ids);
          const known = new Set((existingTrades || []).map((t: { external_id: string }) => t.external_id));
          const fresh = tradeRows.filter((r) => !known.has(r.external_id as string));
          if (fresh.length) {
            const { error: insertErr } = await supabase.from("trades").insert(fresh);
            if (insertErr) console.error("Insert trades failed:", insertErr.message);
            else userTradeCount += fresh.length;
          }
        }
      }

      await supabase
        .from("myfxbook_credentials")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("user_id", creds.user_id);

      console.log(`Synced user ${creds.user_id}: ${userTradeCount} new trades`);
    } catch (err) {
      console.error(`Sync error for ${creds.user_id}:`, String(err));
    } finally {
      if (session) await fetch(`${MYFXBOOK_API}/logout.json?session=${session}`).catch(() => {});
    }
  }
}

Deno.serve(() => {
  // Respond immediately so the hourly scheduler never times out; work continues in the background.
  // @ts-ignore EdgeRuntime is available in Supabase Edge Functions
  EdgeRuntime.waitUntil(runSync());
  return new Response(JSON.stringify({ started: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
