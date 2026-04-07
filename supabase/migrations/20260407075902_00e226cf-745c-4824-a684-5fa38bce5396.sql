
DROP INDEX IF EXISTS public.shipping_profiles_user_id_idx;

CREATE POLICY "Users can delete own shipping profile"
  ON public.shipping_profiles FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
