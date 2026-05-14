import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ChevronUp } from "lucide-react";

import { format } from "date-fns";
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
}

function estimateReadTime(content: string) {
  const words = content.replace(/[#*`>\[\]()!_~-]/g, "").split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export default function PublicAnalysisView() {
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
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
          document.title = `${data.title} | Trading Analysis`;
          const desc = data.content.replace(/[#*_`>\[\]()!]/g, '').substring(0, 160);
          const metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc) metaDesc.setAttribute('content', desc);
          else {
            const meta = document.createElement('meta');
            meta.name = 'description';
            meta.content = desc;
            document.head.appendChild(meta);
          }
          const setOG = (prop: string, content: string) => {
            let el = document.querySelector(`meta[property="${prop}"]`);
            if (!el) { el = document.createElement('meta'); el.setAttribute('property', prop); document.head.appendChild(el); }
            el.setAttribute('content', content);
          };
          setOG('og:title', data.title);
          setOG('og:description', desc);
          setOG('og:type', 'article');
          setOG('og:url', window.location.href);
          if (data.cover_image_url) setOG('og:image', data.cover_image_url);
          setOG('twitter:card', data.cover_image_url ? 'summary_large_image' : 'summary');
          setOG('twitter:title', data.title);
          setOG('twitter:description', desc);
          if (data.cover_image_url) setOG('twitter:image', data.cover_image_url);
        }
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (notFound || !analysis) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground px-4">
        <div className="text-6xl mb-4">📊</div>
        <h1 className="text-3xl font-bold font-display mb-2">Analysis Not Found</h1>
        <p className="text-muted-foreground text-center max-w-md">
          This analysis doesn't exist or isn't published yet. It may have been removed or the link might be incorrect.
        </p>
      </div>
    );
  }

  const readTime = estimateReadTime(analysis.content);
  const shareUrl = `${window.location.origin}/shared/analysis/${id}`;
  const publishDate = analysis.published_at || analysis.created_at;

  return (
    <div className="min-h-screen bg-background relative">
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-border/30">
        <div
          className="h-full bg-gradient-to-r from-primary via-primary to-primary/60 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>

      {/* Hero section */}
      {analysis.cover_image_url ? (
        <div className="relative w-full h-[50vh] min-h-[320px] max-h-[500px] overflow-hidden">
          <img
            src={analysis.cover_image_url}
            alt={analysis.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                {analysis.tags && analysis.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-primary/20 text-primary border-primary/30 backdrop-blur-sm text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <h1 className="text-3xl md:text-5xl font-bold font-display text-foreground leading-tight tracking-tight">
                {analysis.title}
              </h1>
              <div className="flex items-center gap-4 mt-4 flex-wrap">
                <span className="text-sm text-foreground/70 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(publishDate), "MMMM d, yyyy")}
                </span>
                <span className="text-sm text-foreground/70 flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {readTime} min read
                </span>
                <ViewCounter analysisId={analysis.id} trackView />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative pt-16 pb-10 px-4 border-b border-border/50">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="max-w-3xl mx-auto relative">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {analysis.tags && analysis.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold font-display text-foreground leading-tight tracking-tight">
              {analysis.title}
            </h1>
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {format(new Date(publishDate), "MMMM d, yyyy")}
              </span>
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {readTime} min read
              </span>
              <ViewCounter analysisId={analysis.id} trackView />
            </div>
          </div>
        </div>
      )}

      {/* Article content */}
      <article className="max-w-3xl mx-auto px-4 md:px-6 py-10">
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

        {/* Engagement section */}
        <div className="mt-12 pt-8 border-t border-border/50 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <ReactionBar analysisId={analysis.id} />
            <SocialShareButtons url={shareUrl} title={analysis.title} />
          </div>
        </div>

        {/* Comments */}
        <div className="mt-10 pt-8 border-t border-border/50">
          <CommentSection analysisId={analysis.id} />
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground/60 font-display tracking-widest uppercase">Trading Analysis</p>
        </footer>
      </article>

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
