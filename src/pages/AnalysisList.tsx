import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PlusCircle, Calendar, Edit, Trash2, FileText } from "lucide-react";
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
}

export default function AnalysisList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyses();
  }, [user?.id]);

  async function fetchAnalyses() {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("analyses")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load analyses");
    } else {
      setAnalyses(data || []);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this analysis?")) return;
    const { error } = await supabase.from("analyses").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Deleted");
    }
  }

  const getPreview = (content: string) => {
    const plain = content.replace(/[#*`>\[\]()!_~-]/g, "").trim();
    return plain.length > 120 ? plain.substring(0, 120) + "..." : plain;
  };

  const featured = analyses[0];
  const rest = analyses.slice(1);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display text-gradient">Weekly Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">Your chart breakdowns & market insights</p>
        </div>
        <Button onClick={() => navigate("/analysis/new")} className="gap-2">
          <PlusCircle className="h-4 w-4" /> New Analysis
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : analyses.length === 0 ? (
        <Card className="p-16 text-center border-dashed neon-border">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground mb-4 text-lg">No analyses yet</p>
          <p className="text-sm text-muted-foreground/60 mb-6">Start documenting your market insights and chart breakdowns.</p>
          <Button onClick={() => navigate("/analysis/new")} variant="outline" className="gap-2">
            <PlusCircle className="h-4 w-4" /> Write your first analysis
          </Button>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Featured / Latest */}
          {featured && (
            <Card
              className="overflow-hidden cursor-pointer group glass-card-hover border-border/50"
              onClick={() => navigate(`/analysis/${featured.id}`)}
            >
              <div className="flex flex-col md:flex-row">
                {featured.cover_image_url ? (
                  <div className="md:w-2/5 h-48 md:h-auto relative overflow-hidden">
                    <img
                      src={featured.cover_image_url}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
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
                    <Badge variant={featured.published ? "default" : "secondary"} className="text-[10px]">
                      {featured.published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground group-hover:text-primary transition-colors leading-tight">
                    {featured.title}
                  </h2>
                  <p className="text-muted-foreground mt-3 leading-relaxed line-clamp-2">
                    {getPreview(featured.content)}
                  </p>
                  <div className="flex items-center gap-3 mt-4 flex-wrap">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(featured.created_at), "MMMM d, yyyy")}
                    </span>
                    {featured.tags?.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); navigate(`/analysis/${featured.id}/edit`); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(featured.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Grid of rest */}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {rest.map((a) => (
                <Card
                  key={a.id}
                  className="overflow-hidden cursor-pointer group glass-card-hover border-border/50 flex flex-col"
                  onClick={() => navigate(`/analysis/${a.id}`)}
                >
                  {a.cover_image_url ? (
                    <div className="h-40 overflow-hidden relative">
                      <img
                        src={a.cover_image_url}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="h-24 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent flex items-center justify-center">
                      <FileText className="h-8 w-8 text-primary/15" />
                    </div>
                  )}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={a.published ? "default" : "secondary"} className="text-[10px]">
                        {a.published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                      {a.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2 flex-1">
                      {getPreview(a.content)}
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(a.created_at), "MMM d, yyyy")}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); navigate(`/analysis/${a.id}/edit`); }}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {a.tags && a.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {a.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
