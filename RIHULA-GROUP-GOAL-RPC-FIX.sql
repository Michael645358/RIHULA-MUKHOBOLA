-- RIHULA GROUP GOAL — SECURE SERVER-SIDE CALCULATION
-- Run this entire script in Supabase SQL Editor.
--
-- Why this is required:
-- The members table is protected by RLS. Normal members can read their own
-- member row, but not everybody else's row. The browser therefore cannot
-- safely calculate the association-wide goal by doing members.select('*').
-- This RPC calculates the group result server-side and returns only the
-- information intended for the Member Dashboard.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_group_goal_summary()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
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

    -- Collection periods are Wednesday and Saturday in Kenya.
    current_wednesday := kenya_today - ((EXTRACT(ISODOW FROM kenya_today)::integer - 3 + 7) % 7);
    current_saturday := kenya_today - ((EXTRACT(ISODOW FROM kenya_today)::integer - 6 + 7) % 7);

    /*
     * Build the member list once. A missing/invalid personal goal uses the
     * existing RIHULA standard of KSh 5,000.
     *
     * We deliberately expose name + goal + collected amount only. Phone,
     * email, auth_id and other private member fields are not returned.
     */
    WITH active_members AS (
        SELECT
            m.id,
            COALESCE(NULLIF(trim(m.name), ''), 'Member')::text AS name,
            CASE
                WHEN m.goal IS NOT NULL AND m.goal > 0 THEN m.goal::numeric
                ELSE 5000::numeric
            END AS effective_goal,
            (m.goal IS NOT NULL AND m.goal > 0) AS has_personal_goal,
            regexp_replace(COALESCE(m.phone::text, ''), '[^0-9]', '', 'g') AS normalized_phone
        FROM public.members m
        WHERE COALESCE(m.is_member, true) = true
          AND lower(COALESCE(m.status, 'approved')) NOT IN
              ('blocked', 'suspended', 'inactive', 'rejected', 'pending')
    ),
    member_finance AS (
        SELECT
            am.id,
            am.name,
            am.effective_goal,
            am.has_personal_goal,
            COALESCE((
                SELECT SUM(c.amount)
                FROM public.contributions c
                WHERE regexp_replace(COALESCE(c.member_phone::text, ''), '[^0-9]', '', 'g') = am.normalized_phone
            ), 0)::numeric AS member_collected
        FROM active_members am
    )
    SELECT
        COUNT(*)::integer,
        COUNT(*) FILTER (WHERE has_personal_goal)::integer,
        COALESCE(SUM(effective_goal), 0)::numeric,
        COALESCE(SUM(member_collected), 0)::numeric,
        COALESCE(jsonb_agg(
            jsonb_build_object(
                'name', name,
                'goal', effective_goal,
                'collected', member_collected,
                'percent', CASE
                    WHEN effective_goal > 0 THEN LEAST(100, ROUND((member_collected / effective_goal) * 100)::integer)
                    ELSE 0
                END,
                'defaulted', NOT has_personal_goal
            ) ORDER BY lower(name)
        ), '[]'::jsonb)
    INTO member_count, personal_goals_set, group_goal, collected, result
    FROM member_finance;

    -- Contribution totals for the currently displayed Wednesday/Saturday periods.
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
        'percent', CASE WHEN group_goal > 0 THEN ROUND((collected / group_goal) * 100)::integer ELSE 0 END,
        'member_count', member_count,
        'personal_goals_set', personal_goals_set,
        'average_goal', CASE WHEN member_count > 0 THEN ROUND(group_goal / member_count)::numeric ELSE 0 END,
        'members', COALESCE(result, '[]'::jsonb),
        'wednesday_collected', wednesday_collected,
        'saturday_collected', saturday_collected,
        'calculated_at', now()
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_group_goal_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_group_goal_summary() TO authenticated;

COMMIT;
