/*
 * RIHULA Supabase client bootstrap
 * Fix: protects the app when the Supabase CDN is unavailable in a
 * local/mobile preview browser. A pinned fallback SDK is loaded before
 * createClient() is called.
 */
(function () {
    "use strict";

    if (!window.supabase || typeof window.supabase.createClient !== "function") {
        /*
         * The CDN <script> tag is normally loaded by the HTML pages.
         * If it failed, synchronously load a known-compatible fallback
         * while the document is still being parsed.
         */
        var fallbackUrl =
            "https://unpkg.com/@supabase/supabase-js@2.45.4/dist/umd/supabase.js";

        try {
            document.write(
                '<script src="' +
                fallbackUrl.replace(/"/g, "&quot;") +
                '"><\\/script>'
            );
        } catch (e) {
            console.error("RIHULA: Could not load the Supabase fallback SDK.", e);
        }
    }

    if (!window.supabase || typeof window.supabase.createClient !== "function") {
        console.error(
            "RIHULA: Supabase SDK is not available. " +
            "Check the internet connection/CDN access in the browser preview."
        );

        // Keep a predictable global so dependent files can report the real
        // problem instead of producing dozens of unrelated `db is not defined`
        // errors.
        window.db = null;
        window.supabaseClient = null;
        window.RIHULA_SUPABASE_READY = false;
        return;
    }

    const SUPABASE_URL =
        "https://qezbkcixzhdtntflljgy.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_lzTilJjSPerjRGlbuUpT-Q_WzonQy-d";

    const client = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        }
    );

    // Both names are retained because different RIHULA pages use them.
    window.db = client;
    window.supabaseClient = client;
    window.RIHULA_SUPABASE_READY = true;

    console.info("RIHULA: Supabase client initialized successfully.");

    // OneSignal
    window.OneSignalDeferred = window.OneSignalDeferred || [];

    /*
     * Do not let OneSignal initialization prevent the rest of RIHULA from
     * working in browsers/previews that do not support OneSignal.
     */
    if (window.OneSignalDeferred && typeof window.OneSignalDeferred.push === "function") {
        OneSignalDeferred.push(async function (OneSignal) {
            try {
                await OneSignal.init({
                    appId: "9785cd9a-e4e0-432b-b63c-8115c8a3b833",
                    notifyButton: {
                        enable: true
                    }
                });
            } catch (error) {
                console.warn("RIHULA: OneSignal unavailable in this browser.", error);
            }
        });
    }
})();
