import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Newspaper, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

export interface NewsEvent {
  title: string;
  currency: string;
  impact: string;
  time: string;
  forecast: string;
  previous: string;
}

interface Props {
  /** Trade date, YYYY-MM-DD */
  date: string;
  /** Optional: attach a text snapshot of the news into the journal */
  onAttach?: (snapshot: string) => void;
}

const impactColor: Record<string, string> = {
  high: "bg-loss/15 text-loss border-loss/30",
  medium: "bg-primary/15 text-primary border-primary/30",
  low: "bg-muted text-muted-foreground border-border",
  holiday: "bg-muted text-muted-foreground border-border",
};

export function ForexFactoryNews({ date, onAttach }: Props) {
  const [events, setEvents] = useState<NewsEvent[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("forex-news", { body: { date } });
    setLoading(false);
    if (error) {
      toast.error("Couldn't reach the news feed");
      return;
    }
    setEvents(data?.events ?? []);
    setNote(data?.note ?? null);
  }

  function attach() {
    if (!events?.length || !onAttach) return;
    const lines = events.map(
      (e) => `- ${new Date(e.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ${e.currency} · ${e.title} (${e.impact}) forecast ${e.forecast || "—"} / prev ${e.previous || "—"}`,
    );
    onAttach(`\n\n### Market news on ${date} (Forex Factory)\n${lines.join("\n")}\n`);
    toast.success("News attached to journal");
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-primary" /> Market News · {date}
        </h3>
        <div className="flex gap-2">
          {events && events.length > 0 && onAttach && (
            <Button size="sm" variant="ghost" className="gap-1 h-8" onClick={attach}>
              <Plus className="h-3.5 w-3.5" /> Attach
            </Button>
          )}
          <Button size="sm" variant="outline" className="h-8" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : events ? "Refresh" : "Load news"}
          </Button>
        </div>
      </div>

      {!events && !loading && (
        <p className="text-xs text-muted-foreground">
          Pull the real-world economic events that were running when this trade was live — pure record keeping.
        </p>
      )}

      {events && events.length === 0 && (
        <p className="text-xs text-muted-foreground">{note || "No events for this date."}</p>
      )}

      {events && events.length > 0 && (
        <div className="space-y-1.5 max-h-64 overflow-auto pr-1">
          {events.map((e, i) => (
            <div key={i} className="flex items-center gap-2 text-xs p-2 rounded border border-border/40 bg-secondary/20">
              <span className="font-mono-numbers text-muted-foreground shrink-0">
                {new Date(e.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="font-medium shrink-0">{e.currency}</span>
              <span className="truncate flex-1">{e.title}</span>
              <span className={`shrink-0 px-1.5 py-0.5 rounded border text-[10px] uppercase ${impactColor[e.impact] || impactColor.low}`}>
                {e.impact || "n/a"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
