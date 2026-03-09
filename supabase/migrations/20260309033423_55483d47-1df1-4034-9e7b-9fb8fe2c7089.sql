ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS show_avatar boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS show_stats boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS show_profile boolean NOT NULL DEFAULT true;