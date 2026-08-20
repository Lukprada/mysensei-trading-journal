import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Account, Trade, TradeFormData, CashFlow, calculatePips, calculatePnL } from "@/types/trading";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface TradingContextType {
  accounts: Account[];
  activeAccountId: string | null;
  activeAccount: Account | null;
  trades: Trade[];
  allTrades: Trade[];
  cashFlows: CashFlow[];
  addAccount: (account: Omit<Account, "id" | "createdAt">) => Promise<void>;
  updateAccount: (id: string, updates: Partial<Pick<Account, "name" | "type" | "currency" | "balance" | "initialBalance">>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  setActiveAccount: (id: string | null) => void;
  addTrade: (data: TradeFormData) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
  updateTrade: (id: string, updates: Partial<Pick<Trade, "journalNotes" | "tradingviewLinks" | "linkedGroupId" | "notes">>) => Promise<void>;
  linkTrades: (tradeIds: string[]) => Promise<void>;
  unlinkTrade: (tradeId: string) => Promise<void>;
  addCashFlow: (flow: Omit<CashFlow, "id">) => Promise<boolean>;
  deleteCashFlow: (id: string) => Promise<void>;
  getTradeById: (id: string) => Trade | undefined;
  updateTradeCritique: (tradeId: string, critique: string) => void;
  uploadScreenshot: (file: File) => Promise<string | null>;
  loading: boolean;
}

const TradingContext = createContext<TradingContextType | null>(null);

export function TradingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [cashFlows, setCashFlows] = useState<CashFlow[]>([]);
  const [activeAccountId, setActiveAccountIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch accounts and trades when user changes
  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setAllTrades([]);
      setCashFlows([]);
      setActiveAccountIdState(null);
      setLoading(false);
      return;
    }
    fetchData();
  }, [user?.id]);

  async function fetchData() {
    if (!user) return;
    setLoading(true);
    try {
      const [accRes, tradeRes, flowRes] = await Promise.all([
        supabase.from("accounts").select("*").order("created_at", { ascending: true }),
        supabase.from("trades").select("*").order("date", { ascending: true }),
        supabase.from("cash_flows").select("*").order("occurred_at", { ascending: true }),
      ]);

      if (accRes.error) throw accRes.error;
      if (tradeRes.error) throw tradeRes.error;
      if (flowRes.error) throw flowRes.error;

      const mappedAccounts: Account[] = (accRes.data || []).map((a: any) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        currency: a.currency,
        balance: Number(a.balance),
        initialBalance: Number(a.initial_balance),
        createdAt: a.created_at,
        myfxbookAccountId: a.myfxbook_account_id || undefined,
      }));

      const mappedTrades: Trade[] = (tradeRes.data || []).map((t: any) => ({
        id: t.id,
        accountId: t.account_id,
        asset: t.asset,
        entryPrice: Number(t.entry_price),
        exitPrice: Number(t.exit_price),
        direction: t.direction,
        positionSize: Number(t.position_size),
        date: t.date,
        pips: Number(t.pips),
        pnl: Number(t.pnl),
        mentalState: t.mental_state,
        notes: t.notes || "",
        screenshotUrl: t.screenshot_url || undefined,
        aiCritique: t.ai_critique || undefined,
        createdAt: t.created_at,
        stopLoss: t.stop_loss != null ? Number(t.stop_loss) : undefined,
        takeProfit: t.take_profit != null ? Number(t.take_profit) : undefined,
        exitTime: t.exit_time || undefined,
        setupTag: (t.setup_tag as Trade["setupTag"]) || undefined,
        rulesFollowed: t.rules_followed ?? undefined,
        riskAmount: t.risk_amount != null ? Number(t.risk_amount) : undefined,
        commission: t.commission != null ? Number(t.commission) : undefined,
        swap: t.swap != null ? Number(t.swap) : undefined,
        magicNumber: t.magic_number || undefined,
        brokerComment: t.broker_comment || undefined,
        journalNotes: t.journal_notes || undefined,
        tradingviewLinks: Array.isArray(t.tradingview_links) ? t.tradingview_links : [],
        linkedGroupId: t.linked_group_id || undefined,
        source: t.source || "manual",

      }));

      const mappedFlows: CashFlow[] = (flowRes.data || []).map((f: any) => ({
        id: f.id,
        accountId: f.account_id,
        flowType: f.flow_type,
        amount: Number(f.amount),
        occurredAt: f.occurred_at,
        source: f.source,
        note: f.note || undefined,
      }));

      setAccounts(mappedAccounts);
      setAllTrades(mappedTrades);
      setCashFlows(mappedFlows);
    } catch (err: any) {
      console.error("Fetch error:", err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  const activeAccount = accounts.find((a) => a.id === activeAccountId) || null;
  const trades = activeAccountId ? allTrades.filter((t) => t.accountId === activeAccountId) : allTrades;

  const addAccount = useCallback(async (data: Omit<Account, "id" | "createdAt">) => {
    if (!user) return;
    const { data: inserted, error } = await supabase.from("accounts").insert({
      user_id: user.id,
      name: data.name,
      type: data.type,
      currency: data.currency,
      balance: data.balance,
      initial_balance: data.initialBalance,
    }).select().single();

    if (error) { toast.error("Failed to create account"); return; }

    setAccounts((prev) => [...prev, {
      id: inserted.id,
      name: inserted.name,
      type: inserted.type as Account["type"],
      currency: inserted.currency as Account["currency"],
      balance: Number(inserted.balance),
      initialBalance: Number(inserted.initial_balance),
      createdAt: inserted.created_at,
    }]);
  }, [user]);

  const updateAccount = useCallback(async (id: string, updates: Partial<Pick<Account, "name" | "type" | "currency" | "balance" | "initialBalance">>) => {
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.type !== undefined) payload.type = updates.type;
    if (updates.currency !== undefined) payload.currency = updates.currency;
    if (updates.balance !== undefined) payload.balance = updates.balance;
    if (updates.initialBalance !== undefined) payload.initial_balance = updates.initialBalance;

    const { error } = await supabase.from("accounts").update(payload).eq("id", id);
    if (error) { toast.error("Failed to update account"); return; }
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  }, []);

  const deleteAccount = useCallback(async (id: string) => {
    const { error: tradesErr } = await supabase.from("trades").delete().eq("account_id", id);
    if (tradesErr) { toast.error("Failed to delete account trades"); return; }
    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (error) { toast.error("Failed to delete account"); return; }
    setAllTrades((prev) => prev.filter((t) => t.accountId !== id));
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    setActiveAccountIdState((curr) => (curr === id ? null : curr));
  }, []);

  const setActiveAccount = useCallback((id: string | null) => {
    setActiveAccountIdState(id);
  }, []);

  const addTrade = useCallback(async (data: TradeFormData) => {
    if (!user) return;
    const accountId = activeAccountId || accounts[0]?.id;
    if (!accountId) { toast.error("Create an account first"); return; }

    const pips = calculatePips(data.entryPrice, data.exitPrice, data.direction, data.asset);
    const pnl = calculatePnL(pips, data.positionSize);
    const roundedPips = Math.round(pips * 10) / 10;
    const roundedPnl = Math.round(pnl * 100) / 100;

    const { data: inserted, error } = await supabase.from("trades").insert({
      user_id: user.id,
      account_id: accountId,
      asset: data.asset,
      entry_price: data.entryPrice,
      exit_price: data.exitPrice,
      direction: data.direction,
      position_size: data.positionSize,
      date: data.date,
      pips: roundedPips,
      pnl: roundedPnl,
      mental_state: data.mentalState,
      notes: data.notes,
      screenshot_url: data.screenshotUrl || null,
      stop_loss: data.stopLoss ?? null,
      take_profit: data.takeProfit ?? null,
      exit_time: data.exitTime ?? null,
      setup_tag: data.setupTag ?? null,
      rules_followed: data.rulesFollowed ?? null,
      risk_amount: data.riskAmount ?? null,
    }).select().single();

    if (error) { toast.error("Failed to log trade"); console.error(error); return; }

    setAllTrades((prev) => [...prev, {
      id: inserted.id,
      accountId: inserted.account_id,
      asset: inserted.asset,
      entryPrice: Number(inserted.entry_price),
      exitPrice: Number(inserted.exit_price),
      direction: inserted.direction as Trade["direction"],
      positionSize: Number(inserted.position_size),
      date: inserted.date,
      pips: Number(inserted.pips),
      pnl: Number(inserted.pnl),
      mentalState: inserted.mental_state as Trade["mentalState"],
      notes: inserted.notes || "",
      screenshotUrl: inserted.screenshot_url || undefined,
      aiCritique: inserted.ai_critique || undefined,
      createdAt: inserted.created_at,
      stopLoss: inserted.stop_loss != null ? Number(inserted.stop_loss) : undefined,
      takeProfit: inserted.take_profit != null ? Number(inserted.take_profit) : undefined,
      exitTime: inserted.exit_time || undefined,
      setupTag: (inserted.setup_tag as Trade["setupTag"]) || undefined,
      rulesFollowed: inserted.rules_followed ?? undefined,
      riskAmount: inserted.risk_amount != null ? Number(inserted.risk_amount) : undefined,
    }]);

    // Update account balance
    const account = accounts.find((a) => a.id === accountId);
    if (account) {
      const newBalance = Math.round((account.balance + roundedPnl) * 100) / 100;
      await supabase.from("accounts").update({ balance: newBalance }).eq("id", accountId);
      setAccounts((prev) =>
        prev.map((a) => (a.id === accountId ? { ...a, balance: newBalance } : a))
      );
    }
  }, [user, activeAccountId, accounts]);

  const deleteTrade = useCallback(async (id: string) => {
    const { error } = await supabase.from("trades").delete().eq("id", id);
    if (error) { toast.error("Failed to delete trade"); return; }
    setAllTrades((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getTradeById = useCallback((id: string) => allTrades.find((t) => t.id === id), [allTrades]);

  const updateTradeCritique = useCallback(async (tradeId: string, critique: string) => {
    setAllTrades((prev) =>
      prev.map((t) => (t.id === tradeId ? { ...t, aiCritique: critique } : t))
    );
    // Persist to DB (fire and forget)
    supabase.from("trades").update({ ai_critique: critique }).eq("id", tradeId).then(({ error }) => {
      if (error) console.error("Failed to save critique:", error);
    });
  }, []);

  const uploadScreenshot = useCallback(async (file: File): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("trade-screenshots").upload(path, file);
    if (error) { toast.error("Upload failed"); console.error(error); return null; }
    const { data } = supabase.storage.from("trade-screenshots").getPublicUrl(path);
    return data.publicUrl;
  }, [user]);

  const updateTrade = useCallback(async (id: string, updates: Partial<Pick<Trade, "journalNotes" | "tradingviewLinks" | "linkedGroupId" | "notes">>) => {
    const payload: any = {};
    if (updates.journalNotes !== undefined) payload.journal_notes = updates.journalNotes;
    if (updates.tradingviewLinks !== undefined) payload.tradingview_links = updates.tradingviewLinks;
    if (updates.linkedGroupId !== undefined) payload.linked_group_id = updates.linkedGroupId;
    if (updates.notes !== undefined) payload.notes = updates.notes;
    const { error } = await supabase.from("trades").update(payload).eq("id", id);
    if (error) { toast.error("Failed to save"); console.error(error); return; }
    setAllTrades((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const linkTrades = useCallback(async (tradeIds: string[]) => {
    if (tradeIds.length < 2) return;
    const groupId = crypto.randomUUID();
    const { error } = await supabase.from("trades").update({ linked_group_id: groupId }).in("id", tradeIds);
    if (error) { toast.error("Failed to link trades"); return; }
    setAllTrades((prev) => prev.map((t) => (tradeIds.includes(t.id) ? { ...t, linkedGroupId: groupId } : t)));
    toast.success(`Linked ${tradeIds.length} trades into one position`);
  }, []);

  const unlinkTrade = useCallback(async (tradeId: string) => {
    const current = allTrades.find((trade) => trade.id === tradeId);
    const { error } = await supabase.from("trades").update({ linked_group_id: null }).eq("id", tradeId);
    if (error) { toast.error("Failed to unlink"); return; }
    const remaining = current?.linkedGroupId
      ? allTrades.filter((trade) => trade.linkedGroupId === current.linkedGroupId && trade.id !== tradeId)
      : [];
    if (remaining.length === 1) {
      await supabase.from("trades").update({ linked_group_id: null }).eq("id", remaining[0].id);
    }
    setAllTrades((prev) => prev.map((trade) =>
      trade.id === tradeId || (remaining.length === 1 && trade.id === remaining[0].id)
        ? { ...trade, linkedGroupId: undefined }
        : trade
    ));
  }, [allTrades]);

  const addCashFlow = useCallback(async (flow: Omit<CashFlow, "id">) => {
    if (!user) return false;
    const { data, error } = await supabase.from("cash_flows").insert({
      user_id: user.id,
      account_id: flow.accountId,
      flow_type: flow.flowType,
      amount: flow.amount,
      occurred_at: flow.occurredAt,
      source: flow.source,
      note: flow.note ?? null,
    }).select().single();
    if (error || !data) { toast.error("Failed to log cash flow"); return false; }
    setCashFlows((prev) => [...prev, {
      id: data.id,
      accountId: data.account_id,
      flowType: data.flow_type as CashFlow["flowType"],
      amount: Number(data.amount),
      occurredAt: data.occurred_at,
      source: data.source,
      note: data.note || undefined,
    }]);
    if (flow.source === "manual") {
      const account = accounts.find((item) => item.id === flow.accountId);
      if (account) {
        const delta = flow.flowType === "deposit" ? flow.amount : -flow.amount;
        const balance = Math.round((account.balance + delta) * 100) / 100;
        const { error: balanceError } = await supabase.from("accounts").update({ balance }).eq("id", flow.accountId);
        if (!balanceError) setAccounts((prev) => prev.map((item) => item.id === flow.accountId ? { ...item, balance } : item));
      }
    }
    return true;
  }, [user, accounts]);

  const deleteCashFlow = useCallback(async (id: string) => {
    const flow = cashFlows.find((item) => item.id === id);
    const { error } = await supabase.from("cash_flows").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    setCashFlows((prev) => prev.filter((f) => f.id !== id));
    if (flow?.source === "manual") {
      const account = accounts.find((item) => item.id === flow.accountId);
      if (account) {
        const reversal = flow.flowType === "deposit" ? -flow.amount : flow.amount;
        const balance = Math.round((account.balance + reversal) * 100) / 100;
        const { error: balanceError } = await supabase.from("accounts").update({ balance }).eq("id", flow.accountId);
        if (!balanceError) setAccounts((prev) => prev.map((item) => item.id === flow.accountId ? { ...item, balance } : item));
      }
    }
  }, [cashFlows, accounts]);

  const scopedCashFlows = activeAccountId ? cashFlows.filter((f) => f.accountId === activeAccountId) : cashFlows;

  return (
    <TradingContext.Provider value={{
      accounts, activeAccountId, activeAccount, trades, allTrades,
      cashFlows: scopedCashFlows,
      addAccount, updateAccount, deleteAccount, setActiveAccount,
      addTrade, deleteTrade, updateTrade, linkTrades, unlinkTrade,
      addCashFlow, deleteCashFlow,
      getTradeById, updateTradeCritique, uploadScreenshot, loading,
    }}>
      {children}
    </TradingContext.Provider>
  );
}

export function useTrading() {
  const ctx = useContext(TradingContext);
  if (!ctx) throw new Error("useTrading must be used within TradingProvider");
  return ctx;
}
