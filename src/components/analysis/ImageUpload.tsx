import React, { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Upload, X, Loader2, Link as LinkIcon, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}

function normalizeTradingViewUrl(raw: string): string {
  const url = raw.trim();
  // tradingview.com/x/XXXX → image at tradingview.com/x/XXXX/  (their page) — we render their CDN preview
  const xMatch = url.match(/tradingview\.com\/x\/([A-Za-z0-9]+)/i);
  if (xMatch) {
    return `https://s3.tradingview.com/snapshots/${xMatch[1][0].toLowerCase()}/${xMatch[1]}.png`;
  }
  // tradingview.com/chart/... or any other URL: pass through if it looks like an image
  return url;
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!user) { toast.error("You must be logged in"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Only images are allowed"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max file size is 5MB"); return; }

    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("analysis-images")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (error) { toast.error("Upload failed"); console.error(error); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("analysis-images").getPublicUrl(path);
    onChange(urlData.publicUrl);
    setUploading(false);
    toast.success("Image uploaded!");
  }, [user, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  }, [uploadFile]);

  function applyUrl() {
    if (!urlInput.trim()) return;
    const normalized = normalizeTradingViewUrl(urlInput);
    onChange(normalized);
    setUrlInput("");
    toast.success("Cover set from URL");
  }

  if (value) {
    return (
      <div className={cn("relative group", className)}>
        <img src={value} alt="Cover" className="w-full max-h-48 object-cover rounded-lg border border-border" />
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-1 text-xs">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={cn("px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors",
            mode === "upload" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}
        ><ImageIcon className="h-3.5 w-3.5" /> Upload file</button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={cn("px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors",
            mode === "url" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}
        ><LinkIcon className="h-3.5 w-3.5" /> Paste URL / TradingView</button>
      </div>

      {mode === "upload" ? (
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30",
          )}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Click to upload</span> or drag & drop
              </p>
              <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2 border border-border rounded-lg p-4 bg-muted/20">
          <div className="flex gap-2">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyUrl())}
              placeholder="https://www.tradingview.com/x/AbCd1234/ or any image URL"
              className="flex-1 text-sm"
            />
            <Button type="button" onClick={applyUrl} size="sm">Use</Button>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Tip: in TradingView press the camera icon → "Copy link to chart image" and paste here.
            We auto-convert <code className="text-primary">tradingview.com/x/...</code> snapshot links.
          </p>
        </div>
      )}
    </div>
  );
}
