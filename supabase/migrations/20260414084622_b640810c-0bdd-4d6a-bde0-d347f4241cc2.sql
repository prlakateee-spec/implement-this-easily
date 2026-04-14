ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS is_client boolean NOT NULL DEFAULT false;