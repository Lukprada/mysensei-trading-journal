import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowUpRight, ArrowDownRight, Sparkles, Loader2, Save, Share2, Link2,
  Plus, X, ExternalLink, Gauge, Newspaper, LineChart, NotebookPen, Layers,
} from "lucide-react";
import { toast } from "sonner";
import { useTrading } from "@/contexts/TradingContext";
import { ForexFactoryNews, type NewsEvent } from "@/components/ForexFactoryNews";
import { LinkTradesDialog } from "@/components/LinkTradesDialog";
import { bundleFromTrade, bundleToTradeDetails, bundleToNarrative } from "@/lib/tradeBundle";
import { buildTradeDossier, dossierToPrompt, scoreLabel } from "@/lib/tradeContext";
import { streamSenseiChat } from "@/lib/streamChat";
import type { Trade } from "@/types/trading";

interface Props {
  trade: Trade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function normalizeTV(raw: string): string {
  const url = raw.trim();
  const x = url.match(/tradingview\.com\/x\/([A-Za-z0-9]+)/i);
  return x ? `https://s3.tradingview.com/snapshots/${x[1][0].toLowerCase()}/${x[1]}.png` : url;
}

const PROMPTS = [
  "Why did I take it?",
  "Where was the invalidation?",
  "What did I feel at entry?",
  "Did news drive this?",
  "Was I recovering losses?",
  "Lesson & next action",
];

export function TradeJournalDialog({ trade, open, onOpenChange }: Props) {
  const { allTrades, cashFlows, accounts, updateTrade, updateTradeCritique } = useTrading();
  const [notes, setNotes] = useState("");
  const [links, setLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [critique, setCritique] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [news, setNews] = useState<NewsEvent[]>([]);
  const [linkDialog, setLinkDialog] = useState(false);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!trade) return;
    setNotes(trade.journalNotes || "");
    setLinks(trade.tradingviewLinks || []);
    setCritique(trade.aiCritique || "");
    setNews([]);
  }, [trade?.id]);

  const bundle = useMemo(
    () => (trade ? bundleFromTrade(trade, allTrades) : null),
    [trade?.id, allTrades],
  );
  const dossier = useMemo(
    () => (bundle ? buildTradeDossier(bundle, allTrades, cashFlows) : null),
    [bundle, allTrades, cashFlows],
  );

  if (!trade || !bundle || !dossier) return null;

  const isWin = bundle.totalPnl >= 0;
  const score = scoreLabel(dossier.compositeScore);
  const highImpact = news.filter((n) => n.impact === "high");

  async function save() {
    setSaving(true);
    await updateTrade(trade!.id, { journalNotes: notes, tradingviewLinks: links }, { shareWithGroup: true });
    setSaving(false);
    toast.success(bundle!.linked ? `Saved across ${bundle!.fills.length} linked fills` : "Journal saved");
  }

  async function addLink() {
    if (!linkInput.trim()) return;
    const next = [...links, normalizeTV(linkInput)];
    setLinks(next);
    setLinkInput("");
    await updateTrade(trade!.id, { tradingviewLinks: next }, { shareWithGroup: true });
  }

  async function removeLink(i: number) {
    const next = links.filter((_, idx) => idx !== i);
    setLinks(next);
    await updateTrade(trade!.id, { tradingviewLinks: next }, { shareWithGroup: true });
  }

  function insertPrompt(p: string) {
    setNotes((prev) => `${prev}${prev && !prev.endsWith("\n") ? "\n\n" : ""}**${p}**\n`);
    noteRef.current?.focus();
  }

  async function analyse() {
    setAnalyzing(true);
    setCritique("");
    let acc = "";
    const accountType = accounts.find((a) => a.id === trade!.accountId)?.type || "unknown";
    const newsLine = news.length
      ? `MACRO NEWS ON ${trade!.date} (${dossier!.dayOfWeek}):\n` +
        news.slice(0, 20).map((e) => `- ${e.currency} ${e.title} [${e.impact}] forecast ${e.forecast || "—"} / prev ${e.previous || "—"}`).join("\n")
      : "";
    try {
      await streamSenseiChat({
        messages: [],
        tradeContext: {
          trade_details: bundleToTradeDetails(bundle!),
          user_notes: `${bundleToNarrative(bundle!, notes)}\n\n${dossierToPrompt(dossier!, newsLine)}`,
          user_mood: trade!.mentalState,
          screenshot_url: links[0] || trade!.screenshotUrl || null,
          account_type: accountType,
        },
        onDelta: (c) => { acc += c; setCritique(acc); },
        onDone: () => { setAnalyzing(false); if (acc.trim()) updateTradeCritique(trade!.id, acc); },
        onError: (s) => { setAnalyzing(false); toast.error(s === 429 ? "Rate limited — try again shortly" : "Sensei couldn't read this trade"); },
      });
    } catch {
      setAnalyzing(false);
      toast.error("Sensei couldn't read this trade");
    }
  }

  async function share() {
    const text = [
      `# ${trade!.asset} ${trade!.direction.toUpperCase()} — ${bundle!.lastDate}`,
      "",
      `${bundle!.totalLots.toFixed(2)} lots · ${bundle!.totalPips.toFixed(1)} pips · ${isWin ? "+" : "-"}$${Math.abs(bundle!.totalPnl).toFixed(2)}`,
      `State score ${dossier!.compositeScore}/100 (${score.label})`,
      "",
      notes || "(no journal written yet)",
      "",
      links.length ? `Charts:\n${links.join("\n")}` : "",
      critique ? `\n## Sensei\n${critique}` : "",
    ].filter(Boolean).join("\n");
    try {
      if (navigator.share) await navigator.share({ title: `${trade!.asset} journal`, text });
      else { await navigator.clipboard.writeText(text); toast.success("Journal page copied"); }
    } catch { /* cancelled */ }
  }

  const facts: Array<[string, string]> = [
    ["Avg entry", bundle.avgEntry.toFixed(5)],
    ["Avg exit", bundle.avgExit.toFixed(5)],
    ["Stop loss", trade.stopLoss ? String(trade.stopLoss) : "—"],
    ["Take profit", trade.takeProfit ? String(trade.takeProfit) : "—"],
    ["Setup", trade.setupTag || "—"],
    ["Risk", trade.riskAmount ? `$${trade.riskAmount}` : "—"],
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(1280px,96vw)] h-[94vh] overflow-hidden p-0 gap-0 flex flex-col">
        {/* Header */}
        <header className="shrink-0 border-b border-border bg-card/80 px-6 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className={`flex h-10 w-10 items-center justify-center rounded-md ${isWin ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"}`}>
              {trade.direction === "long" ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">{trade.asset} <span className="text-muted-foreground text-sm capitalize">{trade.direction}</span></h2>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {dossier.dayOfWeek} · {bundle.lastDate} · {bundle.fills.length} execution{bundle.fills.length > 1 ? "s" : ""} · {bundle.totalLots.toFixed(2)} lots
              </p>
            </div>
            <div className="ml-auto flex items-center gap-5">
              <div className="text-right">
                <p className="text-[10px] uppercase text-muted-foreground">Net</p>
                <p className={`font-mono-numbers text-lg font-semibold ${isWin ? "text-profit" : "text-loss"}`}>
                  {isWin ? "+" : "-"}${Math.abs(bundle.totalPnl).toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase text-muted-foreground">Pips</p>
                <p className={`font-mono-numbers text-lg font-semibold ${bundle.totalPips >= 0 ? "text-profit" : "text-loss"}`}>
                  {bundle.totalPips > 0 ? "+" : ""}{bundle.totalPips.toFixed(1)}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 rounded-md border border-border px-3 py-2">
                <Gauge className={`h-4 w-4 ${score.tone}`} />
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">State score</p>
                  <p className={`font-mono-numbers text-sm font-semibold ${score.tone}`}>{dossier.compositeScore}/100 · {score.label}</p>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={share} className="gap-1.5"><Share2 className="h-3.5 w-3.5" /> Share</Button>
              <Button size="sm" onClick={save} disabled={saving} className="gap-1.5">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
              </Button>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.35fr_1fr]">
            {/* LEFT — the writing surface */}
            <div className="space-y-5">
              <section className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                  <NotebookPen className="h-3.5 w-3.5 text-primary" /> The journal
                </h3>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {PROMPTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => insertPrompt(p)}
                      className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                    >
                      + {p}
                    </button>
                  ))}
                </div>
                <Textarea
                  ref={noteRef}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Write everything: the idea, the level, what the chart looked like, what you felt, what the news did, what you'd repeat."
                  className="min-h-[340px] resize-y text-sm leading-relaxed"
                />
              </section>

              <section className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                  <LineChart className="h-3.5 w-3.5 text-primary" /> Charts & screenshots
                </h3>
                <div className="flex gap-2">
                  <Input
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLink())}
                    placeholder="Paste tradingview.com/x/... or any image URL"
                    className="text-sm"
                  />
                  <Button size="sm" onClick={addLink} className="gap-1"><Plus className="h-3.5 w-3.5" /> Add</Button>
                </div>
                {links.length > 0 && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {links.map((url, i) => (
                      <div key={i} className="group relative overflow-hidden rounded-md border border-border">
                        <img src={url} alt={`Chart ${i + 1}`} className="h-36 w-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/0 opacity-0 transition-all group-hover:bg-background/70 group-hover:opacity-100">
                          <a href={url} target="_blank" rel="noreferrer">
                            <Button size="icon" variant="secondary" className="h-8 w-8"><ExternalLink className="h-3.5 w-3.5" /></Button>
                          </a>
                          <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => removeLink(i)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                  <Newspaper className="h-3.5 w-3.5 text-primary" /> What the world was doing
                  {highImpact.length > 0 && (
                    <span className="rounded border border-loss/30 bg-loss/10 px-1.5 py-0.5 text-[10px] text-loss">
                      {highImpact.length} high impact
                    </span>
                  )}
                </div>
                <ForexFactoryNews
                  date={trade.date}
                  autoLoad
                  onEvents={setNews}
                  onAttach={(snapshot) => setNotes((prev) => `${prev}${snapshot}`)}
                />
              </section>
            </div>

            {/* RIGHT — the intelligence rail */}
            <div className="space-y-5">
              <section className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Execution facts</h3>
                <dl className="grid grid-cols-2 gap-3">
                  {facts.map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-[10px] uppercase text-muted-foreground">{k}</dt>
                      <dd className="font-mono-numbers text-sm text-foreground">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    {bundle.linked ? `${bundle.fills.length} layered fills share this page` : "Single execution"}
                  </span>
                  <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px]" onClick={() => setLinkDialog(true)}>
                    <Link2 className="h-3 w-3" /> {bundle.linked ? "Manage" : "Link fills"}
                  </Button>
                </div>
                {bundle.linked && (
                  <ul className="mt-3 space-y-1.5">
                    {bundle.fills.map((f) => (
                      <li key={f.id} className="flex items-center justify-between rounded border border-border/50 bg-secondary/20 px-2.5 py-1.5 text-[11px]">
                        <span className="font-mono-numbers text-muted-foreground">{f.date} · {f.positionSize} lots</span>
                        <span className={`font-mono-numbers ${f.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                          {f.pnl >= 0 ? "+" : ""}${f.pnl.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                  <Gauge className="h-3.5 w-3.5 text-primary" /> Behavioural dossier
                </h3>
                <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full ${dossier.compositeScore >= 60 ? "bg-profit" : dossier.compositeScore >= 40 ? "bg-primary" : "bg-loss"}`}
                    style={{ width: `${dossier.compositeScore}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <p className="uppercase text-muted-foreground">Streak before</p>
                    <p className={`font-mono-numbers ${dossier.streak > 0 ? "text-profit" : dossier.streak < 0 ? "text-loss" : "text-foreground"}`}>
                      {dossier.streak === 0 ? "—" : dossier.streak > 0 ? `${dossier.streak}W` : `${Math.abs(dossier.streak)}L`}
                    </p>
                  </div>
                  <div>
                    <p className="uppercase text-muted-foreground">Last 5</p>
                    <p className="font-mono-numbers text-foreground">{dossier.last5.wins}W / {dossier.last5.losses}L · ${dossier.last5.netPnl}</p>
                  </div>
                  <div>
                    <p className="uppercase text-muted-foreground">7-day P&L</p>
                    <p className={`font-mono-numbers ${dossier.last7DaysPnl >= 0 ? "text-profit" : "text-loss"}`}>${dossier.last7DaysPnl}</p>
                  </div>
                  <div>
                    <p className="uppercase text-muted-foreground">Drawdown</p>
                    <p className="font-mono-numbers text-foreground">${dossier.drawdownFromPeak}</p>
                  </div>
                  <div>
                    <p className="uppercase text-muted-foreground">Withdrawn (30d)</p>
                    <p className="font-mono-numbers text-foreground">${dossier.recentWithdrawals}</p>
                  </div>
                  <div>
                    <p className="uppercase text-muted-foreground">Size vs normal</p>
                    <p className="font-mono-numbers text-foreground">{dossier.sizeRatio ? `${dossier.sizeRatio}×` : "—"}</p>
                  </div>
                </div>
                <ul className="mt-3 space-y-1.5 border-t border-border/60 pt-3">
                  {dossier.flags.map((f) => (
                    <li key={f} className="flex gap-2 text-[11px] text-muted-foreground">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" /> {f}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase text-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-primary" /> Sensei verdict
                  </h3>
                  <Button size="sm" onClick={analyse} disabled={analyzing} className="h-7 gap-1.5 text-[11px]">
                    {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {analyzing ? "Reading..." : critique ? "Re-run" : "Judge this trade"}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Sensei reads the whole position, your writing, the charts, the {news.length} news events on {trade.date},
                  your streak, drawdown and withdrawals — then decides your real state instead of trusting your self-report.
                </p>
                {critique && (
                  <div className="mt-3 whitespace-pre-wrap rounded-md border border-border bg-card p-3 text-sm leading-relaxed text-foreground">
                    {critique}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>

        <LinkTradesDialog trade={trade} open={linkDialog} onOpenChange={setLinkDialog} />
      </DialogContent>
    </Dialog>
  );
}
