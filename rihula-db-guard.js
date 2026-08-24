/*
 * RIHULA database availability guard.
 * Prevents a wall of misleading "db is not defined" errors when the
 * Supabase SDK cannot be reached.
 */
(function () {
    "use strict";
    if (!window.RIHULA_SUPABASE_READY || !window.db) {
        console.error(
            "RIHULA database unavailable. Supabase could not be initialized."
        );
    }
})();
