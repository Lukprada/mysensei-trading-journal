
-- Create table for storing Myfxbook credentials per user
CREATE TABLE public.myfxbook_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  session_token TEXT,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.myfxbook_credentials ENABLE ROW LEVEL SECURITY;

-- Only the owner can access their own credentials
CREATE POLICY "Users can view own credentials"
ON public.myfxbook_credentials FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credentials"
ON public.myfxbook_credentials FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credentials"
ON public.myfxbook_credentials FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own credentials"
ON public.myfxbook_credentials FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
