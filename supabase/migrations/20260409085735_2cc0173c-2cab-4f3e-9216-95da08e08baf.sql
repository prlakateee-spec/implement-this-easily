CREATE POLICY "Admin can update all profiles"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (((auth.jwt() ->> 'email'::text) = 'terra.ai.studio@yandex.ru'::text) OR ((auth.jwt() ->> 'email'::text) = 'terra_ai_team@kitay.club'::text))
WITH CHECK (((auth.jwt() ->> 'email'::text) = 'terra.ai.studio@yandex.ru'::text) OR ((auth.jwt() ->> 'email'::text) = 'terra_ai_team@kitay.club'::text));