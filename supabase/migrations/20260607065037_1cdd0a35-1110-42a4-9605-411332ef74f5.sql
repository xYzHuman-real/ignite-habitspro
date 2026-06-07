ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lifetime_xp INTEGER NOT NULL DEFAULT 0;
UPDATE public.profiles SET lifetime_xp = GREATEST(lifetime_xp, leaderboard_points);