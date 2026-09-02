
-- 1. PROFILES: authenticated-only reads
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated users"
ON public.profiles FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.profiles FROM anon;

-- 2. FOCUS ROOMS: hide private rooms + invite codes
CREATE OR REPLACE FUNCTION public.is_room_member(_room_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.focus_room_participants
    WHERE room_id = _room_id AND user_id = _user_id
  );
$$;

DROP POLICY IF EXISTS "Focus rooms viewable by everyone" ON public.focus_rooms;
CREATE POLICY "Rooms viewable by members or when public"
ON public.focus_rooms FOR SELECT TO authenticated
USING (
  is_private = false
  OR creator_id = auth.uid()
  OR public.is_room_member(id, auth.uid())
);
REVOKE SELECT ON public.focus_rooms FROM anon;

-- 3. PARTICIPANTS: direct joins only for public rooms
DROP POLICY IF EXISTS "Users can join rooms" ON public.focus_room_participants;
CREATE POLICY "Users can join public rooms"
ON public.focus_room_participants FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.focus_rooms r
    WHERE r.id = room_id AND (r.is_private = false OR r.creator_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Participants viewable by everyone" ON public.focus_room_participants;
CREATE POLICY "Participants viewable by authenticated users"
ON public.focus_room_participants FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.focus_room_participants FROM anon;

-- Secure invite-code join path
CREATE OR REPLACE FUNCTION public.join_room_by_code(code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller uuid := auth.uid();
  target uuid;
BEGIN
  IF caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT id INTO target FROM public.focus_rooms
  WHERE invite_code = upper(trim(code)) AND status IN ('waiting','active');
  IF target IS NULL THEN RAISE EXCEPTION 'Invalid invite code'; END IF;
  INSERT INTO public.focus_room_participants (room_id, user_id)
  VALUES (target, caller)
  ON CONFLICT DO NOTHING;
  RETURN target;
END;
$$;
GRANT EXECUTE ON FUNCTION public.join_room_by_code(text) TO authenticated;

-- 4. FOLLOWERS: authenticated-only reads
DROP POLICY IF EXISTS "Followers viewable by everyone" ON public.followers;
CREATE POLICY "Followers viewable by authenticated users"
ON public.followers FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.followers FROM anon;

-- 5. Lock down helper functions from anonymous callers
REVOKE EXECUTE ON FUNCTION public.apply_referral(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.apply_referral(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_shared_streak(uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_shared_streak(uuid, uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.suggest_usernames(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.suggest_usernames(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.update_group_member_count() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, public;
