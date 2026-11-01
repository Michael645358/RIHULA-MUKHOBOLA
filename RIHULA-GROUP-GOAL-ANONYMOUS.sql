-- RIHULA GROUP GOAL — ANONYMOUS MEMBER VIEW
--
-- Replaces get_group_goal_summary() so authenticated members receive ONLY
-- aggregate group information. No member names, personal goals, phone
-- numbers, or individual contribution totals are returned by this RPC.
--
-- Run this entire script in the Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.get_group_goal_summary()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    member_count integer := 0;
    personal_goals_set integer := 0;
    group_goal numeric := 0;
    collected numeric := 0;
    wednesday_collected numeric := 0;
    saturday_collected numeric := 0;
    kenya_today date := (now() AT TIME ZONE 'Africa/Nairobi')::date;
    current_wednesday date;
    current_saturday date;
BEGIN
    -- Only authenticated, active RIHULA members may call this function.
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.members m
        WHERE m.auth_id = auth.uid()
          AND COALESCE(m.is_member, true) = true
          AND lower(COALESCE(m.status, 'approved')) NOT IN
              ('blocked', 'suspended', 'inactive', 'rejected', 'pending')
    ) THEN
        RAISE EXCEPTION 'You are not an active RIHULA member.';
    END IF;

    -- Wednesday and Saturday collection periods, using Kenya time.
    current_wednesday := kenya_today - ((EXTRACT(ISODOW FROM kenya_today)::integer - 3 + 7) % 7);
    current_saturday := kenya_today - ((EXTRACT(ISODOW FROM kenya_today)::integer - 6 + 7) % 7);

    -- Calculate anonymous group totals internally.
    -- Member count is calculated separately so it can never be lost from an aggregate.
    SELECT COUNT(*)::integer
    INTO member_count
    FROM public.members m
    WHERE COALESCE(m.is_member, true) = true
      AND lower(COALESCE(m.status, 'approved')) NOT IN
          ('blocked', 'suspended', 'inactive', 'rejected', 'pending');

    SELECT
        COUNT(*) FILTER (
            WHERE m.goal IS NOT NULL AND m.goal > 0
        )::integer,
        COALESCE(
            SUM(
                CASE
                    WHEN m.goal IS NOT NULL AND m.goal > 0
                    THEN m.goal::numeric
                    ELSE 5000::numeric
                END
            ),
            0
        )::numeric
    INTO
        personal_goals_set,
        group_goal
    FROM public.members m
    WHERE COALESCE(m.is_member, true) = true
      AND lower(COALESCE(m.status, 'approved')) NOT IN
          ('blocked', 'suspended', 'inactive', 'rejected', 'pending');

    -- Total group contributions.
    SELECT COALESCE(SUM(c.amount), 0)::numeric
    INTO collected
    FROM public.contributions c;

    -- Wednesday contribution period currently displayed.
    SELECT COALESCE(SUM(c.amount), 0)::numeric
    INTO wednesday_collected
    FROM public.contributions c
    WHERE (
        CASE EXTRACT(ISODOW FROM ((c.created_at AT TIME ZONE 'Africa/Nairobi')::date))::integer
            WHEN 1 THEN ((c.created_at AT TIME ZONE 'Africa/Nairobi')::date - 5)
            WHEN 2 THEN ((c.created_at AT TIME ZONE 'Africa/Nairobi')::date - 6)
            WHEN 3 THEN ((c.created_at AT TIME ZONE 'Africa/Nairobi')::date)
            WHEN 4 THEN ((c.created_at AT TIME ZONE 'Africa/Nairobi')::date - 1)
            WHEN 5 THEN ((c.created_at AT TIME ZONE 'Africa/Nairobi')::date - 2)
            WHEN 6 THEN ((c.created_at AT TIME ZONE 'Africa/Nairobi')::date)
            WHEN 7 THEN ((c.created_at AT TIME ZONE 'Africa/Nairobi')::date - 1)
        END
    ) = current_wednesday;

    -- Saturday contribution period currently displayed.
    SELECT COALESCE(SUM(c.amount), 0)::numeric
    INTO saturday_collected
    FROM public.contributions c
    WHERE (
        CASE EXTRACT(ISODOW FROM ((c.created_at AT TIME ZONE 'Africa/Nairobi')::date))::integer
            WHEN 1 THEN ((c.created_at AT TIME ZONE 'Africa/Nairobi')::date - 2)
            WHEN 2 THEN ((c.created_at AT TIME ZONE 'Africa/Nairobi')::date - 3)
            WHEN 3 THEN ((c.created_at AT TIME ZONE 'Africa/Nairobi')::date - 4)
            WHEN 4 THEN ((c.created_at AT TIME ZONE 'Africa/Nairobi')::date - 5)
            WHEN 5 THEN ((c.created_at AT TIME ZONE 'Africa/Nairobi')::date - 6)
            WHEN 6 THEN ((c.created_at AT TIME ZONE 'Africa/Nairobi')::date)
            WHEN 7 THEN ((c.created_at AT TIME ZONE 'Africa/Nairobi')::date - 1)
        END
    ) = current_saturday;

    RETURN jsonb_build_object(
        'group_goal', group_goal,
        'collected', collected,
        'remaining', GREATEST(group_goal - collected, 0),
        'percent', CASE
            WHEN group_goal > 0
            THEN LEAST(100, ROUND((collected / group_goal) * 100)::integer)
            ELSE 0
        END,
        'member_count', member_count,
        'average_goal', CASE
            WHEN member_count > 0
            THEN ROUND(group_goal / member_count)::numeric
            ELSE 0
        END,
        'wednesday_collected', wednesday_collected,
        'saturday_collected', saturday_collected,
        'calculated_at', now()
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_group_goal_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_group_goal_summary() TO authenticated;
