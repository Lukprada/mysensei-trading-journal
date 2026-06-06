import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MarkdownEditor } from "@/components/analysis/MarkdownEditor";
import { ImageUpload } from "@/components/analysis/ImageUpload";
import { ArrowLeft, Save, Globe, Lock, X } from "lucide-react";
import { toast } from "sonner";

export default function AnalysisEditor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit && id) {
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
          setTitle(data.title);
          setContent(data.content);
          setCoverUrl(data.cover_image_url || "");
          setTags(data.tags || []);
          setPublished(!!data.published);
          setLoading(false);
        });
    }
  }, [id, isEdit]);

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags([...tags, t]);
      setTagInput("");
    }
  }

  async function handleSave() {
    if (!user) return;
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!content.trim()) { toast.error("Content is required"); return; }

    setSaving(true);
    const payload = {
      user_id: user.id,
      title: title.trim(),
      content,
      cover_image_url: coverUrl || null,
      tags,
      published,
      published_at: published ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (isEdit && id) {
      ({ error } = await supabase.from("analyses").update(payload).eq("id", id));
    } else {
      ({ error } = await supabase.from("analyses").insert(payload));
    }

    setSaving(false);
    if (error) {
      toast.error("Failed to save");
      console.error(error);
    } else {
      toast.success(published ? "Saved & public" : "Saved as private draft");
      navigate("/analysis");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/analysis")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold font-display text-gradient">
          {isEdit ? "Edit Analysis" : "New Analysis"}
        </h1>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Weekly EUR/USD Breakdown — March W2"
          className="text-lg font-semibold"
        />
      </div>

      {/* Cover Image */}
      <div className="space-y-2">
        <Label>Cover Image (optional)</Label>
        <ImageUpload value={coverUrl} onChange={setCoverUrl} />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags (up to 5)</Label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            placeholder="e.g. EURUSD, Breakout, Swing"
            className="flex-1"
          />
          <Button type="button" variant="outline" size="sm" onClick={addTag}>Add</Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1 cursor-pointer" onClick={() => setTags(tags.filter(t => t !== tag))}>
                {tag} <X className="h-3 w-3" />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Content Editor */}
      <div className="space-y-2">
        <Label>Content</Label>
        <MarkdownEditor content={content} onChange={setContent} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-border">
        <Button variant="outline" onClick={() => handleSave(false)} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" /> Save Draft
        </Button>
        <Button onClick={() => handleSave(true)} disabled={saving} className="gap-2">
          <Send className="h-4 w-4" /> Publish
        </Button>
      </div>
    </div>
  );
}
