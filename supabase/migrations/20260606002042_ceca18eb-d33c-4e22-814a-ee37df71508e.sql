
-- Extend trades with broker-level economics and journaling
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS commission numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS swap numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS magic_number text,
  ADD COLUMN IF NOT EXISTS broker_comment text,
  ADD COLUMN IF NOT EXISTS journal_notes text,
  ADD COLUMN IF NOT EXISTS tradingview_links text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS linked_group_id uuid;

CREATE INDEX IF NOT EXISTS idx_trades_linked_group ON public.trades(linked_group_id) WHERE linked_group_id IS NOT NULL;

-- Cash flows table for deposits / withdrawals
CREATE TABLE IF NOT EXISTS public.cash_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id uuid NOT NULL,
  flow_type text NOT NULL CHECK (flow_type IN ('deposit','withdrawal')),
  amount numeric NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'manual',
  external_id text UNIQUE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_flows TO authenticated;
GRANT ALL ON public.cash_flows TO service_role;

ALTER TABLE public.cash_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own cash flows" ON public.cash_flows FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own cash flows" ON public.cash_flows FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own cash flows" ON public.cash_flows FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own cash flows" ON public.cash_flows FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_cash_flows_account ON public.cash_flows(account_id, occurred_at);
