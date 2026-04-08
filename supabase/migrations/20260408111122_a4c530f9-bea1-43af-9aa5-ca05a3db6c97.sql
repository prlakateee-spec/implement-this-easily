
ALTER TABLE public.ambassador_profiles
  ADD COLUMN IF NOT EXISTS referrals_channel integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referrals_club integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referrals_orders integer NOT NULL DEFAULT 0;
