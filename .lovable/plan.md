# Boost Trade Journaling → Unlock Next Quant Pillars

## Goal
Capture richer per-trade data (Stop Loss, Take Profit, exit time, setup tags, rule-adherence) so we can compute **R-multiples, MAE-proxy, Stop-Loss Efficiency, Edge Ratio, Discipline Score, Revenge-Trade Detector** — the next 8 pillars.

---

## Phase 1 — Schema upgrade (one migration)

Add the following nullable columns to `trades` (nullable so existing trades don't break):

| Column | Type | Purpose |
|---|---|---|
| `stop_loss` | numeric | Planned SL price |
| `take_profit` | numeric | Planned TP price |
| `exit_time` | timestamptz | When the trade closed (enables time-in-trade) |
| `setup_tag` | text | e.g. "FVG", "OB", "Liquidity Sweep" |
| `rules_followed` | boolean | Did you follow your plan? (Discipline Score) |
| `risk_amount` | numeric | $ risked (for R-multiple calc) |

All nullable, no default backfill needed.

## Phase 2 — Manual entry (UI)

Update `NewTrade.tsx` form — add a collapsible **"Plan & Risk"** section with:
- Stop Loss / Take Profit price inputs (auto-compute Risk:Reward live)
- Risk $ input (or auto-derive from SL distance × lot size)
- Setup tag dropdown (FVG, OB, BOS, Sweep, Other)
- "I followed my rules" toggle
- Exit time picker (defaults to now)

Show a live **R:R badge** as the user types (e.g. "1 : 2.4").

Also expose all six fields in `TradeView.tsx` (read-only) and `TradeLog.tsx` table (sortable columns for SL, TP, R).

## Phase 3 — Myfxbook auto-pull

Extend `sync-myfxbook` and `auto-sync-myfxbook` edge functions to map:
- `trade.sl` → `stop_loss`
- `trade.tp` → `take_profit`
- `trade.closeTime` → `exit_time`

(setup_tag / rules_followed stay manual — broker doesn't know your strategy.)

## Phase 4 — Unlock new pillars in Quant Lab

Add to `quantMetrics.ts` and render new cards on `/quant`:

1. **R-Multiple per trade** = pnl / risk_amount
2. **R-Expectancy** = avg R across all trades
3. **Avg Planned R:R** = avg (TP-entry)/(entry-SL)
4. **Realized vs Planned R:R** — did you hit your targets?
5. **Stop-Loss Efficiency** — % of trades that hit SL fully vs partially
6. **Avg Time-in-Trade** (winners vs losers)
7. **Discipline Score** = % trades with `rules_followed = true`
8. **Revenge-Trade Detector** — flags trades opened <15min after a loss with above-avg lot size

---

## What stays blocked after this

- **MAE/MFE (true tick-level)** — needs paid 1m price data per trade
- **Hurst Exponent / ATR-normalized returns** — needs historical price feed
- **Slippage / Spread** — needs broker fill data we don't have

These remain deferred until you want to pay for a price-data API.

---

## Technical Notes
- One migration, no data backfill (all nullable)
- Two edge function edits (sync + auto-sync) — same field mapping
- Three frontend files: `types/trading.ts`, `NewTrade.tsx`, `TradeView.tsx` + `quantMetrics.ts` + `QuantAnalytics.tsx`
- No new dependencies, no extra credit cost beyond the build itself

Approve and I'll start with the migration.