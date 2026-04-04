import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { ReactionBar } from "@/components/analysis/ReactionBar";
import { CommentSection } from "@/components/analysis/CommentSection";
import { SocialShareButtons } from "@/components/analysis/SocialShareButtons";
import { ViewCounter } from "@/components/analysis/ViewCounter";

interface Analysis {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  tags: string[] | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
}

export default function PublicAnalysisView() {
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("analyses")
      .select("id, title, content, cover_image_url, tags, published, published_at, created_at")
      .eq("id", id)
      .eq("published", true)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          setAnalysis(data);
        }
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !analysis) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground">
        <h1 className="text-2xl font-bold mb-2">Analysis Not Found</h1>
        <p className="text-muted-foreground">This analysis doesn't exist or isn't published yet.</p>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/shared/analysis/${id}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {analysis.cover_image_url && (
          <img
            src={analysis.cover_image_url}
            alt={analysis.title}
            className="w-full max-h-72 object-cover rounded-xl border border-border"
          />
        )}

        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(analysis.created_at), "MMMM d, yyyy")}
            </span>
            <ViewCounter analysisId={analysis.id} trackView />
          </div>
          <h1 className="text-3xl font-bold font-display text-foreground">{analysis.title}</h1>
          {analysis.tags && analysis.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {analysis.tags.map((tag) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          )}
        </div>

        <div className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground/80 prose-strong:text-primary prose-a:text-primary hover:prose-a:text-primary/80 prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground prose-code:text-primary prose-img:rounded-lg prose-img:border prose-img:border-border">
          <ReactMarkdown>{analysis.content}</ReactMarkdown>
        </div>

        {/* Reactions */}
        <div className="pt-4 border-t border-border space-y-4">
          <ReactionBar analysisId={analysis.id} />
          <SocialShareButtons url={shareUrl} title={analysis.title} />
        </div>

        {/* Comments */}
        <div className="pt-4 border-t border-border">
          <CommentSection analysisId={analysis.id} />
        </div>

        <div className="text-center pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground">Trading Analysis</p>
        </div>
      </div>
    </div>
  );
}
