RIHULA PASSWORD CHANGE FIX

Replace these three files:
- member.html
- member.js
- custom-auth.js

The password change now:
1. Checks the current password.
2. Gets a fresh Supabase Auth session.
3. Explicitly installs that session.
4. Verifies the same user is still authenticated.
5. Changes the password.

No database tables or SQL were changed.
