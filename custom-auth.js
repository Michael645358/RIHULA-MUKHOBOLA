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
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanName = String(name || "").trim();
    const cleanPhone = normalizeKenyanPhone(phone);
    const redirect =
    "https://michael645358.github.io/RIHULA-MUKHOBOLA/auth-callback.html";

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
    const { data, error } = await db.auth.signInWithPassword({ email: String(email).trim().toLowerCase(), password });
    if (error) throw error;
    const { data: member, error: memberError } = await db.from("members").select("*").eq("auth_id", data.user.id).single();
    if (memberError || !member) throw new Error("Your member profile could not be found.");
    if (member.is_member !== true) throw new Error("This account does not have member access.");
    saveSession(member); return member;
  }
  async function changeMemberPassword(_memberId, currentPassword, newPassword) {
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
