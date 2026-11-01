# RIHULA Group Goal Complete Fix

## What was fixed
- Member Dashboard no longer tries to read every member through the RLS-protected `members` table.
- Group Goal is calculated server-side by `get_group_goal_summary()`.
- Active members are counted correctly.
- A missing personal goal uses the standard KSh 5,000 goal.
- Personal-goal count and average goal are calculated correctly.
- Individual member goal/progress rows render instead of getting stuck on “Loading member goals...”.
- Group collected amount and current Wednesday/Saturday collection totals come from the same authoritative RPC.
- Only intended group information is returned; private member fields are not exposed.
- The Group Goal screen refreshes whenever it is opened.

## Required Supabase step
Run `RIHULA-GROUP-GOAL-RPC-FIX.sql` once in the Supabase SQL Editor. The frontend code is already wired to the function.
