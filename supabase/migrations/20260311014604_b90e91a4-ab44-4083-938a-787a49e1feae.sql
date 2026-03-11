
ALTER TABLE public.pomodoro_sessions ADD COLUMN IF NOT EXISTS linked_task TEXT DEFAULT NULL;
ALTER TABLE public.pomodoro_sessions ADD COLUMN IF NOT EXISTS linked_subject TEXT DEFAULT NULL;
