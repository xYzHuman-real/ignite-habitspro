
-- Add min_points_required to challenges for premium gating
ALTER TABLE public.challenges ADD COLUMN min_points_required integer NOT NULL DEFAULT 0;

-- Create rewards shop items table
CREATE TABLE public.shop_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT '🎁',
  category text NOT NULL DEFAULT 'general',
  price integer NOT NULL DEFAULT 100,
  item_type text NOT NULL DEFAULT 'streak_freeze',
  item_value text NOT NULL DEFAULT '1',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop items viewable by everyone" ON public.shop_items FOR SELECT USING (true);

-- Create purchase history table
CREATE TABLE public.shop_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id uuid REFERENCES public.shop_items(id) NOT NULL,
  price_paid integer NOT NULL,
  purchased_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases" ON public.shop_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can make purchases" ON public.shop_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create daily login rewards table
CREATE TABLE public.daily_logins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  login_date date NOT NULL DEFAULT CURRENT_DATE,
  streak integer NOT NULL DEFAULT 1,
  points_earned integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, login_date)
);

ALTER TABLE public.daily_logins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logins" ON public.daily_logins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can log own logins" ON public.daily_logins FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add XP level and title to profiles
ALTER TABLE public.profiles ADD COLUMN xp_level integer NOT NULL DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN title text NOT NULL DEFAULT 'Beginner';
