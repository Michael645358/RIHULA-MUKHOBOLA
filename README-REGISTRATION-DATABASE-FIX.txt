RIHULA REGISTRATION FIX

The screenshot error:
"Database error saving new user"

This is caused by the Supabase auth.users -> public.members database trigger failing.

1. Open Supabase Dashboard.
2. Open SQL Editor in the SAME project configured in supabase.js.
3. Run RIHULA-REGISTRATION-DATABASE-ERROR-FIX.sql.
4. Confirm the SQL completes successfully.
5. Retry registration with a new email.

The frontend now also shows a clearer message if the database trigger is still not installed.

Do not use the service_role key in frontend code.
