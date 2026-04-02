
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.user_profiles;

CREATE POLICY "Admin can view all profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'email') = 'terra.ai.studio@yandex.ru'
  OR (auth.jwt() ->> 'email') = 'terra_ai_team@kitay.club'
);
