const SUPABASE_URL =
    "https://qezbkcixzhdtntflljgy.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_lzTilJjSPerjRGlbuUpT-Q_WzonQy-d";

const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);

window.db = client;
window.supabaseClient = client;


// OneSignal
window.OneSignalDeferred = window.OneSignalDeferred || [];

OneSignalDeferred.push(async function (OneSignal) {
    await OneSignal.init({
        appId: "9785cd9a-e4e0-432b-b63c-8115c8a3b833",
        notifyButton: {
            enable: true
        }
    });
});