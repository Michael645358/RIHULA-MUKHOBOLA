# RIHULA repair report — 26 October 2026

## Changes applied to this ZIP
- Added `images/icon-192.png` and `images/icon-512.png` generated from the existing RIHULA logo.
- Updated `manifest.json` with an app id and valid icon entries.
- Reworked `sw.js` so a single unavailable cache resource cannot fail service-worker installation; bumped the cache version to invalidate the previous cache.
- Updated `custom-auth.js` to request only profile fields needed for member login and to avoid persisting password/security-answer/ID-number fields in `localStorage`.
- Updated `member.js` local storage writes to strip password, security answers, ID numbers, PINs and tokens from cached member data.
- Updated the legacy custom-auth SQL so new passwords and password changes use `pgcrypto` bcrypt hashes, and removed public execution permission from the legacy change-password RPC.
- Removed the old unused `script.js` helper’s direct plain-text password insert.

## Important limits / required follow-up
- This ZIP-only repair cannot verify or alter the live Supabase database, its actual RLS policies, existing stored passwords, deployed Edge Functions, OneSignal configuration, or APK build environment.
- Existing plain-text `members.password` values are not automatically cleared by this patch, because doing so without a planned account migration could lock members out. Require a password-reset/migration plan and remove legacy plaintext values safely.
- The `RIHULA-CUSTOM-MEMBER-AUTH.sql` file is a legacy compatibility script. Prefer Supabase Auth end-to-end; do not re-run old SQL on production without reviewing the live schema and backups.
- Confirm that the deployed Supabase `members` table permits the exact profile fields used by the login query, and verify RLS policies with separate member/admin test accounts.
- JavaScript syntax and archive integrity should be checked after packaging; live functional behavior still requires deployment tests.
