
-- Add attachments column to todos table
ALTER TABLE public.todos ADD COLUMN attachments jsonb DEFAULT '[]'::jsonb;
