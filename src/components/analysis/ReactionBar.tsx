import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const REACTIONS = [
  { emoji: "🔥", label: "Fire" },
  { emoji: "❤️", label: "Love" },
  { emoji: "👏", label: "Clap" },
  { emoji: "🧠", label: "Smart" },
  { emoji: "💰", label: "Money" },
];

interface ReactionBarProps {
  analysisId: string;
}

export function ReactionBar({ analysisId }: ReactionBarProps) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [reacted, setReacted] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase
      .from("analysis_reactions")
      .select("emoji")
      .eq("analysis_id", analysisId)
      .then(({ data }) => {
        if (!data) return;
        const c: Record<string, number> = {};
        data.forEach((r: { emoji: string }) => {
          c[r.emoji] = (c[r.emoji] || 0) + 1;
        });
        setCounts(c);
      });

    const stored = localStorage.getItem(`reactions_${analysisId}`);
    if (stored) setReacted(new Set(JSON.parse(stored)));
  }, [analysisId]);

  const handleReact = async (emoji: string) => {
    if (reacted.has(emoji)) return;

    const { error } = await supabase
      .from("analysis_reactions")
      .insert({ analysis_id: analysisId, emoji });

    if (error) {
      toast.error("Failed to react");
      return;
    }

    setCounts((prev) => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
    const newReacted = new Set(reacted).add(emoji);
    setReacted(newReacted);
    localStorage.setItem(`reactions_${analysisId}`, JSON.stringify([...newReacted]));
  };

  return (
    <div className="flex flex-wrap gap-2">
      {REACTIONS.map(({ emoji, label }) => (
        <button
          key={emoji}
          onClick={() => handleReact(emoji)}
          title={label}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all",
            reacted.has(emoji)
              ? "border-primary/50 bg-primary/10 text-foreground"
              : "border-border bg-card hover:border-primary/30 hover:bg-primary/5 text-muted-foreground"
          )}
        >
          <span className="text-base">{emoji}</span>
          {(counts[emoji] || 0) > 0 && (
            <span className="text-xs font-medium">{counts[emoji]}</span>
          )}
        </button>
      ))}
    </div>
  );
}
