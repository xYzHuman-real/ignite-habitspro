
-- Referral columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by_code text;

-- Helper: generate a random 6-char alphanumeric uppercase code (no confusing chars)
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SET search_path TO 'public'
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  attempts int := 0;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, floor(random() * length(chars))::int + 1, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = code);
    attempts := attempts + 1;
    IF attempts > 20 THEN
      code := code || floor(random() * 1000)::text;
      EXIT;
    END IF;
  END LOOP;
  RETURN code;
END;
$$;

-- Backfill referral codes for existing profiles
UPDATE public.profiles
SET referral_code = public.generate_referral_code()
WHERE referral_code IS NULL;

-- Update handle_new_user to also assign a referral code + keep trial logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, trial_ends_at, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    now() + interval '7 days',
    public.generate_referral_code()
  );
  RETURN NEW;
END;
$$;

-- Apply a referral code: extends premium by 30 days for both the caller and the inviter.
-- Returns the inviter's display_name on success; raises an exception otherwise.
CREATE OR REPLACE FUNCTION public.apply_referral(code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller uuid := auth.uid();
  inviter_id uuid;
  inviter_name text;
  caller_existing text;
  caller_code text;
  normalized text := upper(trim(code));
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT referred_by_code, referral_code INTO caller_existing, caller_code
  FROM public.profiles WHERE user_id = caller;

  IF caller_existing IS NOT NULL THEN
    RAISE EXCEPTION 'Referral already applied';
  END IF;

  IF caller_code = normalized THEN
    RAISE EXCEPTION 'You cannot use your own code';
  END IF;

  SELECT user_id, display_name INTO inviter_id, inviter_name
  FROM public.profiles WHERE referral_code = normalized;

  IF inviter_id IS NULL THEN
    RAISE EXCEPTION 'Invalid referral code';
  END IF;

  -- Mark referral on caller and extend their premium by 30 days
  UPDATE public.profiles
  SET referred_by_code = normalized,
      subscription_tier = 'premium',
      subscription_plan = COALESCE(subscription_plan, 'referral'),
      premium_until = GREATEST(COALESCE(premium_until, now()), COALESCE(trial_ends_at, now()), now()) + interval '30 days'
  WHERE user_id = caller;

  -- Extend inviter's premium by 30 days
  UPDATE public.profiles
  SET subscription_tier = 'premium',
      subscription_plan = COALESCE(subscription_plan, 'referral'),
      premium_until = GREATEST(COALESCE(premium_until, now()), COALESCE(trial_ends_at, now()), now()) + interval '30 days'
  WHERE user_id = inviter_id;

  RETURN COALESCE(inviter_name, 'a friend');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.apply_referral(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_referral(text) TO authenticated;
