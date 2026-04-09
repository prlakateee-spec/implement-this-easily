
CREATE OR REPLACE FUNCTION public.calculate_ambassador_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.balance_usd = (NEW.referrals_channel * 0.3) + (NEW.referrals_club * 2) + (NEW.referrals_orders * 2);
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_calculate_ambassador_balance
BEFORE INSERT OR UPDATE OF referrals_channel, referrals_club, referrals_orders
ON public.ambassador_profiles
FOR EACH ROW
EXECUTE FUNCTION public.calculate_ambassador_balance();
