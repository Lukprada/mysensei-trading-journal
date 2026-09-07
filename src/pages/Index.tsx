import { EquityCurve } from "@/components/dashboard/EquityCurve";
import { TradeCalendar } from "@/components/dashboard/TradeCalendar";
import { TradeListPanel } from "@/components/dashboard/TradeListPanel";
import { useTrading } from "@/contexts/TradingContext";
import { motion } from "framer-motion";
import { useState, useRef, useEffect, useMemo } from "react";
import { Link2, RefreshCw, Brain, ArrowUpRight, ArrowDownRight, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const GoldRing = ({ value }: { value: number }) => {
  const r = 60;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90">
        <circle cx="64" cy="64" r={r} stroke="currentColor" strokeWidth="2" fill="transparent" className="text-foreground/5" />
        <circle
          cx="64" cy="64" r={r} stroke="currentColor" strokeWidth="3" fill="transparent"
          strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c}
          strokeLinecap="round" className="text-primary transition-all duration-1000"
        />
      </svg>
      <span className="absolute text-3xl font-display text-primary">{pct.toFixed(0)}%</span>
    </div>
  );
};

const Dashboard = () => {
  const { activeAccount, accounts, allTrades, loading } = useTrading();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const tradePanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedDate && tradePanelRef.current && window.innerWidth < 1024) {
      tradePanelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedDate]);

  const hasAccounts = accounts.length > 0;
  const hasTrades = allTrades.length > 0;

  const stats = useMemo(() => {
    const closed = allTrades.filter((t) => typeof t.pnl === "number");
    const netPnl = closed.reduce((s, t) => s + (t.pnl || 0), 0);
    const wins = closed.filter((t) => (t.pnl || 0) > 0).length;
    const winRate = closed.length ? (wins / closed.length) * 100 : 0;
    const recent = [...closed]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4);
    return { netPnl, winRate, count: closed.length, recent };
  }, [allTrades]);

  const tile = "bg-card border border-primary/10 rounded-md";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-end justify-between"
      >
        <div>
          <h2 className="text-4xl font-display text-foreground">
            {activeAccount ? activeAccount.name : "Overview"}
          </h2>
          <p className="text-xs text-muted-foreground mt-2 uppercase tracking-[0.2em]">
            {activeAccount
              ? `${activeAccount.type.charAt(0).toUpperCase() + activeAccount.type.slice(1)} Account · ${activeAccount.currency}`
              : "Aggregated performance across all accounts"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono-numbers uppercase tracking-widest">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
          Live
        </div>
      </motion.header>

      {!loading && !hasAccounts ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`relative overflow-hidden ${tile} p-10 md:p-14 text-center`}
        >
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.1),transparent_60%)]" />
          <div className="mx-auto h-14 w-14 rounded-full border border-primary/40 flex items-center justify-center mb-5">
            <Link2 className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-2xl font-display italic text-gradient mb-2">No accounts yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Connect Myfxbook to automatically import your live, demo, or funded
            accounts. Each imported account can then be renamed and tagged as Live, Demo, or Funded.
          </p>
          <div className="flex items-center justify-center">
            <Button asChild>
              <Link to="/myfxbook-sync">
                <RefreshCw className="h-4 w-4 mr-2" />
                Connect Myfxbook
              </Link>
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {hasAccounts && !hasTrades && (
            <div className={`md:col-span-3 ${tile} p-5 text-sm text-muted-foreground flex items-center justify-between gap-4 flex-wrap`}>
              <div>
                <span className="text-foreground font-medium">No trades yet on this account.</span>{" "}
                Sync Myfxbook to populate your dashboard.
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to="/myfxbook-sync">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync now
                </Link>
              </Button>
            </div>
          )}

          {/* Hero: Net performance */}
          <div className={`md:col-span-2 ${tile} p-8 flex flex-col justify-between min-h-[220px] relative overflow-hidden`}>
            <div className="relative z-10">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Net Performance</p>
              <h3 className={`text-6xl font-display ${stats.netPnl >= 0 ? "text-primary" : "text-loss"}`}>
                {stats.netPnl >= 0 ? "+" : "−"}${Math.abs(stats.netPnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <div className={`flex items-center gap-2 mt-4 text-sm ${stats.netPnl >= 0 ? "text-profit" : "text-loss"}`}>
                {stats.netPnl >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                <span>{stats.count} closed positions on record</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-full h-32 opacity-15 pointer-events-none">
              <svg viewBox="0 0 400 100" className="w-full h-full" preserveAspectRatio="none">
                <path d="M0 80 Q 50 70, 100 85 T 200 60 T 300 40 T 400 20" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
              </svg>
            </div>
          </div>

          {/* Gold ring: win rate */}
          <div className={`${tile} p-8 flex flex-col items-center justify-center text-center`}>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">Win Rate</p>
            <GoldRing value={stats.winRate} />
          </div>

          {/* Sensei tile */}
          <Link to="/sensei" className={`${tile} p-6 group hover:border-primary/30 transition-colors`}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground">Sensei AI</h4>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your world-class trading psychologist. Bring a position, a journal entry, or a bad week —{" "}
              <span className="text-primary">Sensei dissects it</span>.
            </p>
            <span className="inline-flex items-center gap-1.5 mt-4 text-xs font-medium text-primary">
              Consult Sensei <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>

          {/* Recent executions */}
          <div className={`md:col-span-2 ${tile} p-6`}>
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground">Recent Executions</h4>
              <Link to="/trade-log" className="text-[11px] text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider">
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {stats.recent.length === 0 && (
                <p className="text-sm text-muted-foreground">No executions recorded yet.</p>
              )}
              {stats.recent.map((t, i) => (
                <div key={t.id} className={`flex justify-between items-center ${i < stats.recent.length - 1 ? "border-b border-border/60 pb-3" : ""}`}>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {t.asset} <span className="capitalize text-muted-foreground">{t.direction}</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">{t.date}</span>
                  </div>
                  <span className={`font-display text-lg ${(t.pnl || 0) >= 0 ? "text-profit" : "text-loss"}`}>
                    {(t.pnl || 0) >= 0 ? "+" : "−"}${Math.abs(t.pnl || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Equity curve */}
          <div className="md:col-span-3">
            <EquityCurve />
          </div>

          {/* Calendar + day trades */}
          <div className="md:col-span-2">
            <TradeCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          </div>
          <div ref={tradePanelRef} className="scroll-mt-16">
            <TradeListPanel selectedDate={selectedDate} onClearDate={() => setSelectedDate(null)} />
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
