import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trash2, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}

interface CommentSectionProps {
  analysisId: string;
  isOwner?: boolean;
}

export function CommentSection({ analysisId, isOwner = false }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState(() => localStorage.getItem("comment_name") || "");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase
      .from("analysis_comments")
      .select("*")
      .eq("analysis_id", analysisId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setComments(data);
      });
  }, [analysisId]);

  const handleSubmit = async () => {
    const trimName = name.trim();
    const trimContent = content.trim();
    if (!trimName) { toast.error("Please enter your name"); return; }
    if (trimName.length > 50) { toast.error("Name too long (max 50 chars)"); return; }
    if (!trimContent) { toast.error("Please write a comment"); return; }
    if (trimContent.length > 1000) { toast.error("Comment too long (max 1000 chars)"); return; }

    setSubmitting(true);
    localStorage.setItem("comment_name", trimName);

    const { data, error } = await supabase
      .from("analysis_comments")
      .insert({ analysis_id: analysisId, author_name: trimName, content: trimContent })
      .select()
      .single();

    setSubmitting(false);
    if (error) {
      toast.error("Failed to post comment");
      return;
    }
    setComments((prev) => [...prev, data]);
    setContent("");
    toast.success("Comment posted!");
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase
      .from("analysis_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      toast.error("Failed to delete comment");
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    toast.success("Comment deleted");
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        Comments ({comments.length})
      </h3>

      {/* Comment form */}
      <div className="space-y-3 p-4 rounded-lg border border-border bg-card">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          maxLength={50}
          className="max-w-xs"
        />
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          maxLength={1000}
          rows={3}
        />
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          size="sm"
          className="gap-2"
        >
          <Send className="h-3.5 w-3.5" /> Post Comment
        </Button>
      </div>

      {/* Comments list */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 p-3 rounded-lg border border-border bg-card/50">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {comment.author_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{comment.author_name}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(comment.created_at), "MMM d, yyyy 'at' h:mm a")}
                </span>
                {isOwner && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete comment"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="text-sm text-foreground/80 mt-1 whitespace-pre-wrap break-words">{comment.content}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
        )}
      </div>
    </div>
  );
}
