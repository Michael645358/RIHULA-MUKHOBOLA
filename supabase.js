const SUPABASE_URL = "https://ubyuscrigxgvchfofeyx.supabase.co";

const SUPABASE_KEY = "sb_publishable_IycRP3NNSBkcILuhOQ_46g_YpES9c7I";

window.db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);