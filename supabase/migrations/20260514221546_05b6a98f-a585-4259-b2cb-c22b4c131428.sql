ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS stop_loss numeric,
  ADD COLUMN IF NOT EXISTS take_profit numeric,
  ADD COLUMN IF NOT EXISTS exit_time timestamptz,
  ADD COLUMN IF NOT EXISTS setup_tag text,
  ADD COLUMN IF NOT EXISTS rules_followed boolean,
  ADD COLUMN IF NOT EXISTS risk_amount numeric;