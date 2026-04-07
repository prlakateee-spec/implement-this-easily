CREATE TABLE public.deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  tracking_number TEXT,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  is_redirect BOOLEAN NOT NULL DEFAULT true,
  transport_company TEXT,
  delivery_address TEXT,
  packaging_type TEXT,
  packaging_price NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deliveries" ON public.deliveries
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deliveries" ON public.deliveries
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deliveries" ON public.deliveries
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own deliveries" ON public.deliveries
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all deliveries" ON public.deliveries
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() ->> 'email' = 'terra.ai.studio@yandex.ru')
    OR (auth.jwt() ->> 'email' = 'terra_ai_team@kitay.club')
  );