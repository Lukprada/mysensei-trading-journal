import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PlusCircle, Calendar, Eye, Edit, Trash2 } from "lucide-react";
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
    return plain.length > 150 ? plain.substring(0, 150) + "..." : plain;
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-gradient">Weekly Analysis</h1>
          <p className="text-sm text-muted-foreground">Your chart breakdowns & market insights</p>
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
        <Card className="p-12 text-center border-dashed">
          <p className="text-muted-foreground mb-4">No analyses yet. Start documenting your market insights!</p>
          <Button onClick={() => navigate("/analysis/new")} variant="outline" className="gap-2">
            <PlusCircle className="h-4 w-4" /> Write your first analysis
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {analyses.map((a) => (
            <Card
              key={a.id}
              className="p-4 hover:border-primary/20 transition-colors cursor-pointer group"
              onClick={() => navigate(`/analysis/${a.id}`)}
            >
              <div className="flex items-start gap-4">
                {a.cover_image_url && (
                  <img
                    src={a.cover_image_url}
                    alt=""
                    className="w-24 h-16 rounded-md object-cover border border-border flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">{a.title}</h3>
                    <Badge variant={a.published ? "default" : "secondary"} className="text-[10px]">
                      {a.published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{getPreview(a.content)}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(a.created_at), "MMM d, yyyy")}
                    </span>
                    {a.tags && a.tags.length > 0 && a.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => { e.stopPropagation(); navigate(`/analysis/${a.id}/edit`); }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive"
                    onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
