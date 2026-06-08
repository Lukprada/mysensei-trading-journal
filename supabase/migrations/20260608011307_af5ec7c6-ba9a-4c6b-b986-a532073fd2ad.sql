
-- Journal entries: standalone notes that can be linked to trades
CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT NOT NULL DEFAULT '',
  mood TEXT,
  tags TEXT[] DEFAULT '{}',
  tradingview_links TEXT[] DEFAULT '{}',
  linked_trade_ids UUID[] DEFAULT '{}',
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_entries TO authenticated;
GRANT ALL ON public.journal_entries TO service_role;

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own journal entries" ON public.journal_entries
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own journal entries" ON public.journal_entries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own journal entries" ON public.journal_entries
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own journal entries" ON public.journal_entries
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_journal_entry()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_journal_entries_updated
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.touch_journal_entry();

CREATE INDEX idx_journal_entries_user ON public.journal_entries(user_id, entry_date DESC);

-- Migrate existing "UNKNOWN" Myfxbook trades into cash_flows (they are actually deposits/withdrawals)
INSERT INTO public.cash_flows (user_id, account_id, flow_type, amount, occurred_at, source, external_id, note)
SELECT
  user_id,
  account_id,
  CASE WHEN pnl >= 0 THEN 'deposit' ELSE 'withdrawal' END,
  ABS(pnl),
  COALESCE(exit_time, date::timestamptz),
  'myfxbook',
  'mfxb_migrated_' || id::text,
  'Migrated from balance entry'
FROM public.trades
WHERE asset = 'UNKNOWN' AND source = 'myfxbook'
ON CONFLICT (external_id) DO NOTHING;

DELETE FROM public.trades WHERE asset = 'UNKNOWN' AND source = 'myfxbook';
