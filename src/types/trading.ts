export type AccountType = "live" | "demo" | "funded";
export type Currency = "USD" | "GBP" | "EUR";
export type Direction = "long" | "short";
export type MentalState = "confident" | "anxious" | "impulsive";
export type SetupTag = "FVG" | "OB" | "BOS" | "Sweep" | "Breakout" | "Reversal" | "Other";
export type CashFlowType = "deposit" | "withdrawal";

export const SETUP_TAGS: SetupTag[] = ["FVG", "OB", "BOS", "Sweep", "Breakout", "Reversal", "Other"];

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: Currency;
  balance: number;
  initialBalance: number;
  createdAt: string;
  myfxbookAccountId?: string;
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
  stopLoss?: number;
  takeProfit?: number;
  exitTime?: string;
  setupTag?: SetupTag;
  rulesFollowed?: boolean;
  riskAmount?: number;
  // Broker economics
  commission?: number;
  swap?: number;
  magicNumber?: string;
  brokerComment?: string;
  // Journal + media
  journalNotes?: string;
  tradingviewLinks?: string[];
  linkedGroupId?: string;
}

export interface CashFlow {
  id: string;
  accountId: string;
  flowType: CashFlowType;
  amount: number;
  occurredAt: string;
  source: string;
  note?: string;
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
  stopLoss?: number;
  takeProfit?: number;
  exitTime?: string;
  setupTag?: SetupTag;
  rulesFollowed?: boolean;
  riskAmount?: number;
}

export function calculatePips(entry: number, exit: number, direction: Direction, asset: string): number {
  const isJPY = asset.toUpperCase().includes("JPY");
  const multiplier = isJPY ? 100 : 10000;
  const rawPips = (exit - entry) * multiplier;
  return direction === "long" ? rawPips : -rawPips;
}

export function calculatePnL(pips: number, positionSize: number): number {
  return pips * positionSize * 10;
}

export function calculatePlannedRR(
  entry: number,
  sl: number | undefined,
  tp: number | undefined,
  direction: Direction
): number | null {
  if (!sl || !tp || !entry) return null;
  const risk = direction === "long" ? entry - sl : sl - entry;
  const reward = direction === "long" ? tp - entry : entry - tp;
  if (risk <= 0 || reward <= 0) return null;
  return reward / risk;
}

export function calculateRMultiple(pnl: number, riskAmount: number | undefined): number | null {
  if (!riskAmount || riskAmount <= 0) return null;
  return pnl / riskAmount;
}

export const COMMON_ASSETS = [
  "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD",
  "EURGBP", "EURJPY", "GBPJPY", "XAUUSD", "US30",
  "NAS100", "SPX500", "BTCUSD", "ETHUSD",
];
