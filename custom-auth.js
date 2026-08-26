/* RIHULA Supabase Auth compatibility helpers */
(function () {
  "use strict";
  const SESSION_KEY = "rihulaMemberSession";
  function normalizeKenyanPhone(phone) {
    let value = String(phone || "").trim().replace(/[\s\-()]/g, "");
    if (value.startsWith("+254")) value = "0" + value.slice(4);
    else if (value.startsWith("254")) value = "0" + value.slice(3);
    return value;
  }
  function saveSession(member) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ member_id: member.id, auth_id: member.auth_id, created_at: new Date().toISOString() }));
    localStorage.setItem("loggedUser", JSON.stringify(member));
  }
  async function clearSession() {
    localStorage.removeItem(SESSION_KEY); localStorage.removeItem("loggedUser");
    try { await db.auth.signOut(); } catch (_) {}
  }
  function getSessionMember() { try { return JSON.parse(localStorage.getItem("loggedUser") || "null"); } catch (_) { return null; } }

  function passkeysSupported() {
    return !!(
      window.PublicKeyCredential &&
      navigator.credentials &&
      typeof navigator.credentials.get === "function" &&
      typeof navigator.credentials.create === "function"
    );
  }

  async function ensurePasskeyClient() {
    if (typeof window.waitForRihulaDb === "function") {
      try { await window.waitForRihulaDb(); } catch (_) {}
    }

    // A previously cached client may have been created without the
    // experimental passkey flag. Recreate it explicitly so old cached
    // RIHULA pages cannot disable passkeys.
    if (window.db?.auth?.registerPasskey && window.db?.auth?.signInWithPasskey) {
      return window.db;
    }

    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      throw new Error("RIHULA authentication library is unavailable. Please refresh the page.");
    }

    const url = "https://qezbkcixzhdtntflljgy.supabase.co";
    const key = "sb_publishable_lzTilJjSPerjRGlbuUpT-Q_WzonQy-d";

    try {
      const client = window.supabase.createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          experimental: { passkey: true }
        }
      });
      window.db = client;
      window.supabaseClient = client;
      window.RIHULA_SUPABASE_READY = true;
      return client;
    } catch (error) {
      console.error("RIHULA: passkey client initialization failed:", error);
      throw new Error("RIHULA could not enable fingerprint/passkey login. Please refresh and try again.");
    }
  }

  async function registerPasskey() {
    const client = await ensurePasskeyClient();
    if (!passkeysSupported()) {
      throw new Error("This phone or browser does not support fingerprint/passkey login.");
    }
    if (!client?.auth?.registerPasskey) {
      throw new Error("RIHULA passkey authentication is not available in this browser.");
    }
    const { data, error } = await client.auth.registerPasskey();
    if (error) throw error;
    return data;
  }

  async function loginWithPasskey() {
    const client = await ensurePasskeyClient();
    if (!passkeysSupported()) {
      throw new Error("This phone or browser does not support fingerprint/passkey login.");
    }
    if (!client?.auth?.signInWithPasskey) {
      throw new Error("RIHULA passkey authentication is not available in this browser.");
    }

    const { data, error } = await client.auth.signInWithPasskey();
    if (error) throw error;
    if (!data?.user?.id) throw new Error("Fingerprint login could not identify your account.");

    const { data: member, error: memberError } = await client
      .from("members")
      .select("*")
      .eq("auth_id", data.user.id)
      .single();

    if (memberError || !member) throw new Error("Your member profile could not be found.");
    if (member.is_member !== true) throw new Error("This account does not have member access.");

    saveSession(member);
    return member;
  }
  async function registerMember({name, phone, email, password}) {
    if (typeof window.waitForRihulaDb === "function") await window.waitForRihulaDb();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanName = String(name || "").trim();
    const cleanPhone = normalizeKenyanPhone(phone);
    // Use the current deployed site instead of a hard-coded GitHub account.
    const redirect = new URL("auth-callback.html", window.location.href).href;

    const { data, error } = await db.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        emailRedirectTo: redirect,
        data: { name: cleanName, phone: cleanPhone }
      }
    });

    if (error) throw error;
    if (!data || !data.user) throw new Error("The account could not be created.");

    return { success: true, user: data.user, session: data.session };
  }
  async function loginMember(email, password) {
    if (typeof window.waitForRihulaDb === "function") await window.waitForRihulaDb();
    const { data, error } = await db.auth.signInWithPassword({ email: String(email).trim().toLowerCase(), password });
    if (error) throw error;
    const { data: member, error: memberError } = await db.from("members").select("*").eq("auth_id", data.user.id).single();
    if (memberError || !member) throw new Error("Your member profile could not be found.");
    if (member.is_member !== true) throw new Error("This account does not have member access.");
    saveSession(member); return member;
  }
  async function changeMemberPassword(_memberId, currentPassword, newPassword) {
    if (typeof window.waitForRihulaDb === "function") await window.waitForRihulaDb();
    if (String(newPassword || "").length < 8) {
      throw new Error("New password must contain at least 8 characters.");
    }

    const { data: authData, error: authError } = await db.auth.getUser();
    if (authError || !authData?.user?.email) {
      throw new Error("Your secure login session has expired. Please log in again.");
    }

    const { error: verifyError } = await db.auth.signInWithPassword({
      email: authData.user.email,
      password: String(currentPassword || "")
    });
    if (verifyError) throw new Error("Current password is incorrect.");

    const { error } = await db.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return { success: true };
  }
  window.RihulaCustomAuth = { normalizeKenyanPhone, registerMember, loginMember, loginWithPasskey, registerPasskey, passkeysSupported, changeMemberPassword, saveSession, clearSession, getSessionMember };
})();
