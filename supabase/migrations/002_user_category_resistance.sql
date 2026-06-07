-- Per-profile adaptive resistance by task category.
-- Run in Supabase SQL Editor (or via CLI) alongside 001_auth_profiles.sql.

CREATE TABLE IF NOT EXISTS public.user_category_resistance (
  id BIGSERIAL PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  category VARCHAR(64) NOT NULL,
  resistance_factor DOUBLE PRECISION NOT NULL DEFAULT 0.30,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_category_resistance UNIQUE (profile_id, category),
  CONSTRAINT ck_user_category_resistance_bounds
    CHECK (resistance_factor >= 0.10 AND resistance_factor <= 1.50)
);

CREATE INDEX IF NOT EXISTS ix_user_category_resistance_profile_id
  ON public.user_category_resistance (profile_id);

ALTER TABLE public.user_category_resistance ENABLE ROW LEVEL SECURITY;

-- No client policies — FastAPI (pooler) manages these rows.
