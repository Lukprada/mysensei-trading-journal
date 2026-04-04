CREATE POLICY "Anyone can read published analyses"
ON public.analyses
FOR SELECT
TO anon
USING (published = true);