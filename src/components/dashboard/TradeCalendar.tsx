import { useTrading } from "@/contexts/TradingContext";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isToday,
  addMonths, subMonths, startOfDay, isSameDay,
  subWeeks, subDays
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

  // Filter summary stats based on period
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
    <div className="rounded-lg border border-border bg-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-foreground">Trade Calendar</h3>
        <div className="flex items-center gap-1">
          {(["day", "week", "month", "last-month", "all"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors capitalize ${
                period === p
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {p === "last-month" ? "Last Mo" : p === "month" ? "This Mo" : p}
            </button>
          ))}
        </div>
      </div>

      {/* Period summary */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="rounded-md bg-secondary p-2.5 text-center">
          <p className="text-xs text-muted-foreground">Trades</p>
          <p className="text-lg font-semibold font-mono-numbers text-foreground">{periodStats.total}</p>
        </div>
        <div className="rounded-md bg-secondary p-2.5 text-center">
          <p className="text-xs text-muted-foreground">Wins</p>
          <p className="text-lg font-semibold font-mono-numbers text-profit">{periodStats.wins}</p>
        </div>
        <div className="rounded-md bg-secondary p-2.5 text-center">
          <p className="text-xs text-muted-foreground">Losses</p>
          <p className="text-lg font-semibold font-mono-numbers text-loss">{periodStats.losses}</p>
        </div>
        <div className="rounded-md bg-secondary p-2.5 text-center">
          <p className="text-xs text-muted-foreground">P&L</p>
          <p className={`text-lg font-semibold font-mono-numbers ${periodStats.pnl >= 0 ? "text-profit" : "text-loss"}`}>
            {periodStats.pnl >= 0 ? "+" : ""}${periodStats.pnl.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setCurrentDate((d) => subMonths(d, 1))} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-foreground font-display tracking-wider">
          {format(displayDate, "MMMM yyyy").toUpperCase()}
        </span>
        <button onClick={() => setCurrentDate((d) => addMonths(d, 1))} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekdays.map((d) => (
          <div key={d} className="text-center text-xs text-muted-foreground py-1">{d}</div>
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
              transition={{ delay: i * 0.008 }}
              onClick={() => {
                if (dayTrades && dayTrades.ids.length === 1) {
                  navigate(`/trade/${dayTrades.ids[0]}`);
                }
              }}
              className={`relative aspect-square rounded-md flex flex-col items-center justify-center text-xs transition-all
                ${!inMonth ? "opacity-20" : ""}
                ${today ? "ring-1 ring-primary/50" : ""}
                ${dayTrades ? "cursor-pointer hover:bg-accent" : ""}
                ${dayTrades && dayTrades.losses === 0 && dayTrades.wins > 0 ? "bg-profit/10 border border-profit/20" : ""}
                ${dayTrades && dayTrades.wins === 0 && dayTrades.losses > 0 ? "bg-loss/10 border border-loss/20" : ""}
                ${dayTrades && dayTrades.wins > 0 && dayTrades.losses > 0 ? "bg-accent border border-border" : ""}
                ${!dayTrades ? "bg-secondary/30" : ""}
              `}
            >
              <span className={`font-mono-numbers ${today ? "text-primary font-bold" : "text-muted-foreground"}`}>
                {format(day, "d")}
              </span>
              {dayTrades && (
                <div className="flex items-center gap-0.5 mt-0.5">
                  {dayTrades.wins > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-profit" />
                  )}
                  {dayTrades.losses > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-loss" />
                  )}
                  <span className="text-[9px] font-mono-numbers text-muted-foreground ml-0.5">{dayTrades.total}</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
