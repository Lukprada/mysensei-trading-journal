import { useTrading } from "@/contexts/TradingContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Trash2,
  BookOpen,
  ChevronDown,
  Layers,
  CornerDownRight,
  PenLine,
  Activity,
  Target,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo, Fragment } from "react";
import { TradeJournalPanel } from "@/components/TradeJournalPanel";
import { buildTradeBundles } from "@/lib/tradeBundle";

const TradeLog = () => {
  const { trades, deleteTrade } = useTrading();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "wins" | "losses">("all");
  const [openJournalKey, setOpenJournalKey] = useState<string | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const bundles = useMemo(() => buildTradeBundles(trades), [trades]);
  const filtered = bundles.filter((bundle) => {
    if (filter === "wins") return bundle.totalPnl > 0;
    if (filter === "losses") return bundle.totalPnl < 0;
    return true;
  });

  const winCount = bundles.filter((bundle) => bundle.totalPnl > 0).length;
  const netPnl = bundles.reduce((sum, bundle) => sum + bundle.totalPnl, 0);
  const totalLots = bundles.reduce((sum, bundle) => sum + bundle.totalLots, 0);
  const winRate = bundles.length ? (winCount / bundles.length) * 100 : 0;

  const metrics = [
    { label: "Net performance", value: `${netPnl >= 0 ? "+" : "-"}$${Math.abs(netPnl).toFixed(2)}`, icon: WalletCards, tone: netPnl >= 0 ? "text-profit" : "text-loss" },
    { label: "Win rate", value: `${winRate.toFixed(1)}%`, icon: Target, tone: "text-foreground" },
    { label: "Positions", value: bundles.length.toString(), icon: Activity, tone: "text-foreground" },
    { label: "Volume", value: `${totalLots.toFixed(2)} lots`, icon: Layers, tone: "text-foreground" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-10">
      <header className="flex flex-col gap-5 border-b border-border/70 pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase text-primary">
            <span className="h-px w-8 bg-primary/60" />
            Execution archive
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">Trade Log</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Every position, fill, and journal entry in one focused workspace.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-1 rounded-md border border-border bg-card p-1 shadow-sm">
          {(["all", "wins", "losses"] as const).map((item) => (
            <Button
              key={item}
              type="button"
              variant={filter === item ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter(item)}
              className="h-8 min-w-20 rounded px-4 text-[11px] font-semibold uppercase"
            >
              {item}
            </Button>
          ))}
        </div>
      </header>

      <section className="grid grid-cols-2 border-y border-border/70 bg-card/50 lg:grid-cols-4" aria-label="Trading summary">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className={`relative px-4 py-5 sm:px-6 ${index % 2 !== 0 ? "border-l border-border/70" : ""} ${index > 1 ? "border-t border-border/70 lg:border-t-0" : ""} ${index === 2 ? "lg:border-l" : ""}`}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">{metric.label}</span>
                <Icon className="h-4 w-4 text-primary/70" aria-hidden="true" />
              </div>
              <div className={`font-mono-numbers text-xl font-semibold sm:text-2xl ${metric.tone}`}>{metric.value}</div>
            </div>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-md border border-border bg-card shadow-[0_16px_50px_-36px_hsl(var(--foreground)/0.35)]">
        <div className="flex items-center justify-between border-b border-border bg-secondary/25 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-profit opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-profit" />
            </span>
            <span className="text-xs font-semibold text-foreground">Position ledger</span>
          </div>
          <span className="font-mono-numbers text-[11px] text-muted-foreground">{filtered.length} of {bundles.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px]">
            <thead>
              <tr className="border-b border-border/70 bg-background/30">
                <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase text-muted-foreground">Date</th>
                <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase text-muted-foreground">Position</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase text-muted-foreground">Side</th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase text-muted-foreground">Lots</th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase text-muted-foreground">Pips</th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase text-muted-foreground">P&amp;L</th>
                <th className="px-6 py-3 text-right text-[10px] font-semibold uppercase text-muted-foreground">Journal & actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map((bundle, index) => {
                const trade = bundle.primary;
                const isOpen = openJournalKey === bundle.key;
                const isExpanded = expandedKey === bundle.key;
                const hasJournal = Boolean(trade.journalNotes?.trim() || trade.tradingviewLinks?.length);
                const isWin = bundle.totalPnl >= 0;

                return (
                  <Fragment key={bundle.key}>
                    <motion.tr
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.025, 0.3), duration: 0.25 }}
                      className="group transition-colors hover:bg-secondary/25"
                    >
                      <td className="relative px-6 py-4 whitespace-nowrap">
                        <span className={`absolute inset-y-3 left-0 w-0.5 rounded-r ${isWin ? "bg-profit" : "bg-loss"}`} />
                        <div className="font-mono-numbers text-xs font-medium text-foreground">{bundle.lastDate}</div>
                        {bundle.linked && bundle.firstDate !== bundle.lastDate && (
                          <div className="mt-1 text-[10px] text-muted-foreground">Opened {bundle.firstDate}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-foreground">{trade.asset}</div>
                        {bundle.linked ? (
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={() => setExpandedKey(isExpanded ? null : bundle.key)}
                            className="mt-1 h-auto p-0 text-[10px] font-semibold uppercase text-primary"
                          >
                            <Layers className="mr-1.5 h-3 w-3" />
                            {bundle.fills.length} linked fills
                            <ChevronDown className={`ml-1 h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </Button>
                        ) : (
                          <div className="mt-1 text-[10px] text-muted-foreground">Single execution</div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[10px] font-semibold uppercase ${trade.direction === "long" ? "border-profit/25 bg-profit/10 text-profit" : "border-loss/25 bg-loss/10 text-loss"}`}>
                          {trade.direction === "long" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {trade.direction}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-mono-numbers text-xs text-muted-foreground">{bundle.totalLots.toFixed(2)}</td>
                      <td className={`px-5 py-4 text-right font-mono-numbers text-xs font-medium ${bundle.totalPips >= 0 ? "text-profit" : "text-loss"}`}>
                        {bundle.totalPips > 0 ? "+" : ""}{bundle.totalPips.toFixed(1)}
                      </td>
                      <td className={`px-5 py-4 text-right font-mono-numbers text-sm font-semibold ${isWin ? "text-profit" : "text-loss"}`}>
                        {isWin ? "+" : "-"}${Math.abs(bundle.totalPnl).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant={hasJournal ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => setOpenJournalKey(isOpen ? null : bundle.key)}
                            className="h-8 min-w-24 rounded text-[10px] font-semibold uppercase"
                          >
                            {hasJournal ? <BookOpen className="mr-1.5 h-3.5 w-3.5" /> : <PenLine className="mr-1.5 h-3.5 w-3.5" />}
                            {hasJournal ? "Journal" : "Write"}
                            <ChevronDown className={`ml-1 h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => navigate(`/trade/${trade.id}`)} aria-label={`View ${trade.asset} trade`}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-loss" onClick={() => deleteTrade(trade.id)} aria-label={`Delete ${trade.asset} trade`}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>

                    <AnimatePresence initial={false}>
                      {isExpanded && bundle.linked && bundle.fills.map((fill) => (
                        <motion.tr
                          key={`${bundle.key}-${fill.id}`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-secondary/20 text-xs"
                        >
                          <td className="py-3 pl-10 pr-6 font-mono-numbers text-muted-foreground">
                            <span className="inline-flex items-center gap-2"><CornerDownRight className="h-3 w-3 text-primary/60" />{fill.date}</span>
                          </td>
                          <td className="px-6 py-3 font-mono-numbers text-muted-foreground">{fill.entryPrice} → {fill.exitPrice}</td>
                          <td className="px-4 py-3 capitalize text-muted-foreground">{fill.direction}</td>
                          <td className="px-5 py-3 text-right font-mono-numbers text-muted-foreground">{fill.positionSize}</td>
                          <td className={`px-5 py-3 text-right font-mono-numbers ${fill.pips >= 0 ? "text-profit" : "text-loss"}`}>{fill.pips > 0 ? "+" : ""}{fill.pips}</td>
                          <td className={`px-5 py-3 text-right font-mono-numbers ${fill.pnl >= 0 ? "text-profit" : "text-loss"}`}>{fill.pnl >= 0 ? "+" : ""}${fill.pnl.toFixed(2)}</td>
                          <td className="px-6 py-3 text-right">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => navigate(`/trade/${fill.id}`)} aria-label={`View ${fill.asset} fill`}>
                              <Eye className="h-3 w-3" />
                            </Button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.tr key={`${bundle.key}-journal`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-background/45">
                          <td colSpan={7} className="border-y border-primary/20 px-6 py-6">
                            <TradeJournalPanel trade={trade} />
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">No {filter === "all" ? "" : filter} positions found.</div>
        )}
      </section>
    </div>
  );
};

export default TradeLog;
