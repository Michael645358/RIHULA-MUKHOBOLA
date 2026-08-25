/*
 * RIHULA Supabase Database Guard
 *
 * Waits for Supabase instead of reporting a false error.
 */

(function () {

    "use strict";


    function databaseIsReady() {

        return (
            window.db &&
            window.RIHULA_SUPABASE_READY === true
        );

    }


    /*
     * If already ready, do nothing.
     */
    if (databaseIsReady()) {

        console.info(
            "RIHULA: Database ready."
        );

        return;
    }


    /*
     * Supabase may still be loading.
     */
    let attempts = 0;

    const maxAttempts = 20;


    const timer = setInterval(function () {

        attempts++;


        /*
         * Supabase is now ready.
         */
        if (databaseIsReady()) {

            clearInterval(timer);

            console.info(
                "RIHULA: Database ready."
            );

            return;
        }


        /*
         * Do NOT show a red console.error.
         *
         * The first few attempts are normal because
         * the Supabase CDN can take time to load.
         */
        if (attempts >= maxAttempts) {

            clearInterval(timer);

            console.warn(
                "RIHULA: Supabase did not become ready."
            );

        }

    }, 500);

})();