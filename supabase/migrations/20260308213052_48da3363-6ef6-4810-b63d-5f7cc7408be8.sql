
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS myfxbook_account_id text;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS external_id text;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';
CREATE UNIQUE INDEX IF NOT EXISTS trades_external_id_unique ON public.trades (external_id) WHERE external_id IS NOT NULL;
