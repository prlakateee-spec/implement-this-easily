ALTER TABLE public.pick_requests
  ADD COLUMN recipient_name text DEFAULT '',
  ADD COLUMN recipient_phone text DEFAULT '',
  ADD COLUMN delivery_type text DEFAULT 'pickup',
  ADD COLUMN transport_company text,
  ADD COLUMN delivery_address text,
  ADD COLUMN packaging_type text,
  ADD COLUMN packaging_price numeric DEFAULT 0;