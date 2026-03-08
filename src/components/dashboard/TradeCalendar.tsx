import { useTrading } from "@/contexts/TradingContext";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isToday,
  addMonths, subMonths,
} from "date-fns";

type Period = "month" | "last-month" | "week" | "day" | "all";

export function TradeCalendar() {
  const { trades } = useTrading();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [period, setPeriod] = useState<Period>("month");

  const tradesByDate = useMemo(() => {
    const map = new Map<string, { wins: number; losses: number; total: number; pnl: number; ids: string[] }>();
    trades.forEach((t) => {
      const key = t.date;
      const existing = map.get(key) || { wins: 0, losses: 0, total: 0, pnl: 0, ids: [] };
      existing.total++;
      existing.pnl += t.pnl;
      existing.ids.push(t.id);
      if (t.pnl > 0) existing.wins++;
      else if (t.pnl < 0) existing.losses++;
      map.set(key, existing);
    });
    return map;
  }, [trades]);

  const displayDate = period === "last-month" ? subMonths(currentDate, 1) : currentDate;

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(displayDate);
    const monthEnd = endOfMonth(displayDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [displayDate]);

  const periodStats = useMemo(() => {
    let filtered = trades;
    const now = new Date();
    if (period === "month") {
      filtered = trades.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
      });
    } else if (period === "last-month") {
      const lm = subMonths(currentDate, 1);
      filtered = trades.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
      });
    } else if (period === "week") {
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      filtered = trades.filter((t) => new Date(t.date) >= weekStart);
    } else if (period === "day") {
      const today = format(now, "yyyy-MM-dd");
      filtered = trades.filter((t) => t.date === today);
    }
    const wins = filtered.filter((t) => t.pnl > 0).length;
    const losses = filtered.filter((t) => t.pnl < 0).length;
    const pnl = filtered.reduce((s, t) => s + t.pnl, 0);
    return { total: filtered.length, wins, losses, pnl };
  }, [trades, period, currentDate]);

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="glass-card rounded-xl p-5 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
          Trade Calendar
        </h3>
        <div className="flex items-center gap-1">
          {(["day", "week", "month", "last-month", "all"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 text-[10px] rounded-md transition-all duration-200 capitalize font-medium ${
                period === p
                  ? "bg-primary/15 text-primary border border-primary/20 shadow-[0_0_10px_hsl(var(--primary)/0.08)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {p === "last-month" ? "Last" : p === "month" ? "Month" : p}
            </button>
          ))}
        </div>
      </div>

      {/* Period summary */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: "Trades", value: periodStats.total, color: "text-foreground" },
          { label: "Wins", value: periodStats.wins, color: "text-profit" },
          { label: "Losses", value: periodStats.losses, color: "text-loss" },
          { label: "P&L", value: `${periodStats.pnl >= 0 ? "+" : ""}$${periodStats.pnl.toFixed(0)}`, color: periodStats.pnl >= 0 ? "text-profit" : "text-loss" },
        ].map((item) => (
          <div key={item.label} className="rounded-lg bg-secondary/30 border border-border/30 p-2.5 text-center">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
            <p className={`text-base font-bold font-mono-numbers mt-0.5 ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setCurrentDate((d) => subMonths(d, 1))} className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground transition-all hover:text-primary">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-bold text-foreground font-display tracking-[0.15em]">
          {format(displayDate, "MMMM yyyy").toUpperCase()}
        </span>
        <button onClick={() => setCurrentDate((d) => addMonths(d, 1))} className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground transition-all hover:text-primary">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekdays.map((d) => (
          <div key={d} className="text-center text-[9px] text-muted-foreground py-1 uppercase tracking-wider">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayTrades = tradesByDate.get(dateKey);
          const inMonth = isSameMonth(day, displayDate);
          const today = isToday(day);

          return (
            <motion.div
              key={dateKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.006 }}
              onClick={() => {
                if (dayTrades && dayTrades.ids.length === 1) {
                  navigate(`/trade/${dayTrades.ids[0]}`);
                }
              }}
              className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all duration-200
                ${!inMonth ? "opacity-15" : ""}
                ${today ? "ring-1 ring-primary/40 shadow-[0_0_10px_hsl(var(--primary)/0.1)]" : ""}
                ${dayTrades ? "cursor-pointer hover:bg-secondary/50 hover:border-primary/15" : ""}
                ${dayTrades && dayTrades.losses === 0 && dayTrades.wins > 0 ? "bg-profit/8 border border-profit/15" : ""}
                ${dayTrades && dayTrades.wins === 0 && dayTrades.losses > 0 ? "bg-loss/8 border border-loss/15" : ""}
                ${dayTrades && dayTrades.wins > 0 && dayTrades.losses > 0 ? "bg-secondary/30 border border-border/30" : ""}
                ${!dayTrades ? "bg-secondary/10" : ""}
              `}
            >
              <span className={`font-mono-numbers text-[11px] ${today ? "text-primary font-bold" : "text-muted-foreground"}`}>
                {format(day, "d")}
              </span>
              {dayTrades && (
                <div className="flex items-center gap-0.5 mt-0.5">
                  {dayTrades.wins > 0 && <span className="w-1 h-1 rounded-full bg-profit shadow-[0_0_4px_hsl(var(--profit)/0.5)]" />}
                  {dayTrades.losses > 0 && <span className="w-1 h-1 rounded-full bg-loss shadow-[0_0_4px_hsl(var(--loss)/0.5)]" />}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
