import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Calendar, Share2, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { toast } from "sonner";
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
  user_id: string;
}

export default function AnalysisView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/shared/analysis/${id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      toast.success("Share link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => {
    if (!id) return;
    supabase
      .from("analyses")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          toast.error("Analysis not found");
          navigate("/analysis");
          return;
        }
        setAnalysis(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!analysis) return null;

  const isOwner = user?.id === analysis.user_id;
  const shareUrl = `${window.location.origin}/shared/analysis/${id}`;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/analysis")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {isOwner && (
          <div className="flex gap-2">
            {analysis.published && (
              <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                {copied ? "Copied!" : "Share"}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate(`/analysis/${id}/edit`)} className="gap-2">
              <Edit className="h-4 w-4" /> Edit
            </Button>
          </div>
        )}
      </div>

      {analysis.cover_image_url && (
        <img
          src={analysis.cover_image_url}
          alt={analysis.title}
          className="w-full max-h-64 object-cover rounded-xl border border-border"
        />
      )}

      <div>
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <Badge variant={analysis.published ? "default" : "secondary"}>
            {analysis.published ? "Published" : "Draft"}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(analysis.created_at), "MMMM d, yyyy")}
          </span>
          {analysis.published && <ViewCounter analysisId={analysis.id} />}
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

      {/* Reactions & Sharing */}
      {analysis.published && (
        <div className="pt-4 border-t border-border space-y-4">
          <ReactionBar analysisId={analysis.id} />
          <SocialShareButtons url={shareUrl} title={analysis.title} />
        </div>
      )}

      {/* Comments */}
      {analysis.published && (
        <div className="pt-4 border-t border-border">
          <CommentSection analysisId={analysis.id} isOwner={isOwner} />
        </div>
      )}
    </div>
  );
}
