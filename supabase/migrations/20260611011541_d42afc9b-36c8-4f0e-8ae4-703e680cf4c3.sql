
-- Subscription / premium columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_plan text,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS premium_until timestamptz;

-- Backfill 7-day trial for existing users that have no trial set
UPDATE public.profiles
SET trial_ends_at = now() + interval '7 days'
WHERE trial_ends_at IS NULL AND subscription_tier = 'free';

-- Update new-user trigger to grant a 7-day Premium trial on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, trial_ends_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    now() + interval '7 days'
  );
  RETURN NEW;
END;
$$;
