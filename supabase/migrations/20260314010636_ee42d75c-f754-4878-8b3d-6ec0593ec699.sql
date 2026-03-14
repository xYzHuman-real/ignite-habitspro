
ALTER TABLE public.habits 
ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'important',
ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS reminder_days text[] NOT NULL DEFAULT ARRAY['mon','tue','wed','thu','fri','sat','sun'];
