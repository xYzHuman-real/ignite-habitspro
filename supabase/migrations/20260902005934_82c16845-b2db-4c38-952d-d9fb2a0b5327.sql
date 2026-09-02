CREATE TABLE public.ad_reward_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  impression_id text NOT NULL,
  points integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, impression_id)
);

GRANT SELECT ON public.ad_reward_claims TO authenticated;
GRANT ALL ON public.ad_reward_claims TO service_role;

ALTER TABLE public.ad_reward_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own ad reward claims"
ON public.ad_reward_claims FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.claim_ad_reward(_impression_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller uuid := auth.uid();
  reward integer := 10;
  daily_cap integer := 10;
  today_count integer;
  inserted integer;
  new_points integer;
  new_coins integer;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _impression_id IS NULL OR length(trim(_impression_id)) < 8 THEN
    RAISE EXCEPTION 'Invalid ad impression';
  END IF;

  SELECT count(*) INTO today_count
  FROM public.ad_reward_claims
  WHERE user_id = caller AND created_at::date = current_date;

  IF today_count >= daily_cap THEN
    RETURN jsonb_build_object('awarded', false, 'reason', 'daily_limit');
  END IF;

  INSERT INTO public.ad_reward_claims (user_id, impression_id, points)
  VALUES (caller, _impression_id, reward)
  ON CONFLICT (user_id, impression_id) DO NOTHING;

  GET DIAGNOSTICS inserted = ROW_COUNT;
  IF inserted = 0 THEN
    RETURN jsonb_build_object('awarded', false, 'reason', 'duplicate');
  END IF;

  UPDATE public.profiles
  SET leaderboard_points = leaderboard_points + reward,
      coins = COALESCE(coins, 0) + reward,
      lifetime_xp = COALESCE(lifetime_xp, 0) + reward
  WHERE user_id = caller
  RETURNING leaderboard_points, coins INTO new_points, new_coins;

  RETURN jsonb_build_object('awarded', true, 'points', reward, 'leaderboard_points', new_points, 'coins', new_coins);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_ad_reward(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_ad_reward(text) TO authenticated;