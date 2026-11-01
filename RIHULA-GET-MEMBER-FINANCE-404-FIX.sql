-- RIHULA repair: restore the RPC used by finance.js and withdrawal-fix.js.
-- Run this in Supabase SQL Editor as a project owner.
-- The function only returns the signed-in member's totals (or an admin's totals).

BEGIN;

CREATE OR REPLACE FUNCTION public.get_member_finance(p_phone text)
RETURNS TABLE(
  contributions numeric,
  withdrawals numeric,
  net_savings numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_phone text;
  allowed boolean;
BEGIN
  requested_phone := regexp_replace(COALESCE(p_phone, ''), '[^0-9]', '', 'g');
  IF requested_phone LIKE '254%' THEN
    requested_phone := '0' || substring(requested_phone from 4);
  END IF;

  IF requested_phone = '' THEN
    RAISE EXCEPTION 'A valid member phone number is required.';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.members m
    WHERE (
      CASE
        WHEN regexp_replace(m.phone::text, '[^0-9]', '', 'g') LIKE '254%'
        THEN '0' || substring(regexp_replace(m.phone::text, '[^0-9]', '', 'g') from 4)
        ELSE regexp_replace(m.phone::text, '[^0-9]', '', 'g')
      END
    ) = requested_phone
    AND (m.auth_id = auth.uid() OR public.is_rihula_admin())
  ) INTO allowed;

  IF NOT allowed THEN
    RAISE EXCEPTION 'Not authorized to view this member balance.';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE((
      SELECT SUM(c.amount)
      FROM public.contributions c
      WHERE CASE
        WHEN regexp_replace(c.member_phone::text, '[^0-9]', '', 'g') LIKE '254%'
        THEN '0' || substring(regexp_replace(c.member_phone::text, '[^0-9]', '', 'g') from 4)
        ELSE regexp_replace(c.member_phone::text, '[^0-9]', '', 'g')
      END = requested_phone
    ), 0)::numeric,
    COALESCE((
      SELECT SUM(w.amount)
      FROM public.withdrawals w
      WHERE CASE
        WHEN regexp_replace(w.member_phone::text, '[^0-9]', '', 'g') LIKE '254%'
        THEN '0' || substring(regexp_replace(w.member_phone::text, '[^0-9]', '', 'g') from 4)
        ELSE regexp_replace(w.member_phone::text, '[^0-9]', '', 'g')
      END = requested_phone
    ), 0)::numeric,
    GREATEST(
      COALESCE((
        SELECT SUM(c.amount)
        FROM public.contributions c
        WHERE CASE
          WHEN regexp_replace(c.member_phone::text, '[^0-9]', '', 'g') LIKE '254%'
          THEN '0' || substring(regexp_replace(c.member_phone::text, '[^0-9]', '', 'g') from 4)
          ELSE regexp_replace(c.member_phone::text, '[^0-9]', '', 'g')
        END = requested_phone
      ), 0)
      -
      COALESCE((
        SELECT SUM(w.amount)
        FROM public.withdrawals w
        WHERE CASE
          WHEN regexp_replace(w.member_phone::text, '[^0-9]', '', 'g') LIKE '254%'
          THEN '0' || substring(regexp_replace(w.member_phone::text, '[^0-9]', '', 'g') from 4)
          ELSE regexp_replace(w.member_phone::text, '[^0-9]', '', 'g')
        END = requested_phone
      ), 0),
      0
    )::numeric;
END;
$$;

REVOKE ALL ON FUNCTION public.get_member_finance(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_member_finance(text) TO authenticated;

COMMIT;

-- Ask PostgREST to refresh its function/schema cache.
NOTIFY pgrst, 'reload schema';
