
ALTER TABLE public.user_profiles ADD COLUMN unique_code text DEFAULT NULL;

-- Allow admin to update unique_code (already covered by existing update policy for users, admin has full view)
