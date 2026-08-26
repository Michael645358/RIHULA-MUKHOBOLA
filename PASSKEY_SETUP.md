# RIHULA Passkey / Fingerprint Login

This build adds Supabase Auth Passkey login to the member login page. Passkeys use the phone's biometric prompt (fingerprint/Face Unlock) or the device PIN/passkey. RIHULA never receives the fingerprint itself.

## Required Supabase setup

1. Open Supabase Dashboard → Authentication → Passkeys.
2. Enable Passkey authentication.
3. Set the WebAuthn relying-party display name to `RIHULA Mukhobola Association`.
4. Set the RP ID to the hostname of the deployed RIHULA site (for example, `example.github.io`). Do not include `https://`, a path, or a trailing slash.
5. Set RP origins to the exact HTTPS origin of the deployed RIHULA site (for example, `https://example.github.io`).
6. Save the settings.

## Member flow

- Member first logs in with the existing email/password.
- RIHULA asks whether to enable a passkey on that device.
- The member approves using fingerprint, Face Unlock, device PIN, or another supported passkey method.
- Later, the member can tap **Login with Fingerprint / Passkey** without entering email/password.
- Each member can have their own passkey(s), including on multiple devices.
- Password login remains available as a recovery method.

## Important

Passkey authentication is currently experimental/beta in Supabase Auth and requires `@supabase/supabase-js` 2.105.0 or later. The login page in this build uses 2.105.0 and the Supabase client opts into passkeys.

Passkeys require a secure origin (HTTPS, or localhost for development). If the RP ID/origin is wrong, registration or login will fail without changing the existing password login.
