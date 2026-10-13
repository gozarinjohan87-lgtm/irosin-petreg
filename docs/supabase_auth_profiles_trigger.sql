-- Apply after docs/supabase_schema_migration.sql.
-- Creates one public.profiles row for every Supabase Auth account.

CREATE UNIQUE INDEX IF NOT EXISTS profiles_auth_user_id_uidx
  ON public.profiles (auth_user_id)
  WHERE auth_user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_username text;
BEGIN
  profile_username := lower(
    regexp_replace(
      coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
      '[^a-zA-Z0-9_-]',
      '',
      'g'
    )
  );

  IF length(profile_username) < 3 THEN
    profile_username := 'user_' || left(replace(new.id::text, '-', ''), 12);
  END IF;

  INSERT INTO public.profiles (
    auth_user_id,
    username,
    name,
    email,
    role,
    status,
    verification_status
  )
  VALUES (
    new.id,
    profile_username,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1)),
    lower(new.email),
    'owner',
    'active',
    'pending'
  );

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_petreg ON auth.users;
CREATE TRIGGER on_auth_user_created_petreg
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- Link existing registry profiles to matching Auth users without changing
-- their role, status, verification state, or other profile fields.
UPDATE public.profiles AS profiles
SET auth_user_id = auth_users.id
FROM auth.users AS auth_users
WHERE profiles.auth_user_id IS NULL
  AND lower(profiles.email) = lower(auth_users.email);
