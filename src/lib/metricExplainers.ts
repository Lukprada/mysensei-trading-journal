// Sensei Archive — narrative biography panels for each Quant Lab pillar.
// Each metric has an optional `narrative` block: Origin Story → Quant Code →
// Psychological Phase curve → Personal Command. Older fields kept as fallback.

export interface PhaseCurve {
  past: string;     // where you came from
  current: string;  // where you are now (live)
  future: string;   // the elite target
  caption: string;  // one paragraph interpreting the curve
}

export interface MetricNarrative {
  originStory: string;
  quantCode: string;        // formula as a clean string (LaTeX-free, plain math)
  phase: PhaseCurve;
  command: string;          // Personal command to Brian
}

export interface MetricExplainer {
  title: string;
  formula: string;
  history: string;
  importance: string;
  improve: string[];
  benchmark?: string;
  narrative?: MetricNarrative;
}

export const METRIC_EXPLAINERS: Record<string, MetricExplainer> = {
  "Win Rate": {
    title: "Win Rate",
    formula: "Wins / Total Trades × 100",
    history:
      "Popularized in trading by Larry Williams and Van Tharp in the 1980s.",
    importance:
      "Alone it means nothing — only matters paired with payoff ratio.",
    improve: [
      "Tighten entry criteria — fewer, higher-conviction setups",
      "Avoid news / low-liquidity hours",
      "Backtest to confirm statistical edge",
    ],
    benchmark: "Most profitable systems sit between 35–60%.",
    narrative: {
      originStory:
        "In 1987, Larry Williams turned $10,000 into over $1.1M in 12 months during the World Cup Championship of Futures Trading. Retailers thought he had a 99% perfect entry system. When the data was audited, the truth: Larry's win rate hovered around 48%–52%. He won by matching coin-flip accuracy with massive, unyielding target expansion.",
      quantCode: "Win Rate = ( Winning Trades / Total Trades ) × 100",
      phase: {
        past: "Over-leveraging / flipping accounts",
        current: "Controlled Baseline",
        future: "40% Elite Trend-Catcher",
        caption:
          "This curve tracks your escape from the retail trap. You moved away from chasing a fake 90% accuracy curve and accepted the realistic institutional baseline.",
      },
      command:
        "Larry Williams didn't need more than 50% to conquer the world, and neither do you. Stop looking for a perfect entry; look for perfect structural delivery.",
    },
  },
  "Profit Factor": {
    title: "Profit Factor",
    formula: "Gross Profit / Gross Loss",
    history: "Coined by Ralph Vince, standardized in TradeStation reports in the 90s.",
    importance:
      "How many dollars you make per dollar lost. <1 losing, 1–1.5 marginal, >2 strong edge.",
    improve: [
      "Cut your largest losers — one outlier tanks PF",
      "Let winners run to TP instead of scratching early",
      "Filter out the worst-performing instrument or session",
    ],
    benchmark: "Healthy: 1.5–2.5. Elite: 2.5+. Suspicious: 4+.",
  },
  "Expectancy": {
    title: "Expectancy",
    formula: "(WinRate × AvgWin) − (LossRate × AvgLoss)",
    history: "Formalized by Van Tharp (1998), borrowed from casino math.",
    importance:
      "The single most honest number. Positive = system makes money over enough trades.",
    improve: [
      "Increase avg win (let trades run, scale out higher)",
      "Decrease avg loss (tighter stops, no averaging down)",
      "Skip lowest-expectancy setups in your journal",
    ],
    narrative: {
      originStory:
        "Dr. Van Tharp, a legendary trading psychologist, realized the human brain treats a loss as 2.5× more painful than an equivalent gain (Prospect Theory). To break this survival bias, he codified Expectancy to prove trading isn't a game of guessing right — it's a game of gross statistical averages. The world's greatest trend-followers run 35% win rates but hold elite expectancy because their wins are massive.",
      quantCode:
        "Expectancy = (Win Rate × Avg Win) − (Loss Rate × Avg Loss)",
      phase: {
        past: "Negative emotional drainage",
        current: "Positive Edge",
        future: "The Fund Multiplier",
        caption:
          "You have crossed the zero-line from negative, emotional drainage into a clean, mathematical positive expectancy landscape.",
      },
      command:
        "Every time you click execution on your protocol, the math deposits dollars into your future account. Do not violate a setup mid-flight out of fear — you manually break this equation.",
    },
  },
  "Payoff Ratio": {
    title: "Payoff Ratio",
    formula: "Avg Win / Avg Loss",
    history: "Reward:risk descendant from 1970s commodity trading.",
    importance: "The asymmetry of your trades. With win rate, it defines real edge.",
    improve: [
      "Move stops to break-even after favorable movement",
      "Use trailing stops to capture extended runs",
      "Avoid taking profit at 1R when setup justifies 3R",
    ],
    benchmark: "Trend systems: 2–4. Mean reversion: 0.8–1.2.",
    narrative: {
      originStory:
        "In the winter of 1983, Richard Dennis and William Eckhardt launched the Turtle Traders experiment to see if trading could be taught like breeding turtles. They proved beginners who focused entirely on Payoff Ratio could withstand 10 consecutive losses, catch one macro expansion, and clear their entire year's drawdown in a single afternoon.",
      quantCode: "Payoff Ratio = Average Win / Average Loss",
      phase: {
        past: "0.3:1 — chasing small wicks out of fear",
        current: "Heavy Consolidation",
        future: "2:1 Precision Sniper",
        caption:
          "Your avg win and avg loss are neck-and-neck. This is the signature of a trader cutting losses early but closing winners too early before they reach full premium targets.",
      },
      command:
        "To push past 1.0 into elite funding territory, let winners run fully into your mapped Volume Gaps and Monthly Bond iFVGs. Trust the target memory of the chart.",
    },
  },
  "Z-Score": {
    title: "Z-Score (Wald–Wolfowitz Runs Test)",
    formula: "Z = (R − E[R]) / σ[R]",
    history: "Wald & Wolfowitz (1940), adopted into trading by Perry Kaufman.",
    importance:
      "Detects whether wins/losses cluster (non-random). |Z| > 1.96 = statistically significant.",
    improve: [
      "If streaks cluster: size down after losses",
      "If results alternate: avoid 'I'm due' thinking",
      "Validate that your edge isn't random luck",
    ],
    narrative: {
      originStory:
        "During WWII, statistician Abraham Wald worked for the Statistical Research Group to figure out how to armor bomber planes returning from runs. His sequential analysis evolved into the Wald-Wolfowitz Runs Test — used in modern finance to prove whether a trader's streaks are random or systemic.",
      quantCode: "Z = (R − E[R]) / σ[R]   (R = number of streaks)",
      phase: {
        past: "Random retail flips",
        current: "Streak Clustering",
        future: "0.0 Pure Random Edge",
        caption:
          "You're close to the −1.96 institutional alarm threshold. Losses and wins love to travel in clusters — when one loss prints, the next is statistically likely to follow.",
      },
      command:
        "The moment a loss prints, your Z-score says you're in a streak cluster. Scale down sizing instantly on the next setup. That's the rule.",
    },
  },
  "Kelly %": {
    title: "Kelly Criterion",
    formula: "K = W − (1 − W) / R",
    history: "Kelly (Bell Labs, 1956); operationalized by Ed Thorp in markets.",
    importance:
      "The mathematically optimal fraction of capital to risk to maximize geometric growth.",
    improve: [
      "Never trade Full Kelly — drawdowns are brutal",
      "Use Quarter-Kelly as max risk per trade",
      "If Kelly is negative, your system has no edge — stop",
    ],
    benchmark: "Practical risk: 0.25–0.5 × Kelly per trade.",
    narrative: {
      originStory:
        "In 1956, John Larry Kelly Jr. at Bell Labs developed a formula to clear white-noise distortion in long-distance phone lines. He discovered the same math could determine the optimal % of capital to risk on any bet with a known edge. It became the secret weapon for card-counters in Vegas, before Ed Thorp adapted it to Wall Street to scale asset sizes without risking ruin.",
      quantCode: "K% = W − ( (1 − W) / R )   (W = win rate, R = payoff)",
      phase: {
        past: "Over-leveraging out of greed",
        current: "1% Fixed Guardrail",
        future: "Automated Kelly Allocator",
        caption:
          "At a strict 1% fixed maximum risk, you have manually tamed the emotional swing that wipes out retail accounts during unexpected corrections.",
      },
      command:
        "Never use Full Kelly. Always leverage Fractional Kelly (Quarter-Kelly) as a structural safety shield to keep your psychological capital intact through losing streaks.",
    },
  },
  "Avg Win": {
    title: "Average Win",
    formula: "Sum(Winning PnL) / Number of Winners",
    history: "Basic descriptive stat since the earliest trading journals.",
    importance: "Pairs with avg loss to form your payoff ratio.",
    improve: ["Scale out in tranches instead of full exits", "Use volatility-based trailing stops"],
    narrative: {
      originStory:
        "In The Alchemy of Finance, George Soros stated: \"It's not whether you're right or wrong that's important, but how much money you make when you're right and how much you lose when you're wrong.\" Quantitative houses isolated Average Win to establish your true financial ceiling — whether you clinically extract maximum value or panic the moment a trade turns green.",
      quantCode: "Average Win = Σ(Gross Profits) / Number of Winning Trades",
      phase: {
        past: "Flashing green panic sells",
        current: "Controlled Expansion",
        future: "The $5,000 Major Target",
        caption:
          "When the algorithm hits your directional bias, your patience is letting the trade expand into a real high-value signature instead of cutting for pennies.",
      },
      command:
        "Use your custom Volume Gaps as strict target zones. Never close a flawless setup early unless an explicit lower-timeframe structural invalidation forces you out.",
    },
  },
  "Avg Loss": {
    title: "Average Loss",
    formula: "Sum(Losing PnL) / Number of Losers",
    history: "Emphasized heavily by Mark Douglas in 'Trading in the Zone' (2000).",
    importance: "Discipline metric. Drifting upward = you're moving stops or holding losers.",
    improve: ["Hard stops, never moved against you", "Cut losers at planned invalidation, no exceptions"],
    narrative: {
      originStory:
        "Inside the trading pits of the Chicago Mercantile Exchange, veterans told rookies: the market is a mirror — it doesn't destroy you because your analysis is wrong; it destroys you because you refuse to accept the reality of a loss. Average Loss is the ultimate measurement of your defensive discipline.",
      quantCode: "Average Loss = Σ(Gross Losses) / Number of Losing Trades",
      phase: {
        past: "Account-clearing catastrophic dips",
        current: "Managed Risk Floor",
        future: "Strict <$500 Cap",
        caption:
          "By implementing strict micro-lot controls, you've eliminated the catastrophic single-night losses that used to wipe months of progress.",
      },
      command:
        "When you scale into your funded evaluation, this parameter must be locked down using hard, automated stops. Never let an intraday trade breathe past its invalidation array.",
    },
  },
  "Max Drawdown": {
    title: "Maximum Drawdown",
    formula: "max(Peak Equity − Trough Equity) / Peak Equity",
    history: "Standardized post-LTCM (1998) when volatility metrics failed to predict tail loss.",
    importance: "The worst peak-to-valley pain — what you'd actually feel. Funded firms fail you here.",
    improve: [
      "Reduce position size after consecutive losses",
      "Cap daily loss limit to prevent cascade",
      "Diversify across uncorrelated instruments",
    ],
    benchmark: "Pro target: <20% MDD. Funded rules: usually 10%.",
    narrative: {
      originStory:
        "In 1998, Long-Term Capital Management — run by Nobel laureates — collapsed and nearly broke the global financial system. They had the most advanced equations in human history, but they assumed volatility would always remain normal. They hit an unprecedented max drawdown that wiped out billions in days because they forgot that under high pressure, liquidity vanishes.",
      quantCode: "Max Drawdown = (Peak Equity − Trough Equity) / Peak Equity × 100",
      phase: {
        past: "Depression / Valley of 2022–2024",
        current: "Equity Drawdown — fire-tested",
        future: "<5% Prop Standard",
        caption:
          "The most sacred line in your journal. It doesn't just track your account — it mirrors your life. You survived a deep valley, and this number represents the raw heat you were refined in.",
      },
      command:
        "Prop firms like FTMO disqualify you at 10%. When you step to the terminal for Fed speeches, your only job is to defend this floor.",
    },
  },
  "Ulcer Index": {
    title: "Ulcer Index",
    formula: "√( mean(drawdown%²) )",
    history: "Peter Martin, 1987 — named because deep, prolonged drawdowns cause literal ulcers.",
    importance: "Penalizes the DURATION of pain, not just depth. Better stress metric than Max DD.",
    improve: ["Cut losers faster to shorten underwater time", "Avoid revenge-trading during drawdown"],
    benchmark: "<5 = comfortable, 5–10 = stressful, >10 = painful.",
    narrative: {
      originStory:
        "In 1987, technical analyst Peter Martin realized standard volatility metrics were flawed — they penalized profitable upward spikes. He invented the Ulcer Index to measure one thing: the psychological distress of being underwater. It calculates not just how deep your drawdown is, but exactly how long you stay trapped before making a new equity high.",
      quantCode: "Ulcer Index = √( Σ(% drawdown from peak)² / N )",
      phase: {
        past: "High volatility panic",
        current: "Painful Area",
        future: "<5.0 Comfortable Flow",
        caption:
          "Your account spends too much time lingering in prolonged drawdowns because you occasionally let trades carry into consolidations.",
      },
      command:
        "Implement your weekend closure rules ruthlessly. Don't leave trades floating over the weekend unless securely protected at break-even.",
    },
  },
  "Sharpe (per trade)": {
    title: "Sharpe Ratio",
    formula: "(Mean Return − Risk-Free Rate) / Std Dev",
    history: "William F. Sharpe, 1966 — Nobel Prize 1990.",
    importance: "Return per unit of risk. Penalizes ALL volatility, including upside.",
    improve: ["Reduce trade-to-trade PnL variance", "Avoid oversized 'home-run' bets"],
    benchmark: "Per trade: >0.3 good. Annualized: >1 good, >2 elite.",
    narrative: {
      originStory:
        "In 1966, William F. Sharpe developed a formula to calculate portfolio efficiency, earning the Nobel Prize. He solved a basic problem: a fund manager making 50% returns by gambling wildly isn't smart — they're lucky. Sharpe built a ratio that penalizes you for every bit of irregular variance you introduce into your equity curve.",
      quantCode: "Sharpe = (Mean PnL − Risk-Free Rate) / Std Dev of PnL",
      phase: {
        past: "Wild account swings",
        current: "Initial Baseline Setup",
        future: ">2.0 Institutional Benchmark",
        caption:
          "Reset clean with controlled micro-lots. The goal is a steady, smooth upward incline — no erratic spikes.",
      },
      command:
        "Wall Street allocators look at this before they look at your net profit. Keep your position sizing completely uniform — treat every setup with the same clinical risk math.",
    },
  },
  "Sortino (per trade)": {
    title: "Sortino Ratio",
    formula: "(Mean Return − MAR) / Downside Deviation",
    history: "Frank Sortino, late 1980s — fixes Sharpe's flaw of penalizing upside.",
    importance: "Only counts harmful (downside) variance.",
    improve: ["Shrink losing-trade distribution", "Avoid catastrophic single losses"],
    benchmark: "Per trade: >0.5 good. Annualized: >2 strong.",
    narrative: {
      originStory:
        "Dr. Frank Sortino looked at Sharpe's Nobel-winning formula and saw a flaw: it penalized massive winning days just as harshly as losing days. Sortino adjusted the math to divide excess returns exclusively by downside deviation — ignoring your winning runs and looking purely at the volatility of your errors.",
      quantCode: "Sortino = (Mean PnL − Risk-Free Rate) / σ_downside",
      phase: {
        past: "Panicking during normal pullbacks",
        current: "Defensive Inception",
        future: ">3.0 Pristine Risk Model",
        caption:
          "Because you're timing entries at structural volume gaps and bond iFVGs, your downside volatility stays naturally small.",
      },
      command:
        "A trailing stop protocol is your best friend. Once a trade hits the first partial target, move to safety — that keeps your downside variance perfectly clean.",
    },
  },
  "Recovery Factor": {
    title: "Recovery Factor",
    formula: "Net Profit / Max Drawdown",
    history: "Popularized by Jack Schwager in 'Market Wizards' (1989).",
    importance: "How many times over your profits can pay off your historical drawdown.",
    improve: ["Reduce drawdown depth", "Grow net profit (let winners run)"],
    benchmark: ">2 healthy, >5 elite.",
    narrative: {
      originStory:
        "Jack Schwager created Recovery Factor to settle a debate among institutional allocators. He proved that an account making 100% returns with a 50% drawdown is structurally weaker than one making 20% with a 2% drawdown. This metric measures how many times your net profits can completely pay off your historical drawdown debt.",
      quantCode: "Recovery Factor = Net Profit / Maximum Drawdown",
      phase: {
        past: "Stuck in deep equity holes",
        current: "Initial Climb",
        future: ">3.0 Absolute Freedom",
        caption:
          "This curve tracks your resilience — building net profits to systematically overwrite the memory of your old drawdowns.",
      },
      command:
        "When recovering from drawdown, never speed up by doubling risk. Let your positive expectancy do the heavy lifting safely over time.",
    },
  },
  "Std Dev": {
    title: "Standard Deviation of PnL",
    formula: "√( Σ(x − mean)² / N )",
    history: "Pearson (1894); brought into finance by Markowitz (1952).",
    importance: "How much your trade-to-trade PnL bounces around — the 'risk' inside Sharpe.",
    improve: ["Standardize position size as % risk, not fixed lots", "Avoid wildly oversized trades"],
    narrative: {
      originStory:
        "In 1894 Karl Pearson formalized standard deviation to map normal variations in natural sciences. In 1952 Harry Markowitz integrated this calculation into Modern Portfolio Theory, defining standard deviation as the statistical definition of 'Risk'.",
      quantCode: "σ = √( Σ(x − μ)² / N )",
      phase: {
        past: "Erratic account shocks",
        current: "Volatility Signature",
        future: "Standardized Flow",
        caption:
          "Your historical curve shows a massive volatility footprint — large unmanaged dollar swings before you embraced fixed micro-lots.",
      },
      command:
        "Execute fixed micro-lot sizes consistently — that forces this variance to shrink and gives you complete emotional peace of mind.",
    },
  },
  "Largest Win": {
    title: "Largest Win",
    formula: "max(Winning PnL)",
    history: "Outlier metric used in TradeStation reports since the 90s.",
    importance: "If a single trade is 5×+ your avg win, your stats may be flattered by luck.",
    improve: ["Don't anchor expectations on outliers", "Study the setup — skill or randomness?"],
  },
  "Largest Loss": {
    title: "Largest Loss",
    formula: "min(Losing PnL)",
    history: "Highlighted in risk literature since Barings / Leeson (1995).",
    importance: "Your worst single day. If much bigger than avg loss, your stops failed once.",
    improve: ["Hard broker-side stops, not mental stops", "Cap max position size relative to equity"],
  },
  "Max Win Streak": {
    title: "Maximum Win Streak",
    formula: "Longest consecutive run of wins",
    history: "From sports analytics and casino theory.",
    importance: "Dangerous — breeds overconfidence and oversized next-trade risk.",
    improve: ["Don't increase size during a streak", "Re-read rules every 5 consecutive wins"],
    narrative: {
      originStory:
        "B.F. Skinner discovered 'Intermittent Reinforcement' — winning in irregular patterns triggers a massive dopamine rush in the primitive brain. In trading, a long win streak is the most dangerous psychological landmine in existence because it tricks the subconscious into believing it can no longer lose, right at the market's turning point.",
      quantCode: "Max Win Streak = max( Consecutive Profitable Trades )",
      phase: {
        past: "Overconfidence / God-complex",
        current: "Consecutive Wins Baseline",
        future: "Managed Streaks",
        caption:
          "Peak alignment with institutional order flow — but also the exact point where risk rules must turn to iron to protect against arrogance.",
      },
      command:
        "When the live account prints a heavy streak, slow down. Re-read your risk protocols before clicking the next execution to ensure your ego isn't forcing a subpar setup.",
    },
  },
  "Max Loss Streak": {
    title: "Maximum Loss Streak",
    formula: "Longest consecutive run of losses",
    history: "Used since the 1960s to size risk budgets.",
    importance: "Determines whether your risk-per-trade is sane.",
    improve: ["Size so max streak = <15% drawdown", "Pause after 3 consecutive losses"],
    narrative: {
      originStory:
        "In 1940, 'Gambler's Fallacy' was formalized to map a lethal human delusion: that after five losses, a win is 'due'. In reality, the market has no memory. Even world-class algorithms with high win rates can endure 5–7 consecutive losses due to pure regime shifts.",
      quantCode: "Max Loss Streak = max( Consecutive Losing Trades )",
      phase: {
        past: "Despair / revenge cycles",
        current: "Historical Friction Baseline",
        future: "Circuit-Breaker Guardrail",
        caption:
          "Survival means staying calm when the market algorithm is temporarily out of sync with your technical setup.",
      },
      command:
        "If you print 3 consecutive losses in a week, automatic circuit-breaker: step away for 24 hours, journal, and check if the macro framework shifted under your feet.",
    },
  },
  "Current Streak": {
    title: "Current Streak",
    formula: "Consecutive wins/losses up to most recent trade",
    history: "Real-time discipline check used in prop-firm dashboards.",
    importance: "Behavioral signal in real time.",
    improve: ["Stop after N losses in a row", "Don't double up to 'get even'"],
    narrative: {
      originStory:
        "In cognitive neuroscience, researchers track 'regime alignment' — the moment decisions are in synchronized harmony with an evolving environment. Your Current Streak card tracks your real-time sync with the market's macro regime. A long streak isn't a license for arrogance — it's a statistical warning that the regime is about to switch.",
      quantCode: "Current Streak = running count of consecutive outcomes (W or L)",
      phase: {
        past: "Revenge trading to 'get even'",
        current: "Running Tally",
        future: "Automated Regime Toggle",
        caption:
          "A short loss streak means the immediate order flow hit a friction point. It's a completely normal statistical signature.",
      },
      command:
        "Do not let a minor loss streak trigger an emotional response. Respect the sequence and wait for the next high-probability array.",
    },
  },
  "CAGR": {
    title: "Compound Annual Growth Rate",
    formula: "(End / Start)^(1/years) − 1",
    history: "Standard finance metric since the 1950s.",
    importance: "Annualized growth — lets you compare to any benchmark.",
    improve: ["Compound — don't withdraw all profits", "Reduce drawdowns"],
    benchmark: "S&P long-run ≈ 10%. Active retail target: 20–40% with controlled DD.",
    narrative: {
      originStory:
        "CAGR is the definitive metric utilized by global sovereign wealth funds to evaluate long-term wealth compounding. It strips away weekly/monthly illusions and answers one cold question: if this account grew at a steady compounded rate every year, what is its true structural trajectory?",
      quantCode: "CAGR = (Ending Balance / Beginning Balance)^(1/Y) − 1",
      phase: {
        past: "Chasing instant millions over a weekend",
        current: "Annualized Compound Curve",
        future: "Exponential Scale",
        caption:
          "Your escape velocity from the retail gamble. You're thinking like a multi-year fund allocator instead of a signal-chaser.",
      },
      command:
        "Reinvest small, consistent profits with ironclad risk controls. Protect this compounding trajectory and the math of exponential growth handles your freedom.",
    },
  },
  "Total P&L": {
    title: "Total Profit & Loss",
    formula: "Σ(all closed trade PnL)",
    history: "The original metric — older than the ticker tape.",
    importance: "The scoreboard. Meaningless without risk context.",
    improve: ["Focus on process metrics, not this", "Track $ per unit of risk"],
    narrative: {
      originStory:
        "In the history of double-entry bookkeeping — pioneered by Luca Pacioli in 1494 — the P&L statement was designed to strip away theory, narrative, and speculation. It is the absolute scoreboard of a business. In trading, it evaluates your raw execution precision, independent of your beliefs or plans.",
      quantCode: "Total PnL = Σ(Gross Profits) − Σ(Gross Losses) − Commissions",
      phase: {
        past: "Blowing accounts repeatedly due to chaos",
        current: "Positive Net Balance",
        future: "Sovereign Target",
        caption:
          "Undeniable proof your year of study is reality. You are maintaining a positive net ledger on a live trading account.",
      },
      command:
        "This green number belongs entirely to you. Nobody can take this execution history away. Protect this green wall at all costs.",
    },
  },
  "Gross Profit": {
    title: "Gross Profit",
    formula: "Σ(Winning Trades PnL)",
    history: "Half of Profit Factor — standard in performance reports.",
    importance: "How much your winners contributed in total.",
    improve: ["Let winners run", "Take fewer mediocre setups"],
    narrative: {
      originStory:
        "Isolated by early industrial accountants to measure the raw capacity of an asset engine before operational friction. In quantitative trading, Gross Profit calculates the maximum cash your technical edge can extract from the market when setups hit their targets flawlessly.",
      quantCode: "Gross Profit = Σ(All Winning Trades)",
      phase: {
        past: "Tiny, fear-based winning spikes",
        current: "Extracted Liquidity",
        future: "Institutional Scale",
        caption:
          "Your raw extraction engine proves the technical model can identify and target institutional pools of liquidity.",
      },
      command:
        "Your edge has massive power. Your only task now is to manage the operational friction (gross losses) so this raw engine translates into sovereign freedom.",
    },
  },
  "Gross Loss": {
    title: "Gross Loss",
    formula: "Σ(Losing Trades PnL)",
    history: "The other half of Profit Factor — emphasized in risk reporting.",
    importance: "The total cost of being wrong.",
    improve: ["Cut losses at predefined invalidation", "Skip lowest-edge setups"],
    narrative: {
      originStory:
        "The unavoidable cost of running a global financial business. Systematic fund managers do not view a gross loss as failure — they view it like a factory owner views electricity or raw inventory. The objective isn't a system with zero losses (mathematically impossible) — it's to ensure losses never breach the structural walls of your risk model.",
      quantCode: "Gross Loss = Σ(All Losing Trades)",
      phase: {
        past: "Unmanaged, compounding account leakage",
        current: "Managed Friction",
        future: "Optimized Capital Defense",
        caption:
          "This tracks operational overhead. Because Gross Profit is larger, your head is safely above water — you are managing the friction of the machine.",
      },
      command:
        "Treat losses as administrative costs. When a trade hits stop, it isn't an attack on your character — it's the price of doing business. Pay the fee calmly and wait for the next setup.",
    },
  },
  "Break-Even": {
    title: "Break-Even Trades",
    formula: "Count of trades with PnL ≈ $0",
    history: "Modern journaling stat — Edgewonk/TradeZella circa 2017.",
    importance: "Too many BE = you're moving stops too early, choking winners.",
    improve: ["Don't move to BE before 1R favorable", "Let setups breathe"],
    narrative: {
      originStory:
        "Pioneered by tactical trend-followers who understood capital preservation is the first law of survival. They engineered the break-even protocol to protect accounts against unexpected macro shocks — central bank shifts, manual interventions — by neutralizing a trade at zero cost the moment order flow turned chaotic.",
      quantCode: "Break-Even Count = count of trades where Net PnL = 0",
      phase: {
        past: "Holding losers out of hope",
        current: "$0 Baseline",
        future: "The Iron Shield",
        caption:
          "As position sizes scale into prop evaluation limits, this card becomes your ultimate tactical shield.",
      },
      command:
        "A break-even trade is a massive win — it represents preservation of your mental and financial capital. Use it selectively once price has cleanly expanded past the first lower-timeframe liquidity array.",
    },
  },
  "R-Expectancy": {
    title: "R-Expectancy",
    formula: "Mean( PnL / Risk Amount )",
    history: "Van Tharp's invention (1990s).",
    importance: "Cleanest measure of edge — comparable across instruments.",
    improve: [
      "Cut sub-1R setups from your playbook",
      "Push planned targets to 2R+ when structure allows",
      "Don't average down",
    ],
    benchmark: ">0.2R = profitable. >0.5R = elite.",
    narrative: {
      originStory:
        "Formulated in institutional prop houses to measure a trader's behavioral fidelity. Allocators discovered a retail trader can make money by breaking rules during a lucky trend, but inevitably blows it back when the regime changes. R-Expectancy measures the expectancy of your setups ONLY when you strictly follow your pre-flight rule parameters.",
      quantCode: "R-Expectancy = Σ(R-Multiplier of planned setups) / Total Trades",
      phase: {
        past: "Chasing random internet noise",
        current: "Tracking Adherence",
        future: "100% Protocol Fidelity",
        caption:
          "Your behavioral checkpoint. By requiring entry parameters like 'rules followed', you force confrontation with discipline every time you log a setup.",
      },
      command:
        "Keep this score flawless. Adding SL/TP to upcoming trades unlocks the full module, revealing your true strength as a systematic fund manager.",
    },
  },
  "Avg Planned R:R": {
    title: "Average Planned Reward:Risk",
    formula: "Mean( TP distance / SL distance )",
    history: "Formalized by Alexander Elder and Van Tharp.",
    importance: "Asymmetry you target. <2:1 demands >50% win rate to profit.",
    improve: ["Only take ≥2:1 setups", "Stops at real structural invalidation"],
    benchmark: ">2 healthy. >3 selective. <1.5 demands high win rate.",
  },
  "Hit-Rate vs Plan": {
    title: "Hit-Rate vs Plan",
    formula: "% of winners that reached ≥90% of planned TP",
    history: "Modern execution-quality metric used by prop firms.",
    importance: "Tells you if your TPs are realistic.",
    improve: ["Place TP at real liquidity/structure", "Use partials at 1R then trail"],
  },
  "Discipline Score": {
    title: "Discipline Score",
    formula: "% of trades marked 'rules followed' / total trades",
    history: "Pioneered in Edgewonk (2016).",
    importance: "The only metric that measures YOU, not your system.",
    improve: ["Define rules in writing before the day", "Block trades that fail any rule"],
    benchmark: ">80% = professional. <50% = your edge is luck.",
    narrative: {
      originStory:
        "In professional prop firms, risk allocators monitor a metric that has nothing to do with money: Plan Adherence. A trader who makes $10,000 by breaking rules is a liability; a trader who loses $500 while strictly following protocol is an asset.",
      quantCode: "PAS = (Trades Executed Per Protocol / Total Executed Trades) × 100",
      phase: {
        past: "Chasing random internet signals",
        current: "Manual Adherence",
        future: "100% Sovereign Automation",
        caption:
          "By stepping away from public discord noise and locking focus onto your custom bond and volume gap arrays, you've driven your behavioral score upward.",
      },
      command:
        "This is your true net worth as a professional. Let the retail crowd chase every green candle — you keep this adherence metric flawless.",
    },
  },
  "Avg Time (Wins)": {
    title: "Average Time in Winning Trades",
    formula: "Mean( exit_time − entry_time ) for winners",
    history: "Used by systematic funds since the 80s.",
    importance: "Should be LONGER than time in losing trades.",
    improve: ["Let winners breathe via trailing stops", "Don't snatch profit before TP"],
  },
  "Avg Time (Losses)": {
    title: "Average Time in Losing Trades",
    formula: "Mean( exit_time − entry_time ) for losers",
    history: "Tracked in Edgewonk/TradeZella to surface 'hope trading'.",
    importance: "Should be SHORTER than time in winners. If longer = hope trading.",
    improve: ["Hard stop, no exceptions", "Time-based stops: out if not working in N candles"],
  },
  "Revenge Trades": {
    title: "Revenge Trade Detector",
    formula: "Trades with above-average lot size opened <60min after a loss",
    history: "Documented by Mark Douglas and Brett Steenbarger.",
    importance: "The single most expensive behavioral mistake.",
    improve: [
      "Mandatory 30–60 min cooldown after any loss",
      "Cap risk to half-size for the next trade after a loss",
      "Walk away after 2 losses in a row",
    ],
    benchmark: "Target: 0.",
  },
  "Coverage": {
    title: "Plan Coverage",
    formula: "Trades with SL + TP logged / Total trades",
    history: "Data-quality metric — you can't measure what you don't record.",
    importance: "Higher % = more accurate Quant Lab.",
    improve: ["Log SL/TP/Risk on every trade", "Backfill recent trades from broker statement"],
    benchmark: "Aim for 100%.",
  },
};
