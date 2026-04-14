
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS has_delivery boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_order boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_pick boolean NOT NULL DEFAULT false;
