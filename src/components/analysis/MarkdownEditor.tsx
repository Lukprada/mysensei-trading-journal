import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered,
  Link, Image, Quote, Code, Eye, Edit, BarChart3
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export function MarkdownEditor({ content, onChange }: MarkdownEditorProps) {
  const [mode, setMode] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const insertTradingViewEmbed = useCallback(() => {
    insertAtCursor(
      "\n<!-- TradingView Chart -->\n[![TradingView Chart](", 
      ")]\n",
      "paste-your-tradingview-chart-image-url-here"
    );
  }, [insertAtCursor]);

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
    { icon: Link, action: () => insertAtCursor("[", "](url)", "link text"), label: "Link" },
    { icon: Image, action: () => insertAtCursor("![", "](image-url)", "alt text"), label: "Image" },
    { icon: BarChart3, action: insertTradingViewEmbed, label: "TradingView Chart" },
  ];

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
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
            >
              <tool.icon className="h-4 w-4" />
            </Button>
          )
        )}
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
          placeholder="Write your analysis here... Use the toolbar for formatting or write Markdown directly.

Tips:
• Paste TradingView chart image links using the chart button
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
