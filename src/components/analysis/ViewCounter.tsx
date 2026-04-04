import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Eye } from "lucide-react";

interface ViewCounterProps {
  analysisId: string;
  trackView?: boolean;
}

export function ViewCounter({ analysisId, trackView = false }: ViewCounterProps) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (trackView) {
      const viewed = sessionStorage.getItem(`viewed_${analysisId}`);
      if (!viewed) {
        supabase
          .from("analysis_views")
          .insert({ analysis_id: analysisId })
          .then(() => {
            sessionStorage.setItem(`viewed_${analysisId}`, "1");
          });
      }
    }

    supabase
      .from("analysis_views")
      .select("id", { count: "exact", head: true })
      .eq("analysis_id", analysisId)
      .then(({ count: c }) => {
        setCount(c ?? 0);
      });
  }, [analysisId, trackView]);

  if (count === null) return null;

  return (
    <span className="text-xs text-muted-foreground flex items-center gap-1">
      <Eye className="h-3 w-3" />
      {count} {count === 1 ? "view" : "views"}
    </span>
  );
}
