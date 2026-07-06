import { useTrading } from "@/contexts/TradingContext";
import { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isToday,
  addMonths, subMonths,
} from "date-fns";

type Period = "month" | "last-month" | "week" | "day" | "all";

interface DayData {
  wins: number;
  losses: number;
  total: number;
  pnl: number;
  winRate: number;
  ids: string[];
}

interface TradeCalendarProps {
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}

export function TradeCalendar({ selectedDate, onSelectDate }: TradeCalendarProps) {
  const { trades } = useTrading();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [period, setPeriod] = useState<Period>("month");

  const tradesByDate = useMemo(() => {
    const map = new Map<string, DayData>();
    trades.forEach((t) => {
      const key = t.date;
      const existing = map.get(key) || { wins: 0, losses: 0, total: 0, pnl: 0, winRate: 0, ids: [] };
      existing.total++;
      existing.pnl += t.pnl;
      existing.ids.push(t.id);
      if (t.pnl > 0) existing.wins++;
      else if (t.pnl < 0) existing.losses++;
      existing.winRate = existing.total > 0 ? (existing.wins / existing.total) * 100 : 0;
      map.set(key, existing);
    });
    return map;
  }, [trades]);

  const displayDate = period === "last-month" ? subMonths(currentDate, 1) : currentDate;

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(displayDate);
    const monthEnd = endOfMonth(displayDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [displayDate]);

  const monthStats = useMemo(() => {
    const monthStart = startOfMonth(displayDate);
    const monthEnd = endOfMonth(displayDate);
    const monthTrades = trades.filter((t) => {
      const d = new Date(t.date);
      return d >= monthStart && d <= monthEnd;
    });
    const pnl = monthTrades.reduce((s, t) => s + t.pnl, 0);
    const tradingDays = new Set(monthTrades.map((t) => t.date)).size;
    return { pnl, tradingDays, total: monthTrades.length };
  }, [trades, displayDate]);

  // Week summaries for sidebar
  const weekSummaries = useMemo(() => {
    const weeks: { weekNum: number; pnl: number; days: number; trades: number }[] = [];
    const monthStart = startOfMonth(displayDate);
    const monthEnd = endOfMonth(displayDate);
    
    let weekStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    let weekNum = 1;
    
    while (weekStart <= monthEnd) {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
      const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
      
      let pnl = 0;
      let days = 0;
      let tradeCount = 0;
      
      weekDays.forEach((day) => {
        if (day >= monthStart && day <= monthEnd) {
          const key = format(day, "yyyy-MM-dd");
          const dayData = tradesByDate.get(key);
          if (dayData) {
            pnl += dayData.pnl;
            days++;
            tradeCount += dayData.total;
          }
        }
      });
      
      weeks.push({ weekNum, pnl, days, trades: tradeCount });
      weekStart = new Date(weekEnd.getTime() + 86400000);
      weekNum++;
    }
    
    return weeks;
  }, [displayDate, tradesByDate]);

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const formatPnl = (pnl: number) => {
    if (Math.abs(pnl) >= 1000) {
      return `${pnl >= 0 ? "" : "-"}$${Math.abs(pnl / 1000).toFixed(1)}K`;
    }
    return `${pnl >= 0 ? "" : "-"}$${Math.abs(pnl).toFixed(0)}`;
  };

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
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-2.5 py-1 text-[10px] rounded-md font-bold tracking-wider bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
          >
            TODAY
          </button>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentDate((d) => subMonths(d, 1))} className="p-1 rounded-md hover:bg-secondary/50 text-muted-foreground transition-all hover:text-primary">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setCurrentDate((d) => addMonths(d, 1))} className="p-1 rounded-md hover:bg-secondary/50 text-muted-foreground transition-all hover:text-primary">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <span className="text-sm font-bold text-foreground font-display tracking-wide">
            {format(displayDate, "MMMM yyyy")}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-mono-numbers">
            Monthly stats: <span className={`font-bold ${monthStats.pnl >= 0 ? "text-profit" : "text-loss"}`}>
              {formatPnl(monthStats.pnl)}
            </span>
          </span>
          <span className="font-mono-numbers">{monthStats.tradingDays} days</span>
        </div>
      </div>

      <MobileSwipeLayout
        weekdays={weekdays}
        calendarDays={calendarDays}
        tradesByDate={tradesByDate}
        displayDate={displayDate}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        weekSummaries={weekSummaries}
        formatPnl={formatPnl}
      />
    </motion.div>
  );
}

interface MobileSwipeLayoutProps {
  weekdays: string[];
  calendarDays: Date[];
  tradesByDate: Map<string, DayData>;
  displayDate: Date;
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  weekSummaries: { weekNum: number; pnl: number; days: number; trades: number }[];
  formatPnl: (pnl: number) => string;
}

