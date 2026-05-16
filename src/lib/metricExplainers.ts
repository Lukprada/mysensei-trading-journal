// Educational content for each Quant Lab pillar.
// Keep concise but real — formula, short history, why it matters, how to improve.

export interface MetricExplainer {
  title: string;
  formula: string;
  history: string;
  importance: string;
  improve: string[];
  benchmark?: string;
}

export const METRIC_EXPLAINERS: Record<string, MetricExplainer> = {
  "Win Rate": {
    title: "Win Rate",
    formula: "Wins / Total Trades × 100",
    history:
      "One of the oldest performance stats in gambling and trading. Popularized in trading by Larry Williams and Van Tharp in the 1980s as a basic skill proxy.",
    importance:
      "Alone, win rate means nothing — a 90% win rate with tiny wins and huge losses still bleeds. It only matters paired with payoff ratio (avg win vs avg loss).",
    improve: [
      "Tighten entry criteria — fewer, higher-conviction setups",
      "Avoid trading during news/low-liquidity hours",
      "Backtest the setup to confirm it has statistical edge",
    ],
    benchmark: "Most profitable systems sit between 35–60%.",
  },
  "Profit Factor": {
    title: "Profit Factor",
    formula: "Gross Profit / Gross Loss",
    history:
      "Coined by Ralph Vince and popularized in TradeStation's performance reports in the 1990s. Now the industry-standard 'is the system profitable?' single number.",
    importance:
      "Tells you how many dollars you make for every dollar lost. <1 = losing system. 1–1.5 = marginal. >2 = strong edge. >4 may indicate curve-fit.",
    improve: [
      "Cut your largest losers — one outlier loss tanks PF",
      "Let winners run to TP instead of scratching early",
      "Filter out the worst-performing instrument or session",
    ],
    benchmark: "Healthy: 1.5–2.5. Elite: 2.5+. Suspicious: 4+.",
  },
  "Expectancy": {
    title: "Expectancy",
    formula: "(WinRate × AvgWin) − (LossRate × AvgLoss)",
    history:
      "Formalized by Van Tharp in 'Trade Your Way to Financial Freedom' (1998). Came from the casino industry — the expected value of a single bet.",
    importance:
      "The single most honest number in trading. Positive = your system makes money over enough trades. Negative = no amount of position sizing saves you.",
    improve: [
      "Increase avg win (let trades run, scale out higher)",
      "Decrease avg loss (tighter stops, no averaging down)",
      "Skip the lowest-expectancy setups in your journal",
    ],
  },
  "Payoff Ratio": {
    title: "Payoff Ratio",
    formula: "Avg Win / Avg Loss",
    history:
      "A reward:risk descendant from 1970s commodity trading. Richard Dennis's Turtles aimed for 2:1 or better and let winners ride.",
    importance:
      "The asymmetry of your trades. Combined with win rate it determines if your edge is real. A 40% win rate with 3:1 payoff beats a 60% win rate with 1:1.",
    improve: [
      "Move stops to break-even after favorable movement",
      "Use trailing stops to capture extended runs",
      "Avoid taking profit at 1R when setup justifies 3R",
    ],
    benchmark: "Trend systems: 2–4. Mean reversion: 0.8–1.2.",
  },
  "Z-Score": {
    title: "Z-Score (Wald–Wolfowitz Runs Test)",
    formula: "Z = (R − E[R]) / σ[R], where R = number of streaks",
    history:
      "Developed in 1940 by Abraham Wald and Jacob Wolfowitz as a non-parametric test for randomness. Adopted into trading by Perry Kaufman in the 1980s.",
    importance:
      "Detects whether wins/losses cluster (non-random). Strong negative Z = streaks; strong positive Z = alternation. |Z|>1.96 = statistically significant (95%).",
    improve: [
      "If streaks cluster: position-size down after losses",
      "If results alternate: avoid 'I'm due' thinking",
      "Use it to validate that your edge isn't random luck",
    ],
  },
  "Kelly %": {
    title: "Kelly Criterion",
    formula: "K = W − (1 − W) / R    (W=win rate, R=payoff)",
    history:
      "Derived by John L. Kelly Jr. at Bell Labs in 1956 for signal-to-noise problems. Ed Thorp used it to beat blackjack and run Princeton-Newport Partners.",
    importance:
      "The mathematically optimal fraction of capital to risk per trade to maximize long-term geometric growth. Above it = ruin risk. Most pros trade Half-Kelly or Quarter-Kelly.",
    improve: [
      "Never trade Full Kelly — drawdowns are brutal",
      "Use Quarter-Kelly as your max risk per trade",
      "If Kelly is negative, your system has no edge — stop",
    ],
    benchmark: "Practical risk: 0.25–0.5 × Kelly per trade.",
  },
  "Avg Win": {
    title: "Average Win",
    formula: "Sum(Winning PnL) / Number of Winners",
    history: "Basic descriptive statistic in performance reporting since the earliest trading journals.",
    importance: "Pairs with avg loss to form your payoff ratio. Growing avg win usually means you're letting trades run.",
    improve: ["Scale out in tranches instead of full exits", "Use volatility-based trailing stops"],
  },
  "Avg Loss": {
    title: "Average Loss",
    formula: "Sum(Losing PnL) / Number of Losers",
    history: "Basic descriptive statistic; emphasized heavily by Mark Douglas in 'Trading in the Zone' (2000).",
    importance: "Discipline metric. If this drifts upward, you're moving stops or holding losers — the #1 account killer.",
    improve: ["Hard stops, never moved against you", "Cut losers at planned invalidation, no exceptions"],
  },
  "Max Drawdown": {
    title: "Maximum Drawdown",
    formula: "max(Peak Equity − Trough Equity) / Peak Equity",
    history:
      "Developed alongside Modern Portfolio Theory (1950s–60s). Hedge funds adopted it post-LTCM (1998) when volatility metrics failed to predict tail loss.",
    importance:
      "The worst peak-to-valley pain you've endured. More honest than volatility — it's what you'd actually feel. Funded-account challenges fail you on this.",
    improve: [
      "Reduce position size after consecutive losses",
      "Cap daily loss limit to prevent cascade",
      "Diversify across uncorrelated instruments",
    ],
    benchmark: "Pro target: <20% MDD. Funded rules: usually 10%.",
  },
  "Ulcer Index": {
    title: "Ulcer Index",
    formula: "√( mean(drawdown%²) )",
    history:
      "Created by Peter Martin in 1987. Named because deep, prolonged drawdowns literally cause ulcers — penalizes pain duration, not just depth.",
    importance:
      "Better than Max DD for measuring how stressful a system is to trade. Two systems with same Max DD can have very different Ulcer Indexes.",
    improve: ["Cut losers faster to shorten underwater time", "Avoid revenge-trading during drawdown"],
    benchmark: "<5 = comfortable, 5–10 = stressful, >10 = painful.",
  },
  "Sharpe (per trade)": {
    title: "Sharpe Ratio",
    formula: "(Mean Return − Risk-Free Rate) / Std Dev",
    history:
      "William F. Sharpe, 1966. Won him the 1990 Nobel Prize in Economics. The single most-cited risk-adjusted return metric in finance.",
    importance:
      "Return per unit of risk. Penalizes volatility — including upside. Criticized because big winners hurt your Sharpe even though they're good.",
    improve: ["Reduce trade-to-trade PnL variance", "Avoid oversized 'home-run' bets that whipsaw equity"],
    benchmark: "Per trade: >0.3 good. Annualized: >1 good, >2 elite.",
  },
  "Sortino (per trade)": {
    title: "Sortino Ratio",
    formula: "(Mean Return − MAR) / Downside Deviation",
    history:
      "Frank Sortino, late 1980s, as a fix for Sharpe's flaw of penalizing upside volatility. Only counts harmful (downside) variance.",
    importance:
      "Honest measure of risk-adjusted return — only volatility that hurt you. Almost always higher than Sharpe for trend-following systems.",
    improve: ["Shrink your losing-trade distribution", "Avoid catastrophic single losses"],
    benchmark: "Per trade: >0.5 good. Annualized: >2 strong.",
  },
  "Recovery Factor": {
    title: "Recovery Factor",
    formula: "Net Profit / Max Drawdown",
    history: "Popularized by Jack Schwager in 'Market Wizards' (1989) as a way to compare systems with different risk profiles.",
    importance: "How many drawdowns of pain did you absorb to earn your profit? <1 = you haven't recovered yet. >3 = the pain was worth it.",
    improve: ["Reduce drawdown depth (smaller size, tighter stops)", "Grow net profit (let winners run further)"],
    benchmark: ">2 healthy, >5 elite.",
  },
  "Std Dev": {
    title: "Standard Deviation of PnL",
    formula: "√( Σ(x − mean)² / N )",
    history: "Foundation of statistics since the 1890s (Karl Pearson). Brought into finance via Markowitz's Modern Portfolio Theory (1952).",
    importance: "How much your trade-to-trade PnL bounces around. Lower = more predictable system. Used as the 'risk' in Sharpe.",
    improve: ["Standardize position size as % risk, not fixed lots", "Avoid wildly oversized trades"],
  },
  "Largest Win": {
    title: "Largest Win",
    formula: "max(Winning PnL)",
    history: "Outlier metric used in TradeStation reports since the 90s.",
    importance: "If a single trade is 5×+ your avg win, your stats may be flattered by luck — be honest about repeatability.",
    improve: ["Don't anchor expectations on outliers", "Study the setup — was it skill or randomness?"],
  },
  "Largest Loss": {
    title: "Largest Loss",
    formula: "min(Losing PnL)",
    history: "The other half of the outlier metric. Highlighted heavily in risk management literature since Nick Leeson / Barings (1995).",
    importance: "Your single worst day. If it's much bigger than avg loss, your stops failed once — that's a process bug to fix.",
    improve: ["Hard broker-side stops, not mental stops", "Cap max position size relative to equity"],
  },
  "Max Win Streak": {
    title: "Maximum Win Streak",
    formula: "Longest consecutive run of wins",
    history: "Streak tracking comes from sports analytics and casino theory; in trading it's a discipline/randomness check.",
    importance: "Long streaks feel like skill but often aren't. Dangerous because they breed overconfidence and oversized next-trade risk.",
    improve: ["Don't increase size during a streak", "Re-read your rules after every 5 consecutive wins"],
  },
  "Max Loss Streak": {
    title: "Maximum Loss Streak",
    formula: "Longest consecutive run of losses",
    history: "Used since the 1960s to size risk budgets — 'can your account survive your worst streak?'",
    importance: "Determines whether your risk-per-trade is sane. If you risk 5% and have a 6-loss streak in your data, you'd be down ~26%.",
    improve: ["Reduce risk per trade so max streak = <15% drawdown", "Pause trading after 3 consecutive losses"],
  },
  "Current Streak": {
    title: "Current Streak",
    formula: "Consecutive wins/losses up to most recent trade",
    history: "Real-time discipline check, used in prop-firm risk dashboards.",
    importance: "Behavioral signal. Long current loss streak = stop and review. Long current win streak = check for overconfidence.",
    improve: ["Set a hard rule: stop after N losing trades in a row", "Don't double up to 'get even'"],
  },
  "CAGR": {
    title: "Compound Annual Growth Rate",
    formula: "(End / Start)^(1/years) − 1",
    history: "Standard finance metric since the 1950s, used by every fund prospectus on Earth.",
    importance: "The annualized growth rate of your equity. The only metric that lets you compare yourself to the S&P, bonds, or any benchmark.",
    improve: ["Compound — don't withdraw all profits", "Reduce drawdowns (CAGR is geometric, big losses hurt more)"],
    benchmark: "S&P long-run ≈ 10%. Active retail target: 20–40% with controlled DD.",
  },
  "Total P&L": {
    title: "Total Profit & Loss",
    formula: "Σ(all closed trade PnL)",
    history: "The original metric — older than the ticker tape.",
    importance: "The scoreboard. But on its own it's meaningless without risk context (a $10k profit on a $1M account is different than on $10k).",
    improve: ["Focus on the process metrics above, not this", "Track $ per unit of risk, not raw $"],
  },
  "Gross Profit": {
    title: "Gross Profit",
    formula: "Σ(Winning Trades PnL)",
    history: "Half of the Profit Factor calculation, standard in performance reports.",
    importance: "How much your winners contributed in total. Compare to gross loss to see system asymmetry.",
    improve: ["Let winners run", "Take fewer mediocre setups so winners are a bigger share"],
  },
  "Gross Loss": {
    title: "Gross Loss",
    formula: "Σ(Losing Trades PnL)",
    history: "Other half of Profit Factor; emphasized in risk reporting.",
    importance: "The total cost of being wrong. The fastest path to higher PF is shrinking this number.",
    improve: ["Cut losses at predefined invalidation", "Skip the lowest-edge setups in your data"],
  },
  "Break-Even": {
    title: "Break-Even Trades",
    formula: "Count of trades with PnL ≈ $0",
    history: "Modern journaling stat — popularized by Edgewonk/TradeZella circa 2017.",
    importance: "Too many BE trades = you're moving stops to BE too early and cutting winners. Some BE is healthy; lots of BE is leak.",
    improve: ["Don't move to BE before 1R favorable", "Let setups breathe instead of risk-free flipping"],
  },
  "R-Expectancy": {
    title: "R-Expectancy",
    formula: "Mean( PnL / Risk Amount )",
    history:
      "Van Tharp's invention (1990s). 'R' = your initial risk per trade. Made expectancy comparable across different risk sizes and instruments.",
    importance:
      "The cleanest measure of edge. R-Expectancy of +0.3R means each trade earns 0.3× your risk on average. 100 trades × 1% risk × 0.3R = +30% account growth.",
    improve: [
      "Cut sub-1R setups from your playbook",
      "Push planned targets to 2R+ when structure allows",
      "Don't average down — preserves true R",
    ],
    benchmark: ">0.2R = profitable. >0.5R = elite.",
  },
  "Avg Planned R:R": {
    title: "Average Planned Reward:Risk",
    formula: "Mean( TP distance / SL distance )",
    history: "Reward:risk thinking comes from 1970s commodity trading; formalized by Alexander Elder and Van Tharp.",
    importance: "The asymmetry you're aiming for before the trade starts. If <2:1, you need >50% win rate to be profitable.",
    improve: ["Only take setups with ≥2:1 potential", "Place stops at real structural invalidation, not arbitrary"],
    benchmark: ">2 healthy. >3 selective. <1.5 demands high win rate.",
  },
  "Hit-Rate vs Plan": {
    title: "Hit-Rate vs Plan",
    formula: "% of winners that reached ≥90% of planned TP",
    history: "Modern execution-quality metric used by prop firms to grade trader discipline.",
    importance: "Tells you if your TPs are realistic. Low hit-rate = you're targeting too far. High but low PnL = you're targeting too close.",
    improve: ["Place TP at real liquidity/structure, not round numbers", "Use partials at 1R then trail the rest"],
  },
  "Discipline Score": {
    title: "Discipline Score",
    formula: "% of trades marked 'rules followed' / total trades",
    history: "Behavioral metric pioneered in Edgewonk (2016) — the journal layer above the math.",
    importance: "The only metric that measures YOU, not your system. A profitable trader with low discipline is gambling — variance will catch them.",
    improve: ["Define rules in writing before the day", "Block trades that fail any rule, even if 'it looks good'"],
    benchmark: ">80% = professional. <50% = your edge is luck.",
  },
  "Avg Time (Wins)": {
    title: "Average Time in Winning Trades",
    formula: "Mean( exit_time − entry_time ) for winners",
    history: "Used by systematic funds since the 80s to distinguish scalping vs swing systems.",
    importance: "Should generally be LONGER than avg time in losing trades. If losses live longer than wins, you're holding losers — discipline leak.",
    improve: ["Let winners breathe via trailing stops", "Don't snatch profit before the planned target"],
  },
  "Avg Time (Losses)": {
    title: "Average Time in Losing Trades",
    formula: "Mean( exit_time − entry_time ) for losers",
    history: "Behavioral metric tracked in Edgewonk/TradeZella to surface 'hope trading'.",
    importance: "Should be SHORTER than time in winners. If longer = you're letting losers marinate hoping for reversal. Account killer.",
    improve: ["Hard stop, no exceptions", "Use time-based stops: 'if not working in N candles, out'"],
  },
  "Revenge Trades": {
    title: "Revenge Trade Detector",
    formula: "Trades with above-average lot size opened <60min after a loss",
    history: "Behavioral pattern documented by Mark Douglas ('Trading in the Zone', 2000) and Brett Steenbarger.",
    importance: "The single most expensive behavioral mistake. One revenge trade can erase a week of disciplined work.",
    improve: [
      "Mandatory 30–60 min cooldown after any loss",
      "Cap risk to half-size for the next trade after a loss",
      "Walk away from the desk after 2 losses in a row",
    ],
    benchmark: "Target: 0.",
  },
  "Coverage": {
    title: "Plan Coverage",
    formula: "Trades with SL + TP logged / Total trades",
    history: "Data-quality metric — you can't measure what you don't record.",
    importance: "Many advanced metrics need SL/TP/Risk. The higher this %, the more accurate your Quant Lab becomes.",
    improve: ["Log SL/TP/Risk on every trade going forward", "Backfill recent trades from your broker statement"],
    benchmark: "Aim for 100%.",
  },
};
