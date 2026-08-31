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
  async function loginMember(loginValue, password) {
    if (typeof window.waitForRihulaDb === "function") await window.waitForRihulaDb();

    const rawLogin = String(loginValue || "").trim();
    if (!rawLogin || !password) throw new Error("Enter your phone number and password.");

    // RIHULA members log in with their registered phone number.
    // Supabase Auth still uses the member's verified email internally, so
    // the secure RPC maps phone -> Auth email without exposing the members table.
    let authEmail = rawLogin.toLowerCase();
    const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawLogin);

    if (!looksLikeEmail) {
      const cleanPhone = normalizeKenyanPhone(rawLogin);
      if (!/^(?:07|01)\d{8}$/.test(cleanPhone)) {
        throw new Error("Enter a valid Kenyan phone number, e.g. 0712345678 or 0112345678.");
      }

      const { data: lookup, error: lookupError } = await db.rpc(
        "rihula_get_auth_email_by_phone",
        { p_phone: cleanPhone }
      );

      if (lookupError) {
        console.error("PHONE LOGIN LOOKUP ERROR:", lookupError);
        throw new Error("Phone login is not configured yet. Please run the RIHULA phone-login SQL in Supabase.");
      }

      authEmail = String(lookup || "").trim().toLowerCase();
      if (!authEmail) throw new Error("No registered member was found with that phone number.");
    }

    const { data, error } = await db.auth.signInWithPassword({
      email: authEmail,
      password: String(password)
    });
    if (error) throw error;
    if (!data?.user) throw new Error("Login could not be completed.");

    const { data: member, error: memberError } = await db
      .from("members")
      .select("*")
      .eq("auth_id", data.user.id)
      .single();

    if (memberError || !member) throw new Error("Your member profile could not be found.");
    if (member.is_member !== true) throw new Error("This account does not have member access.");

    saveSession(member);
    return member;
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
  window.RihulaCustomAuth = { normalizeKenyanPhone, registerMember, loginMember, changeMemberPassword, saveSession, clearSession, getSessionMember };
})();
