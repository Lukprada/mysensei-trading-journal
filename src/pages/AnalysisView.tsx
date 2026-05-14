import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Calendar, Share2, Check, Clock, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ReactionBar } from "@/components/analysis/ReactionBar";
import { CommentSection } from "@/components/analysis/CommentSection";
import { SocialShareButtons } from "@/components/analysis/SocialShareButtons";
import { ViewCounter } from "@/components/analysis/ViewCounter";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

function estimateReadTime(content: string) {
  const words = content.replace(/[#*`>\[\]()!_~-]/g, "").split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export default function AnalysisView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    setScrollProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0);
    setShowBackToTop(scrollTop > 600);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

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
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const isOwner = user?.id === analysis.user_id;
  const shareUrl = `${window.location.origin}/shared/analysis/${id}`;
  const readTime = estimateReadTime(analysis.content);
  const publishDate = analysis.published_at || analysis.created_at;

  return (
    <div className="relative">
      {/* Reading progress bar */}
      <div className="fixed top-12 left-0 right-0 z-30 h-0.5 bg-border/30">
        <div
          className="h-full bg-gradient-to-r from-primary via-primary to-primary/60 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>

      {/* Toolbar */}
      <div className="sticky top-12 z-20 bg-background/80 backdrop-blur-md border-b border-border/30 -mx-6 px-6 py-3 mb-6 flex items-center justify-between">
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

      <div className="max-w-3xl mx-auto">
        {/* Hero */}
        {analysis.cover_image_url && (
          <div className="relative rounded-2xl overflow-hidden mb-8 aspect-[21/9]">
            <img
              src={analysis.cover_image_url}
              alt={analysis.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>
        )}

        {/* Meta */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <Badge variant={analysis.published ? "default" : "secondary"}>
              {analysis.published ? "Published" : "Draft"}
            </Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {format(new Date(publishDate), "MMMM d, yyyy")}
            </span>
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {readTime} min read
            </span>
            {analysis.published && <ViewCounter analysisId={analysis.id} />}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground leading-tight tracking-tight">
            {analysis.title}
          </h1>
          {analysis.tags && analysis.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {analysis.tags.map((tag) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          )}
        </div>

        {/* Article content */}
        <div className="prose prose-lg dark:prose-invert max-w-none
          prose-headings:font-display prose-headings:tracking-tight prose-headings:text-foreground
          prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border/50
          prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
          prose-p:text-foreground/80 prose-p:leading-relaxed prose-p:text-[1.05rem]
          prose-strong:text-primary prose-strong:font-semibold
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium
          prose-blockquote:border-l-4 prose-blockquote:border-primary/40 prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:text-muted-foreground prose-blockquote:not-italic
          prose-code:text-primary prose-code:bg-primary/10 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:font-mono-numbers
          prose-pre:bg-card prose-pre:border prose-pre:border-border prose-pre:rounded-xl
          prose-img:rounded-xl prose-img:border prose-img:border-border prose-img:shadow-lg
          prose-li:text-foreground/80
          prose-hr:border-border/50
        ">
          <div dangerouslySetInnerHTML={{ __html: analysis.content }} />
        </div>

        {/* Engagement */}
        {analysis.published && (
          <div className="mt-12 pt-8 border-t border-border/50 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <ReactionBar analysisId={analysis.id} />
              <SocialShareButtons url={shareUrl} title={analysis.title} />
            </div>
          </div>
        )}

        {/* Comments */}
        {analysis.published && (
          <div className="mt-10 pt-8 border-t border-border/50">
            <CommentSection analysisId={analysis.id} isOwner={isOwner} />
          </div>
        )}
      </div>

      {/* Back to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={cn(
          "fixed bottom-6 right-6 h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 z-40",
          showBackToTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
        aria-label="Back to top"
      >
        <ChevronUp className="h-5 w-5" />
      </button>
    </div>
  );
}
