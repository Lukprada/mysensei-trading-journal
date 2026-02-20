export type AccountType = "live" | "demo" | "funded";
export type Currency = "USD" | "GBP" | "EUR";
export type Direction = "long" | "short";
export type MentalState = "confident" | "anxious" | "impulsive";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: Currency;
  balance: number;
  initialBalance: number;
  createdAt: string;
}

export interface Trade {
  id: string;
  accountId: string;
  asset: string;
  entryPrice: number;
  exitPrice: number;
  direction: Direction;
  positionSize: number;
  date: string;
  pips: number;
  pnl: number;
  mentalState: MentalState;
  notes: string;
  screenshotUrl?: string;
  aiCritique?: string;
  createdAt: string;
}

export interface TradeFormData {
  asset: string;
  entryPrice: number;
  exitPrice: number;
  direction: Direction;
  positionSize: number;
  date: string;
  mentalState: MentalState;
  notes: string;
  screenshotUrl?: string;
}

export function calculatePips(entry: number, exit: number, direction: Direction, asset: string): number {
  const isJPY = asset.toUpperCase().includes("JPY");
  const multiplier = isJPY ? 100 : 10000;
  const rawPips = (exit - entry) * multiplier;
  return direction === "long" ? rawPips : -rawPips;
}

export function calculatePnL(pips: number, positionSize: number): number {
  return pips * positionSize * 10; // simplified: 1 pip = $10 per lot
}

export const COMMON_ASSETS = [
  "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD",
  "EURGBP", "EURJPY", "GBPJPY", "XAUUSD", "US30",
  "NAS100", "SPX500", "BTCUSD", "ETHUSD",
];
