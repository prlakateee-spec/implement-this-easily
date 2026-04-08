
CREATE TABLE public.ambassador_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  referral_link text,
  balance_usd numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ambassador_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ambassador profile"
  ON public.ambassador_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all ambassador profiles"
  ON public.ambassador_profiles FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'email' = 'terra.ai.studio@yandex.ru')
    OR (auth.jwt() ->> 'email' = 'terra_ai_team@kitay.club')
  );

CREATE POLICY "Admin can insert ambassador profiles"
  ON public.ambassador_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'email' = 'terra.ai.studio@yandex.ru')
    OR (auth.jwt() ->> 'email' = 'terra_ai_team@kitay.club')
  );

CREATE POLICY "Admin can update ambassador profiles"
  ON public.ambassador_profiles FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email' = 'terra.ai.studio@yandex.ru')
    OR (auth.jwt() ->> 'email' = 'terra_ai_team@kitay.club')
  )
  WITH CHECK (
    (auth.jwt() ->> 'email' = 'terra.ai.studio@yandex.ru')
    OR (auth.jwt() ->> 'email' = 'terra_ai_team@kitay.club')
  );

CREATE POLICY "Users can insert own ambassador request"
  ON public.ambassador_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
