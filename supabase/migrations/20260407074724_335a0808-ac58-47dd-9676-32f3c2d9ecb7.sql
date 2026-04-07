
CREATE TABLE public.shipping_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  recipient_name text NOT NULL DEFAULT '',
  recipient_phone text NOT NULL DEFAULT '',
  delivery_type text NOT NULL DEFAULT 'pickup',
  transport_company text,
  delivery_address text,
  packaging_type text,
  packaging_price numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shipping_profiles ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX shipping_profiles_user_id_idx ON public.shipping_profiles (user_id);

CREATE POLICY "Users can view own shipping profile"
  ON public.shipping_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shipping profile"
  ON public.shipping_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shipping profile"
  ON public.shipping_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
