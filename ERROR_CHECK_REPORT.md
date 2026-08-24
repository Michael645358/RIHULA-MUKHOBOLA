# RIHULA Error Check & Fix Report — 24 August 2026

## Fixed
- Corrected Supabase RPC argument names in `finance.js`.
- Corrected Supabase RPC argument names in `member.js`.
- Corrected Supabase RPC argument names in `withdrawal-fix.js`.
- The affected database functions use `p_phone`; the frontend was incorrectly sending `p_member_phone`.
- This mismatch could cause member balance, rank, achievement, and withdrawal operations to fail with an RPC parameter error.

## Validation
- All JavaScript files pass `node --check`.
- All inline JavaScript blocks inside the HTML files pass syntax validation.
- Local HTML/CSS/JS references were checked; no missing local file references were found (telephone links were treated as external URI schemes).

## Important
The Supabase SQL/RLS setup still needs to be applied in the Supabase project if it has not already been run. Client-side code cannot create or modify database functions/RLS policies by itself.
