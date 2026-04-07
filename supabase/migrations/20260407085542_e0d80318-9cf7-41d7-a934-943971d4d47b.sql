
ALTER TABLE public.deliveries ADD COLUMN admin_viewed_at timestamptz DEFAULT NULL;
ALTER TABLE public.order_requests ADD COLUMN admin_viewed_at timestamptz DEFAULT NULL;

CREATE POLICY "Admin can update deliveries" ON public.deliveries
FOR UPDATE TO authenticated
USING (((auth.jwt() ->> 'email'::text) = 'terra.ai.studio@yandex.ru'::text) OR ((auth.jwt() ->> 'email'::text) = 'terra_ai_team@kitay.club'::text))
WITH CHECK (((auth.jwt() ->> 'email'::text) = 'terra.ai.studio@yandex.ru'::text) OR ((auth.jwt() ->> 'email'::text) = 'terra_ai_team@kitay.club'::text));

CREATE POLICY "Admin can update orders" ON public.order_requests
FOR UPDATE TO authenticated
USING (((auth.jwt() ->> 'email'::text) = 'terra.ai.studio@yandex.ru'::text) OR ((auth.jwt() ->> 'email'::text) = 'terra_ai_team@kitay.club'::text))
WITH CHECK (((auth.jwt() ->> 'email'::text) = 'terra.ai.studio@yandex.ru'::text) OR ((auth.jwt() ->> 'email'::text) = 'terra_ai_team@kitay.club'::text));
