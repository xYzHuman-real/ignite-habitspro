
-- Normalize existing usernames so the new check constraint can apply.
UPDATE public.profiles
SET username = NULL
WHERE username IS NOT NULL
  AND (
    length(regexp_replace(lower(username), '[^a-z0-9._]', '', 'g')) < 3
    OR length(regexp_replace(lower(username), '[^a-z0-9._]', '', 'g')) > 20
  );

UPDATE public.profiles p
SET username = sub.new_username
FROM (
  SELECT id,
         substr(regexp_replace(lower(username), '[^a-z0-9._]', '', 'g'), 1, 20) AS new_username
  FROM public.profiles
  WHERE username IS NOT NULL
    AND username !~ '^[a-z0-9._]{3,20}$'
) sub
WHERE p.id = sub.id;

-- Resolve any duplicates created by normalization by appending a numeric suffix.
WITH ranked AS (
  SELECT id, username,
         row_number() OVER (PARTITION BY lower(username) ORDER BY created_at) AS rn
  FROM public.profiles
  WHERE username IS NOT NULL
)
UPDATE public.profiles p
SET username = substr(p.username, 1, 16) || (r.rn)::text
FROM ranked r
WHERE p.id = r.id AND r.rn > 1;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_format_chk
  CHECK (username IS NULL OR username ~ '^[a-z0-9._]{3,20}$');

CREATE OR REPLACE FUNCTION public.suggest_usernames(base text)
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cleaned text;
  candidate text;
  suggestions text[] := ARRAY[]::text[];
  i int;
  suffix int;
BEGIN
  cleaned := lower(regexp_replace(coalesce(base, ''), '[^a-z0-9._]', '', 'g'));
  IF length(cleaned) < 3 THEN
    cleaned := cleaned || 'user';
  END IF;
  cleaned := substr(cleaned, 1, 16);

  FOR i IN 1..40 LOOP
    IF array_length(suggestions, 1) >= 5 THEN EXIT; END IF;
    suffix := floor(random() * 9000 + 100)::int;
    candidate := substr(cleaned, 1, 16) || suffix::text;
    candidate := substr(candidate, 1, 20);
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = candidate) THEN
      suggestions := suggestions || candidate;
    END IF;
  END LOOP;

  RETURN suggestions;
END;
$$;

GRANT EXECUTE ON FUNCTION public.suggest_usernames(text) TO authenticated, anon;
