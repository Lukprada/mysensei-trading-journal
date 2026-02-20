import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Account, Trade, TradeFormData, calculatePips, calculatePnL } from "@/types/trading";

interface TradingContextType {
  accounts: Account[];
  activeAccountId: string | null;
  activeAccount: Account | null;
  trades: Trade[];
  allTrades: Trade[];
  addAccount: (account: Omit<Account, "id" | "createdAt">) => void;
  setActiveAccount: (id: string | null) => void;
  addTrade: (data: TradeFormData) => void;
  deleteTrade: (id: string) => void;
  getTradeById: (id: string) => Trade | undefined;
}

const TradingContext = createContext<TradingContextType | null>(null);

const STORAGE_KEY = "trading-journal";

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

// Seed data
const defaultAccounts: Account[] = [
  { id: "acc-1", name: "Main Live", type: "live", currency: "USD", balance: 10250, initialBalance: 10000, createdAt: "2025-01-01" },
  { id: "acc-2", name: "Practice", type: "demo", currency: "USD", balance: 50430, initialBalance: 50000, createdAt: "2025-01-01" },
  { id: "acc-3", name: "FTMO Challenge", type: "funded", currency: "USD", balance: 102800, initialBalance: 100000, createdAt: "2025-02-01" },
];

const defaultTrades: Trade[] = [
  { id: "t1", accountId: "acc-1", asset: "EURUSD", entryPrice: 1.0850, exitPrice: 1.0892, direction: "long", positionSize: 1, date: "2025-02-10", pips: 42, pnl: 420, mentalState: "confident", notes: "Clean breakout setup, followed the plan.", createdAt: "2025-02-10" },
  { id: "t2", accountId: "acc-1", asset: "GBPUSD", entryPrice: 1.2650, exitPrice: 1.2618, direction: "long", positionSize: 0.5, date: "2025-02-12", pips: -32, pnl: -160, mentalState: "anxious", notes: "Entered too early, didn't wait for confirmation.", createdAt: "2025-02-12" },
  { id: "t3", accountId: "acc-1", asset: "USDJPY", entryPrice: 154.50, exitPrice: 154.20, direction: "short", positionSize: 1, date: "2025-02-14", pips: 30, pnl: 300, mentalState: "confident", notes: "Nice rejection from resistance zone.", createdAt: "2025-02-14" },
  { id: "t4", accountId: "acc-1", asset: "XAUUSD", entryPrice: 2920.00, exitPrice: 2935.50, direction: "long", positionSize: 0.5, date: "2025-02-15", pips: 155, pnl: 775, mentalState: "confident", notes: "Gold momentum trade.", createdAt: "2025-02-15" },
  { id: "t5", accountId: "acc-1", asset: "NAS100", entryPrice: 18250, exitPrice: 18190, direction: "long", positionSize: 0.5, date: "2025-02-17", pips: -60, pnl: -300, mentalState: "impulsive", notes: "FOMO entry, should have waited.", createdAt: "2025-02-17" },
  { id: "t6", accountId: "acc-1", asset: "EURUSD", entryPrice: 1.0910, exitPrice: 1.0945, direction: "long", positionSize: 1.5, date: "2025-02-18", pips: 35, pnl: 525, mentalState: "confident", notes: "Textbook support bounce.", createdAt: "2025-02-18" },
  { id: "t7", accountId: "acc-2", asset: "GBPJPY", entryPrice: 191.50, exitPrice: 192.10, direction: "long", positionSize: 2, date: "2025-02-13", pips: 60, pnl: 1200, mentalState: "confident", notes: "Demo test - larger size.", createdAt: "2025-02-13" },
  { id: "t8", accountId: "acc-3", asset: "EURUSD", entryPrice: 1.0880, exitPrice: 1.0910, direction: "long", positionSize: 2, date: "2025-02-16", pips: 30, pnl: 600, mentalState: "confident", notes: "Conservative funded trade.", createdAt: "2025-02-16" },
];

export function TradingProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.accounts || defaultAccounts;
    }
    return defaultAccounts;
  });

  const [allTrades, setAllTrades] = useState<Trade[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.trades || defaultTrades;
    }
    return defaultTrades;
  });

  const [activeAccountId, setActiveAccountId] = useState<string | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.activeAccountId || null;
    }
    return null;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accounts, trades: allTrades, activeAccountId }));
  }, [accounts, allTrades, activeAccountId]);

  const activeAccount = accounts.find((a) => a.id === activeAccountId) || null;
  const trades = activeAccountId ? allTrades.filter((t) => t.accountId === activeAccountId) : allTrades;

  const addAccount = useCallback((data: Omit<Account, "id" | "createdAt">) => {
    const newAccount: Account = { ...data, id: generateId(), createdAt: new Date().toISOString().split("T")[0] };
    setAccounts((prev) => [...prev, newAccount]);
  }, []);

  const setActiveAccount = useCallback((id: string | null) => {
    setActiveAccountId(id);
  }, []);

  const addTrade = useCallback((data: TradeFormData) => {
    const accountId = activeAccountId || accounts[0]?.id;
    if (!accountId) return;
    const pips = calculatePips(data.entryPrice, data.exitPrice, data.direction, data.asset);
    const pnl = calculatePnL(pips, data.positionSize);
    const trade: Trade = {
      ...data,
      id: generateId(),
      accountId,
      pips: Math.round(pips * 10) / 10,
      pnl: Math.round(pnl * 100) / 100,
      createdAt: new Date().toISOString(),
    };
    setAllTrades((prev) => [...prev, trade]);
    setAccounts((prev) =>
      prev.map((a) => (a.id === accountId ? { ...a, balance: Math.round((a.balance + pnl) * 100) / 100 } : a))
    );
  }, [activeAccountId, accounts]);

  const deleteTrade = useCallback((id: string) => {
    setAllTrades((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getTradeById = useCallback((id: string) => allTrades.find((t) => t.id === id), [allTrades]);

  return (
    <TradingContext.Provider value={{ accounts, activeAccountId, activeAccount, trades, allTrades, addAccount, setActiveAccount, addTrade, deleteTrade, getTradeById }}>
      {children}
    </TradingContext.Provider>
  );
}

export function useTrading() {
  const ctx = useContext(TradingContext);
  if (!ctx) throw new Error("useTrading must be used within TradingProvider");
  return ctx;
}
