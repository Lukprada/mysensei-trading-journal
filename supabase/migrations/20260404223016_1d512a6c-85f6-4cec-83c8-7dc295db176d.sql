
-- View tracking table
CREATE TABLE public.analysis_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  viewer_ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.analysis_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a view (anonymous tracking)
CREATE POLICY "Anyone can insert views" ON public.analysis_views
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Only authenticated users can read view counts (for the author's dashboard)
CREATE POLICY "Authenticated users can read views" ON public.analysis_views
  FOR SELECT TO authenticated USING (true);

-- Emoji reactions table
CREATE TABLE public.analysis_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  reactor_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.analysis_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone can react
CREATE POLICY "Anyone can insert reactions" ON public.analysis_reactions
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Anyone can read reactions (shown publicly)
CREATE POLICY "Anyone can read reactions" ON public.analysis_reactions
  FOR SELECT TO anon, authenticated USING (true);

-- Comments table
CREATE TABLE public.analysis_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.analysis_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can comment
CREATE POLICY "Anyone can insert comments" ON public.analysis_comments
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Anyone can read comments
CREATE POLICY "Anyone can read comments" ON public.analysis_comments
  FOR SELECT TO anon, authenticated USING (true);

-- Author can delete comments on their analyses
CREATE POLICY "Authors can delete comments" ON public.analysis_comments
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.analyses
      WHERE analyses.id = analysis_comments.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );
