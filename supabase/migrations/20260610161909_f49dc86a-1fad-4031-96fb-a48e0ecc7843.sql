CREATE OR REPLACE FUNCTION public.get_shared_streak(user_a uuid, user_b uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  streak integer := 0;
  check_date date := current_date;
  has_a boolean;
  has_b boolean;
  is_today boolean;
BEGIN
  LOOP
    is_today := (check_date = current_date);

    SELECT EXISTS (
      SELECT 1 FROM public.habit_completions
      WHERE user_id = user_a AND completed_date = check_date
      UNION ALL
      SELECT 1 FROM public.pomodoro_sessions
      WHERE user_id = user_a AND session_type = 'focus' AND completed = true AND created_at::date = check_date
    ) INTO has_a;

    SELECT EXISTS (
      SELECT 1 FROM public.habit_completions
      WHERE user_id = user_b AND completed_date = check_date
      UNION ALL
      SELECT 1 FROM public.pomodoro_sessions
      WHERE user_id = user_b AND session_type = 'focus' AND completed = true AND created_at::date = check_date
    ) INTO has_b;

    IF has_a AND has_b THEN
      streak := streak + 1;
      check_date := check_date - 1;
    ELSIF is_today THEN
      -- Today is grace day; don't break streak yet
      check_date := check_date - 1;
    ELSE
      EXIT;
    END IF;

    IF streak > 3650 THEN EXIT; END IF;
  END LOOP;

  RETURN streak;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_streak(uuid, uuid) TO authenticated;