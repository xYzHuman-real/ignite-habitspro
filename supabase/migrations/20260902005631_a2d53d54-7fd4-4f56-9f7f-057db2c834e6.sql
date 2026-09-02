
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_room_member(uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_room_member(uuid, uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.join_room_by_code(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.join_room_by_code(text) TO authenticated;
