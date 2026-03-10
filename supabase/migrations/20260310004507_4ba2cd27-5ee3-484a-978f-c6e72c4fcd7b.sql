
-- Focus Rooms table
CREATE TABLE public.focus_rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  creator_id uuid NOT NULL,
  is_private boolean NOT NULL DEFAULT false,
  invite_code text UNIQUE,
  session_duration_minutes integer NOT NULL DEFAULT 50,
  break_duration_minutes integer NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'waiting',
  started_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Focus Room Participants
CREATE TABLE public.focus_room_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.focus_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Focus Room Messages (break chat)
CREATE TABLE public.focus_room_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.focus_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.focus_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_room_messages ENABLE ROW LEVEL SECURITY;

-- Focus rooms: everyone can view
CREATE POLICY "Focus rooms viewable by everyone" ON public.focus_rooms FOR SELECT TO public USING (true);
CREATE POLICY "Users can create focus rooms" ON public.focus_rooms FOR INSERT TO public WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update rooms" ON public.focus_rooms FOR UPDATE TO public USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete rooms" ON public.focus_rooms FOR DELETE TO public USING (auth.uid() = creator_id);

-- Participants
CREATE POLICY "Participants viewable by everyone" ON public.focus_room_participants FOR SELECT TO public USING (true);
CREATE POLICY "Users can join rooms" ON public.focus_room_participants FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave rooms" ON public.focus_room_participants FOR DELETE TO public USING (auth.uid() = user_id);

-- Messages
CREATE POLICY "Room members can view messages" ON public.focus_room_messages FOR SELECT TO public USING (
  EXISTS (SELECT 1 FROM public.focus_room_participants WHERE room_id = focus_room_messages.room_id AND user_id = auth.uid())
);
CREATE POLICY "Room members can send messages" ON public.focus_room_messages FOR INSERT TO public WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.focus_room_participants WHERE room_id = focus_room_messages.room_id AND user_id = auth.uid())
);

-- Enable realtime for focus rooms
ALTER PUBLICATION supabase_realtime ADD TABLE public.focus_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.focus_room_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.focus_room_messages;
