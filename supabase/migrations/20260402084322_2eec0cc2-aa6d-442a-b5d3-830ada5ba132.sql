
CREATE POLICY "Admin can view all profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'terra.ai.studio@yandex.ru'
  OR
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'terra_ai_team@kitay.club'
);