function MobileSwipeLayout({
  weekdays, calendarDays, tradesByDate, displayDate,
  selectedDate, onSelectDate, weekSummaries, formatPnl,
}: MobileSwipeLayoutProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" });
  const [pageIdx, setPageIdx] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPageIdx(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  const CalendarGrid = (
    <div className="flex-1 min-w-0">
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekdays.map((d) => (
          <div key={d} className="text-center text-[9px] sm:text-[10px] text-muted-foreground py-1.5 font-medium uppercase tracking-wider">
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{d.charAt(0)}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayTrades = tradesByDate.get(dateKey);
          const inMonth = isSameMonth(day, displayDate);
          const today = isToday(day);
          const isSelected = selectedDate === dateKey;

          const bgClass = !inMonth
            ? "opacity-20"
            : dayTrades
              ? dayTrades.pnl > 0
                ? "bg-profit/10 border border-profit/20 hover:border-profit/40"
                : dayTrades.pnl < 0
                  ? "bg-loss/10 border border-loss/20 hover:border-loss/40"
                  : "bg-secondary/30 border border-border/30"
              : "bg-secondary/5 border border-transparent";

          return (
            <motion.div
              key={dateKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.004 }}
              onClick={() => {
                if (dayTrades) onSelectDate(isSelected ? null : dateKey);
              }}
              className={`relative rounded-md sm:rounded-lg p-1 sm:p-1.5 min-h-[64px] sm:min-h-[72px] flex flex-col transition-all duration-200
                ${bgClass}
                ${dayTrades ? "cursor-pointer" : ""}
                ${today ? "ring-1 ring-primary/50 shadow-[0_0_12px_hsl(var(--primary)/0.15)]" : ""}
                ${isSelected ? "ring-2 ring-primary shadow-[0_0_16px_hsl(var(--primary)/0.25)]" : ""}
              `}
            >
              <span className={`font-mono-numbers text-[10px] sm:text-[11px] leading-none ${today ? "text-primary font-bold" : "text-muted-foreground"}`}>
                {format(day, "d")}
              </span>
              {dayTrades && inMonth && (
                <div className="flex-1 flex flex-col justify-center items-center mt-0.5 sm:mt-1">
                  <span className={`text-[11px] sm:text-sm font-bold font-mono-numbers leading-tight ${dayTrades.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                    {formatPnl(dayTrades.pnl)}
                  </span>
                  <span className="text-[8px] sm:text-[9px] text-muted-foreground font-mono-numbers mt-0.5 hidden sm:block">
                    {dayTrades.total} trade{dayTrades.total !== 1 ? "s" : ""}
                  </span>
                  <span className="text-[8px] sm:text-[9px] text-muted-foreground font-mono-numbers">
                    {dayTrades.winRate.toFixed(0)}%
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  const WeekSummaryBlock = (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {weekSummaries.map((week) => (
        <div key={week.weekNum} className="rounded-lg bg-secondary/20 border border-border/20 p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Week {week.weekNum}</p>
          <p className={`text-base font-bold font-mono-numbers mt-1 ${
            week.pnl > 0 ? "text-profit" : week.pnl < 0 ? "text-loss" : "text-muted-foreground"
          }`}>
            {week.trades > 0 ? formatPnl(week.pnl) : "$0"}
          </p>
          <p className="text-[10px] text-muted-foreground font-mono-numbers mt-0.5">{week.days} days · {week.trades} trades</p>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* Desktop: side-by-side */}
      <div className="hidden lg:flex flex-row gap-4">
        {CalendarGrid}
        <div className="w-28 flex-shrink-0 flex flex-col gap-1.5 pt-7">
          {weekSummaries.map((week) => (
            <div key={week.weekNum} className="rounded-lg bg-secondary/20 border border-border/20 p-2 text-center">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Week {week.weekNum}</p>
              <p className={`text-sm font-bold font-mono-numbers mt-0.5 ${
                week.pnl > 0 ? "text-profit" : week.pnl < 0 ? "text-loss" : "text-muted-foreground"
              }`}>
                {week.trades > 0 ? formatPnl(week.pnl) : "$0"}
              </p>
              <p className="text-[9px] text-muted-foreground font-mono-numbers">{week.days} days</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile/tablet: swipeable pages with dots */}
      <div className="lg:hidden">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            <div className="min-w-0 flex-[0_0_100%] pr-1">{CalendarGrid}</div>
            <div className="min-w-0 flex-[0_0_100%] pl-1">
              <div className="mb-3 text-[10px] text-muted-foreground uppercase tracking-wider text-center">
                Weekly summary · {format(displayDate, "MMMM")}
              </div>
              {WeekSummaryBlock}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mt-3">
          {[0, 1].map((i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-1.5 rounded-full transition-all ${
                pageIdx === i ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
              }`}
              aria-label={i === 0 ? "Calendar" : "Weekly summary"}
            />
          ))}
        </div>
      </div>
    </>
  );
}

