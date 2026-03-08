
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  username TEXT UNIQUE,
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  total_streak INTEGER NOT NULL DEFAULT 0,
  habits_completed INTEGER NOT NULL DEFAULT 0,
  pomodoro_sessions_count INTEGER NOT NULL DEFAULT 0,
  leaderboard_points INTEGER NOT NULL DEFAULT 0,
  streak_freezes INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Followers table
CREATE TABLE public.followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Followers viewable by everyone" ON public.followers FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON public.followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.followers FOR DELETE USING (auth.uid() = follower_id);

-- Habits table
CREATE TABLE public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🎯',
  target INTEGER NOT NULL DEFAULT 1,
  current INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  completed_today BOOLEAN NOT NULL DEFAULT false,
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  reminder_time TIME,
  reminder_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own habits" ON public.habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habits" ON public.habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habits" ON public.habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habits" ON public.habits FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON public.habits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Habit completions (for calendar/heatmap)
CREATE TABLE public.habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(habit_id, completed_date)
);

ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own completions" ON public.habit_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own completions" ON public.habit_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own completions" ON public.habit_completions FOR DELETE USING (auth.uid() = user_id);

-- Todos table
CREATE TABLE public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own todos" ON public.todos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own todos" ON public.todos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own todos" ON public.todos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own todos" ON public.todos FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON public.todos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Pomodoro sessions
CREATE TABLE public.pomodoro_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'focus' CHECK (session_type IN ('focus', 'short_break', 'long_break')),
  completed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions" ON public.pomodoro_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.pomodoro_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Badges/Achievements
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold')),
  category TEXT NOT NULL DEFAULT 'general',
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL DEFAULT 1,
  points INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges viewable by everyone" ON public.badges FOR SELECT USING (true);

-- User earned badges
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User badges viewable by everyone" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Users can earn badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Community groups
CREATE TABLE public.community_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '👥',
  member_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Groups viewable by everyone" ON public.community_groups FOR SELECT USING (true);

-- Community memberships
CREATE TABLE public.community_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, group_id)
);

ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Memberships viewable by everyone" ON public.community_memberships FOR SELECT USING (true);
CREATE POLICY "Users can join groups" ON public.community_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON public.community_memberships FOR DELETE USING (auth.uid() = user_id);

-- Community messages
CREATE TABLE public.community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Messages viewable by group members" ON public.community_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.community_memberships WHERE user_id = auth.uid() AND group_id = community_messages.group_id)
);
CREATE POLICY "Members can send messages" ON public.community_messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM public.community_memberships WHERE user_id = auth.uid() AND group_id = community_messages.group_id)
);

-- Accountability partners
CREATE TABLE public.accountability_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  shared_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(requester_id, partner_id)
);

ALTER TABLE public.accountability_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Partners can view own partnerships" ON public.accountability_partners FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = partner_id);
CREATE POLICY "Users can send partner requests" ON public.accountability_partners FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update own partnerships" ON public.accountability_partners FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = partner_id);
CREATE POLICY "Users can delete own partnerships" ON public.accountability_partners FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = partner_id);

-- Challenges
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🏆',
  duration_days INTEGER NOT NULL DEFAULT 7,
  points_reward INTEGER NOT NULL DEFAULT 50,
  badge_reward UUID REFERENCES public.badges(id),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Challenges viewable by everyone" ON public.challenges FOR SELECT USING (true);

-- User challenge participation
CREATE TABLE public.user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, challenge_id)
);

ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own challenges" ON public.user_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can join challenges" ON public.user_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own challenge progress" ON public.user_challenges FOR UPDATE USING (auth.uid() = user_id);

-- Activity log for heatmap
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, activity_type, activity_date)
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own activity" ON public.activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can log own activity" ON public.activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activity" ON public.activity_log FOR UPDATE USING (auth.uid() = user_id);

-- Goals table
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  target_value INTEGER NOT NULL DEFAULT 100,
  current_value INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'percent',
  deadline DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own goals" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update member count function
CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_member_count
AFTER INSERT OR DELETE ON public.community_memberships
FOR EACH ROW EXECUTE FUNCTION public.update_group_member_count();
