import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered,
  Image, Quote, Code, Eye, Edit, BarChart3, Upload, Loader2
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export function MarkdownEditor({ content, onChange }: MarkdownEditorProps) {
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const insertAtCursor = useCallback((before: string, after = "", placeholder = "") => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.substring(start, end);
    const text = selected || placeholder;
    const newContent = content.substring(0, start) + before + text + after + content.substring(end);
    onChange(newContent);
    setTimeout(() => {
      ta.focus();
      const newPos = start + before.length + text.length + after.length;
      ta.setSelectionRange(newPos, newPos);
    }, 0);
  }, [content, onChange]);

  const handleInlineImageUpload = useCallback(async (file: File) => {
    if (!user) { toast.error("You must be logged in"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Only images allowed"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }

    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;

    const { error } = await supabase.storage
      .from("analysis-images")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (error) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("analysis-images")
      .getPublicUrl(path);

    insertAtCursor(`\n![${file.name}](${urlData.publicUrl})\n`);
    setUploading(false);
    toast.success("Image inserted!");
  }, [user, insertAtCursor]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) handleInlineImageUpload(file);
        return;
      }
    }
  }, [handleInlineImageUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) {
      e.preventDefault();
      handleInlineImageUpload(file);
    }
  }, [handleInlineImageUpload]);

  const tools = [
    { icon: Bold, action: () => insertAtCursor("**", "**", "bold"), label: "Bold" },
    { icon: Italic, action: () => insertAtCursor("*", "*", "italic"), label: "Italic" },
    { icon: Heading1, action: () => insertAtCursor("\n# ", "\n", "Heading"), label: "H1" },
    { icon: Heading2, action: () => insertAtCursor("\n## ", "\n", "Heading"), label: "H2" },
    { icon: Heading3, action: () => insertAtCursor("\n### ", "\n", "Heading"), label: "H3" },
    null,
    { icon: List, action: () => insertAtCursor("\n- ", "\n", "item"), label: "Bullet List" },
    { icon: ListOrdered, action: () => insertAtCursor("\n1. ", "\n", "item"), label: "Numbered List" },
    { icon: Quote, action: () => insertAtCursor("\n> ", "\n", "quote"), label: "Quote" },
    { icon: Code, action: () => insertAtCursor("\n```\n", "\n```\n", "code"), label: "Code Block" },
    null,
    { icon: Upload, action: () => fileInputRef.current?.click(), label: "Upload Image" },
    { icon: BarChart3, action: () => insertAtCursor("\n![Chart](", ")\n", "paste-chart-url"), label: "Chart URL" },
  ];

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleInlineImageUpload(file);
          e.target.value = "";
        }}
      />
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/30 flex-wrap">
        {tools.map((tool, i) =>
          tool === null ? (
            <Separator key={i} orientation="vertical" className="h-6 mx-1" />
          ) : (
            <Button
              key={i}
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={tool.action}
              title={tool.label}
              disabled={uploading}
            >
              <tool.icon className="h-4 w-4" />
            </Button>
          )
        )}
        {uploading && <Loader2 className="h-4 w-4 animate-spin text-primary ml-2" />}
        <div className="flex-1" />
        <div className="flex items-center border border-border rounded-md overflow-hidden">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 rounded-none text-xs gap-1",
              mode === "write" && "bg-primary/10 text-primary"
            )}
            onClick={() => setMode("write")}
          >
            <Edit className="h-3 w-3" /> Write
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 rounded-none text-xs gap-1",
              mode === "preview" && "bg-primary/10 text-primary"
            )}
            onClick={() => setMode("preview")}
          >
            <Eye className="h-3 w-3" /> Preview
          </Button>
        </div>
      </div>

      {/* Editor / Preview */}
      {mode === "write" ? (
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onPaste={handlePaste}
          onDrop={handleDrop}
          placeholder="Write your analysis here...

Tips:
• Upload images using the toolbar button or paste/drop them directly
• Use **bold** for emphasis
• Use ## for section headings
• Use > for key observations"
          className="min-h-[400px] border-0 rounded-none focus-visible:ring-0 font-mono text-sm resize-y bg-background"
        />
      ) : (
        <div className="min-h-[400px] p-4 prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground/80 prose-strong:text-primary prose-a:text-primary prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground prose-code:text-primary prose-img:rounded-lg prose-img:border prose-img:border-border">
          {content ? (
            <ReactMarkdown>{content}</ReactMarkdown>
          ) : (
            <p className="text-muted-foreground italic">Nothing to preview yet...</p>
          )}
        </div>
      )}
    </div>
  );
}
