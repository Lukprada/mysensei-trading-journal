-- Allow any authenticated user to read display names from profiles
-- so we can show the author of a published analysis.
CREATE POLICY "Authenticated users can view display names"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);