
CREATE TABLE public.subscription_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  amount_inr INTEGER NOT NULL DEFAULT 0,
  receipt_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success',
  failure_reason TEXT,
  provider TEXT NOT NULL DEFAULT 'google_play_sandbox',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.subscription_history TO authenticated;
GRANT ALL ON public.subscription_history TO service_role;

ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscription history"
  ON public.subscription_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own subscription history"
  ON public.subscription_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_subscription_history_user ON public.subscription_history(user_id, created_at DESC);
