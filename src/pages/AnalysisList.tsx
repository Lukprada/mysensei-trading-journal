import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PlusCircle, Calendar, Edit, Trash2, FileText, User, Globe, Lock, HelpCircle, Image as ImageIcon, Pen, Share2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Analysis {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  tags: string[] | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  author_name?: string;
}

type Tab = "all" | "mine";

export default function AnalysisList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => { fetchAnalyses(); }, [user?.id]);

  async function fetchAnalyses() {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("analyses")
      .select("*")
      .order("published_at", { ascending: false, nullsFirst: false });
    if (error) {
      toast.error("Failed to load analyses");
      setLoading(false);
      return;
    }
    const rows = (data || []) as Analysis[];
    // Fetch author names in one shot
    const authorIds = Array.from(new Set(rows.map((r) => r.user_id)));
    if (authorIds.length) {
      const { data: profs } = await supabase
        .from("profiles").select("id, display_name").in("id", authorIds);
      const map = new Map((profs || []).map((p: any) => [p.id, p.display_name]));
      rows.forEach((r) => { r.author_name = map.get(r.user_id) || "trader"; });
    }
    setAnalyses(rows);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this analysis?")) return;
    const { error } = await supabase.from("analyses").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { setAnalyses((prev) => prev.filter((a) => a.id !== id)); toast.success("Deleted"); }
  }

  async function togglePublished(a: Analysis) {
    const next = !a.published;
    const { error } = await supabase.from("analyses").update({
      published: next,
      published_at: next ? new Date().toISOString() : null,
    }).eq("id", a.id);
    if (error) { toast.error("Failed to update"); return; }
    setAnalyses((prev) => prev.map((x) => x.id === a.id ? { ...x, published: next, published_at: next ? new Date().toISOString() : null } : x));
    toast.success(next ? "Now public" : "Now private");
  }

  const getPreview = (content: string) => {
    const plain = content.replace(/[#*`>\[\]()!_~-]/g, "").trim();
    return plain.length > 120 ? plain.substring(0, 120) + "..." : plain;
  };

  const filtered = analyses.filter((a) => tab === "mine" ? a.user_id === user?.id : a.published);
  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold font-display text-gradient">Weekly Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tab === "all" ? "Community chart breakdowns & market insights" : "Your private drafts & published posts"}
          </p>
        </div>
        <Button onClick={() => navigate("/analysis/new")} className="gap-2">
          <PlusCircle className="h-4 w-4" /> New Analysis
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/40">
        <TabButton active={tab === "all"} onClick={() => setTab("all")} icon={Globe} label="Community" />
        <TabButton active={tab === "mine"} onClick={() => setTab("mine")} icon={User} label="My Analyses" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-16 text-center border-dashed neon-border">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground mb-4 text-lg">
            {tab === "all" ? "No published analyses yet" : "You haven't written anything yet"}
          </p>
          <Button onClick={() => navigate("/analysis/new")} variant="outline" className="gap-2">
            <PlusCircle className="h-4 w-4" /> Write the first one
          </Button>
        </Card>
      ) : (
        <div className="space-y-8">
          {featured && (
            <FeaturedCard
              a={featured}
              isOwner={featured.user_id === user?.id}
              onOpen={() => navigate(`/analysis/${featured.id}`)}
              onEdit={() => navigate(`/analysis/${featured.id}/edit`)}
              onDelete={() => handleDelete(featured.id)}
              getPreview={getPreview}
            />
          )}

          {rest.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {rest.map((a) => (
                <GridCard
                  key={a.id}
                  a={a}
                  isOwner={a.user_id === user?.id}
                  onOpen={() => navigate(`/analysis/${a.id}`)}
                  onEdit={() => navigate(`/analysis/${a.id}/edit`)}
                  onDelete={() => handleDelete(a.id)}
                  getPreview={getPreview}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active, onClick, icon: Icon, label,
}: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-display tracking-wide flex items-center gap-2 border-b-2 -mb-px transition-colors ${
        active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function AuthorMeta({ a }: { a: Analysis }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
      <span className="flex items-center gap-1">
        <User className="h-3 w-3" />
        <span className="text-foreground/80 font-medium">{a.author_name || "trader"}</span>
      </span>
      <span className="flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        {format(new Date(a.published_at || a.created_at), "MMM d, yyyy")}
      </span>
    </div>
  );
}

function FeaturedCard({ a, isOwner, onOpen, onEdit, onDelete, getPreview }: any) {
  return (
    <Card className="overflow-hidden cursor-pointer group glass-card-hover border-border/50" onClick={onOpen}>
      <div className="flex flex-col md:flex-row">
        {a.cover_image_url ? (
          <div className="md:w-2/5 h-48 md:h-auto relative overflow-hidden">
            <img src={a.cover_image_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/50 hidden md:block" />
          </div>
        ) : (
          <div className="md:w-2/5 h-48 md:h-auto bg-gradient-to-br from-primary/10 via-primary/5 to-transparent flex items-center justify-center">
            <FileText className="h-16 w-16 text-primary/20" />
          </div>
        )}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Latest</Badge>
            {isOwner && (
              <Badge variant={a.published ? "default" : "secondary"} className="text-[10px] gap-1">
                {a.published ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                {a.published ? "Public" : "Draft"}
              </Badge>
            )}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground group-hover:text-primary transition-colors leading-tight">
            {a.title}
          </h2>
          <p className="text-muted-foreground mt-3 leading-relaxed line-clamp-2">{getPreview(a.content)}</p>
          <div className="mt-4"><AuthorMeta a={a} /></div>
          {a.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {a.tags.map((tag: string) => (<Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>))}
            </div>
          )}
          {isOwner && (
            <div className="flex items-center gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function GridCard({ a, isOwner, onOpen, onEdit, onDelete, getPreview }: any) {
  return (
    <Card className="overflow-hidden cursor-pointer group glass-card-hover border-border/50 flex flex-col" onClick={onOpen}>
      {a.cover_image_url ? (
        <div className="h-40 overflow-hidden relative">
          <img src={a.cover_image_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
      ) : (
        <div className="h-24 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent flex items-center justify-center">
          <FileText className="h-8 w-8 text-primary/15" />
        </div>
      )}
      <div className="p-5 flex-1 flex flex-col">
        {isOwner && (
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={a.published ? "default" : "secondary"} className="text-[10px] gap-1">
              {a.published ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {a.published ? "Public" : "Draft"}
            </Badge>
          </div>
        )}
        <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">{a.title}</h3>
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2 flex-1">{getPreview(a.content)}</p>
        <div className="mt-3"><AuthorMeta a={a} /></div>
        <div className="flex items-center justify-between mt-3">
          {a.tags?.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {a.tags.slice(0, 3).map((tag: string) => (<Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>))}
            </div>
          ) : <span />}
          {isOwner && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
