-- RIHULA GROUP GOAL — FINAL ANONYMOUS SUMMARY
-- Run this entire script in Supabase SQL Editor.
-- It keeps the Group Goal from public.settings and returns only aggregate data.

DROP FUNCTION IF EXISTS public.get_group_goal_summary();

CREATE OR REPLACE FUNCTION public.get_group_goal_summary()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $function$
DECLARE
    v_member_count integer := 0;
    v_group_goal numeric := 0;
    v_collected numeric := 0;
    v_wednesday numeric := 0;
    v_saturday numeric := 0;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    -- Keep the administrator's existing Group Goal setting.
    SELECT COALESCE(s.group_goal, 30000)::numeric
    INTO v_group_goal
    FROM public.settings s
    WHERE s.id = 1;

    IF v_group_goal IS NULL OR v_group_goal <= 0 THEN
        v_group_goal := 30000;
    END IF;

    -- Count the actual member records. No names or personal data are returned.
    SELECT COUNT(*)::integer
    INTO v_member_count
    FROM public.members;

    -- Total contributions.
    SELECT COALESCE(SUM(c.amount), 0)::numeric
    INTO v_collected
    FROM public.contributions c;

    -- Wednesday collection total.
    SELECT COALESCE(SUM(c.amount), 0)::numeric
    INTO v_wednesday
    FROM public.contributions c
    WHERE EXTRACT(ISODOW FROM (c.created_at AT TIME ZONE 'Africa/Nairobi')) = 3;

    -- Saturday collection total.
    SELECT COALESCE(SUM(c.amount), 0)::numeric
    INTO v_saturday
    FROM public.contributions c
    WHERE EXTRACT(ISODOW FROM (c.created_at AT TIME ZONE 'Africa/Nairobi')) = 6;

    RETURN jsonb_build_object(
        'group_goal', v_group_goal,
        'collected', v_collected,
        'remaining', GREATEST(v_group_goal - v_collected, 0),
        'percent', CASE
            WHEN v_group_goal > 0
            THEN LEAST(100, ROUND((v_collected / v_group_goal) * 100)::integer)
            ELSE 0
        END,
        'member_count', v_member_count,
        'average_goal', CASE
            WHEN v_member_count > 0
            THEN ROUND(v_group_goal / v_member_count)::numeric
            ELSE 0
        END,
        'wednesday_collected', v_wednesday,
        'saturday_collected', v_saturday,
        'calculated_at', now()
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_group_goal_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_group_goal_summary() TO authenticated;
