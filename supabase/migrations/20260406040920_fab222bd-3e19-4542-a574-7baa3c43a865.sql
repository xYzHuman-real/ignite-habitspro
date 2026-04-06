
-- Add new columns to todos table
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS due_date timestamptz DEFAULT NULL;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS notes text DEFAULT '';
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS recurring text DEFAULT 'none';
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Create subtasks table
CREATE TABLE public.subtasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  todo_id uuid NOT NULL REFERENCES public.todos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  text text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subtasks" ON public.subtasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subtasks" ON public.subtasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subtasks" ON public.subtasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own subtasks" ON public.subtasks FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_subtasks_todo_id ON public.subtasks(todo_id);
CREATE INDEX idx_todos_due_date ON public.todos(due_date);
CREATE INDEX idx_todos_tags ON public.todos USING GIN(tags);
