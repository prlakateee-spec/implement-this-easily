
CREATE TABLE public.pick_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_link text NOT NULL DEFAULT '',
  price_rub numeric DEFAULT 0,
  image_url text,
  color text DEFAULT '',
  size text DEFAULT '',
  quantity integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  admin_viewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pick_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pick requests" ON public.pick_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pick requests" ON public.pick_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own pick requests" ON public.pick_requests FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all pick requests" ON public.pick_requests FOR SELECT USING (
  (auth.jwt() ->> 'email' = 'terra.ai.studio@yandex.ru') OR (auth.jwt() ->> 'email' = 'terra_ai_team@kitay.club')
);
CREATE POLICY "Admin can update pick requests" ON public.pick_requests FOR UPDATE USING (
  (auth.jwt() ->> 'email' = 'terra.ai.studio@yandex.ru') OR (auth.jwt() ->> 'email' = 'terra_ai_team@kitay.club')
) WITH CHECK (
  (auth.jwt() ->> 'email' = 'terra.ai.studio@yandex.ru') OR (auth.jwt() ->> 'email' = 'terra_ai_team@kitay.club')
);

CREATE TRIGGER update_pick_requests_updated_at BEFORE UPDATE ON public.pick_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
