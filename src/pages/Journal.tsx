import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTrading } from "@/contexts/TradingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, Plus, Trash2, Link2, ExternalLink, X, Save, Search, Calendar, Smile,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: string | null;
  tags: string[];
  tradingview_links: string[];
  linked_trade_ids: string[];
  entry_date: string;
  created_at: string;
  updated_at: string;
}

const MOODS = ["🔥 Focused", "😌 Calm", "😤 Frustrated", "🚀 Confident", "😟 Anxious", "🤔 Curious", "😴 Tired"];

function normalizeTV(raw: string): string {
  const url = raw.trim();
  const xMatch = url.match(/tradingview\.com\/x\/([A-Za-z0-9]+)/i);
  if (xMatch) return `https://s3.tradingview.com/snapshots/${xMatch[1][0].toLowerCase()}/${xMatch[1]}.png`;
  return url;
}

export default function Journal() {
  const { user } = useAuth();
  const { allTrades } = useTrading();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const selected = entries.find((e) => e.id === selectedId) || null;

  useEffect(() => { if (user) load(); }, [user?.id]);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load journal");
    setEntries((data || []) as JournalEntry[]);
    setLoading(false);
  }

  async function createEntry() {
    if (!user) return;
    const { data, error } = await supabase
      .from("journal_entries")
      .insert({ user_id: user.id, title: "New entry", content: "" })
      .select().single();
    if (error || !data) return toast.error("Failed to create");
    setEntries((p) => [data as JournalEntry, ...p]);
    setSelectedId(data.id);
  }

  async function update(id: string, patch: Partial<JournalEntry>) {
    const { error } = await supabase.from("journal_entries").update(patch).eq("id", id);
    if (error) return toast.error("Save failed");
    setEntries((p) => p.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  async function remove(id: string) {
    if (!confirm("Delete this entry?")) return;
    const { error } = await supabase.from("journal_entries").delete().eq("id", id);
    if (error) return toast.error("Delete failed");
    setEntries((p) => p.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) =>
      e.title.toLowerCase().includes(q) ||
      e.content.toLowerCase().includes(q) ||
      e.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [entries, search]);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display tracking-wide">Journal</h1>
            <p className="text-xs text-muted-foreground">Your trading notebook — write freely, link trades anytime</p>
          </div>
        </div>
        <Button onClick={createEntry} className="gap-2"><Plus className="h-4 w-4" /> New Entry</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* List */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search entries..." className="pl-9" />
          </div>
          <div className="space-y-1.5 max-h-[70vh] overflow-auto pr-1">
            {loading ? (
              <p className="text-xs text-muted-foreground text-center py-8">Loading...</p>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No entries yet. Create your first one.</p>
              </div>
            ) : filtered.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelectedId(e.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedId === e.id
                    ? "bg-primary/10 border-primary/40 shadow-[0_0_15px_hsl(var(--primary)/0.1)]"
                    : "bg-card/50 border-border/40 hover:border-primary/20"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm truncate">{e.title || "Untitled"}</h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                      {e.content.slice(0, 100) || "No content"}
                    </p>
                  </div>
                  {e.mood && <span className="text-base shrink-0">{e.mood.split(" ")[0]}</span>}
                </div>
                <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(e.entry_date), "MMM d, yyyy")}
                  {e.linked_trade_ids.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-primary/80">
                      <Link2 className="h-3 w-3" />{e.linked_trade_ids.length}
                    </span>
                  )}
                  {e.tradingview_links.length > 0 && <span>📈 {e.tradingview_links.length}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="rounded-lg border border-border bg-card/50 p-4 md:p-6 min-h-[60vh]">
          {selected ? (
            <EntryEditor
              key={selected.id}
              entry={selected}
              trades={allTrades}
              onSave={(patch) => update(selected.id, patch)}
              onDelete={() => remove(selected.id)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-16">
              <BookOpen className="h-12 w-12 opacity-20 mb-3" />
              <p className="text-sm">Select an entry, or create a new one</p>
              <p className="text-xs mt-1 max-w-md">
                Use the journal for daily reflections, market thoughts, or to capture trades that haven't synced yet — then link them later.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EntryEditor({
  entry, trades, onSave, onDelete,
}: {
  entry: JournalEntry;
  trades: any[];
  onSave: (patch: Partial<JournalEntry>) => Promise<void>;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(entry.title);
  const [content, setContent] = useState(entry.content);
  const [mood, setMood] = useState(entry.mood || "");
  const [entryDate, setEntryDate] = useState(entry.entry_date);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(entry.tags);
  const [linkInput, setLinkInput] = useState("");
  const [tvLinks, setTvLinks] = useState<string[]>(entry.tradingview_links);
  const [linkedTradeIds, setLinkedTradeIds] = useState<string[]>(entry.linked_trade_ids);
  const [saving, setSaving] = useState(false);
  const [linkDlgOpen, setLinkDlgOpen] = useState(false);

  useEffect(() => {
    setTitle(entry.title); setContent(entry.content); setMood(entry.mood || "");
    setEntryDate(entry.entry_date); setTags(entry.tags);
    setTvLinks(entry.tradingview_links); setLinkedTradeIds(entry.linked_trade_ids);
  }, [entry.id]);

  async function save() {
    setSaving(true);
    await onSave({ title, content, mood: mood || null, entry_date: entryDate, tags, tradingview_links: tvLinks, linked_trade_ids: linkedTradeIds });
    setSaving(false);
    toast.success("Saved");
  }

  function addTag() { if (tagInput.trim() && !tags.includes(tagInput.trim())) { setTags([...tags, tagInput.trim()]); setTagInput(""); } }
  function addLink() { if (linkInput.trim()) { setTvLinks([...tvLinks, normalizeTV(linkInput)]); setLinkInput(""); } }

  const linkedTrades = trades.filter((t) => linkedTradeIds.includes(t.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-semibold border-0 px-0 focus-visible:ring-0 bg-transparent"
          placeholder="Untitled entry" />
        <Button size="sm" onClick={save} disabled={saving} className="gap-1 shrink-0">
          <Save className="h-3.5 w-3.5" /> {saving ? "..." : "Save"}
        </Button>
        <Button size="icon" variant="ghost" onClick={onDelete} className="text-muted-foreground hover:text-loss shrink-0">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Date</Label>
          <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs flex items-center gap-1"><Smile className="h-3 w-3" /> Mood</Label>
          <select value={mood} onChange={(e) => setMood(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">— none —</option>
            {MOODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div>
        <Label className="text-xs">Tags</Label>
        <div className="flex gap-2">
          <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            placeholder="setup, london-session, mistake..." />
          <Button size="sm" variant="outline" onClick={addTag}>Add</Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((t) => (
              <Badge key={t} variant="secondary" className="gap-1">
                {t}
                <button onClick={() => setTags(tags.filter((x) => x !== t))}><X className="h-3 w-3" /></button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label className="text-xs">Content</Label>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)}
          placeholder="Write freely — the market, your emotions, what you saw, the plan, anything outside trading that matters today..."
          className="min-h-[300px] resize-y text-sm leading-relaxed" />
      </div>

      {/* TradingView links */}
      <div className="rounded-lg border border-border/60 p-3 space-y-2">
        <h3 className="text-sm font-medium flex items-center gap-2">📈 TradingView Chart Links</h3>
        <div className="flex gap-2">
          <Input value={linkInput} onChange={(e) => setLinkInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLink())}
            placeholder="Paste tradingview.com/x/... or image URL" className="text-sm" />
          <Button size="sm" onClick={addLink} className="gap-1"><Plus className="h-3.5 w-3.5" /> Add</Button>
        </div>
        {tvLinks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {tvLinks.map((url, i) => (
              <div key={i} className="relative group rounded-md overflow-hidden border border-border">
                <img src={url} alt={`Chart ${i + 1}`} className="w-full h-32 object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <a href={url} target="_blank" rel="noreferrer">
                    <Button size="icon" variant="secondary" className="h-8 w-8"><ExternalLink className="h-3.5 w-3.5" /></Button>
                  </a>
                  <Button size="icon" variant="destructive" className="h-8 w-8"
                    onClick={() => setTvLinks(tvLinks.filter((_, idx) => idx !== i))}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Linked trades */}
      <div className="rounded-lg border border-border/60 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium flex items-center gap-2"><Link2 className="h-4 w-4 text-primary" /> Linked Trades</h3>
          <Dialog open={linkDlgOpen} onOpenChange={setLinkDlgOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1"><Plus className="h-3.5 w-3.5" /> Link trades</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Link trades to this entry</DialogTitle></DialogHeader>
              <p className="text-xs text-muted-foreground">
                Pick any trades — useful when a trade syncs late and you want to attach it to today's notes.
              </p>
              <div className="max-h-[50vh] overflow-auto space-y-1">
                {trades.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No trades yet.</p>}
                {trades.map((t) => {
                  const checked = linkedTradeIds.includes(t.id);
                  return (
                    <label key={t.id}
                      className="flex items-center gap-3 p-2 rounded border border-border/40 hover:bg-secondary/40 cursor-pointer text-xs">
                      <input type="checkbox" checked={checked}
                        onChange={() => setLinkedTradeIds(checked
                          ? linkedTradeIds.filter((x) => x !== t.id)
                          : [...linkedTradeIds, t.id])} />
                      <span className="font-medium">{t.asset}</span>
                      <span className={t.direction === "long" ? "text-profit" : "text-loss"}>{t.direction}</span>
                      <span className="text-muted-foreground">{format(new Date(t.date), "MMM d")}</span>
                      <span className={`ml-auto font-mono-numbers ${t.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                        {t.pnl >= 0 ? "+" : ""}{t.pnl.toFixed(2)}
                      </span>
                    </label>
                  );
                })}
              </div>
              <DialogFooter>
                <Button onClick={() => setLinkDlgOpen(false)}>Done</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        {linkedTrades.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">No trades linked yet. Link them now or later when they sync.</p>
        ) : (
          <div className="space-y-1">
            {linkedTrades.map((t) => (
              <div key={t.id} className="flex items-center gap-2 p-2 rounded border border-border/40 bg-secondary/30 text-xs">
                <Link to={`/trade/${t.id}`} className="font-medium hover:text-primary">{t.asset}</Link>
                <span className={t.direction === "long" ? "text-profit" : "text-loss"}>{t.direction}</span>
                <span className="text-muted-foreground">{format(new Date(t.date), "MMM d, yyyy")}</span>
                <span className={`ml-auto font-mono-numbers ${t.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                  {t.pnl >= 0 ? "+" : ""}{t.pnl.toFixed(2)}
                </span>
                <button onClick={() => setLinkedTradeIds(linkedTradeIds.filter((x) => x !== t.id))}
                  className="text-muted-foreground hover:text-loss"><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground text-right">
        Last updated {format(new Date(entry.updated_at), "MMM d, yyyy 'at' HH:mm")}
      </p>
    </div>
  );
}
