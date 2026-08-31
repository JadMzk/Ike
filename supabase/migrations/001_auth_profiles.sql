-- Run in Supabase SQL Editor (or via CLI) after enabling Google OAuth.
-- Profiles mirror auth.users; tasks are owned by profile UUID.

-- ------------------------------------------------------------------ profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  plan_type TEXT NOT NULL DEFAULT 'free'
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile row (app also syncs via FastAPI).
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ------------------------------------------------------------------ optional sign-in allowlist
CREATE TABLE IF NOT EXISTS public.allowed_emails (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FastAPI enforces allowlist on POST /auth/sync when rows exist or ALLOWED_EMAILS is set.
ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;

-- No policies → only service_role / direct SQL / FastAPI pooler can read/write.

-- Example seed (replace with your Google email):
-- INSERT INTO public.allowed_emails (email) VALUES ('you@gmail.com')
-- ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------------ tasks.profile_id
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS ix_tasks_profile_id ON public.tasks (profile_id);

-- Optional: auto-create profile when a new auth user signs up (FastAPI also syncs).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
