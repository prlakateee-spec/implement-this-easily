
-- Create storage bucket for order images
INSERT INTO storage.buckets (id, name, public) VALUES ('order-images', 'order-images', true);

-- Storage policies
CREATE POLICY "Users can upload order images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'order-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view order images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'order-images');

CREATE POLICY "Users can delete own order images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'order-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create orders table
CREATE TABLE public.order_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recipient_name TEXT NOT NULL DEFAULT '',
  recipient_phone TEXT NOT NULL DEFAULT '',
  delivery_type TEXT NOT NULL DEFAULT 'pickup',
  transport_company TEXT,
  delivery_address TEXT,
  packaging_type TEXT,
  packaging_price NUMERIC DEFAULT 0,
  product_name TEXT NOT NULL,
  product_link TEXT,
  qr_image_url TEXT,
  info_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own orders"
  ON public.order_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own orders"
  ON public.order_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own orders"
  ON public.order_requests FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all orders"
  ON public.order_requests FOR SELECT TO authenticated
  USING (
    (auth.jwt() ->> 'email') = 'terra.ai.studio@yandex.ru'
    OR (auth.jwt() ->> 'email') = 'terra_ai_team@kitay.club'
  );
