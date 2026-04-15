
CREATE POLICY "Admin can delete deliveries"
ON public.deliveries
FOR DELETE
TO authenticated
USING (((auth.jwt() ->> 'email'::text) = 'terra.ai.studio@yandex.ru'::text) OR ((auth.jwt() ->> 'email'::text) = 'terra_ai_team@kitay.club'::text));

CREATE POLICY "Admin can delete orders"
ON public.order_requests
FOR DELETE
TO authenticated
USING (((auth.jwt() ->> 'email'::text) = 'terra.ai.studio@yandex.ru'::text) OR ((auth.jwt() ->> 'email'::text) = 'terra_ai_team@kitay.club'::text));

CREATE POLICY "Admin can delete pick requests"
ON public.pick_requests
FOR DELETE
TO authenticated
USING (((auth.jwt() ->> 'email'::text) = 'terra.ai.studio@yandex.ru'::text) OR ((auth.jwt() ->> 'email'::text) = 'terra_ai_team@kitay.club'::text));
