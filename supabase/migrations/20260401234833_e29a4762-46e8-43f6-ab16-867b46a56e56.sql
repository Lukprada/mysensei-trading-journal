
CREATE TABLE public.analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read published analyses
CREATE POLICY "Authenticated users can read published analyses"
  ON public.analyses FOR SELECT TO authenticated
  USING (published = true OR user_id = auth.uid());

-- Authors can insert their own analyses
CREATE POLICY "Users can create own analyses"
  ON public.analyses FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Authors can update their own analyses
CREATE POLICY "Users can update own analyses"
  ON public.analyses FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Authors can delete their own analyses
CREATE POLICY "Users can delete own analyses"
  ON public.analyses FOR DELETE TO authenticated
  USING (user_id = auth.uid());
