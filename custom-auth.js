/* RIHULA TEMPORARY CUSTOM MEMBER AUTH
 * Uses database RPCs instead of Supabase Auth.
 * This is a bridge while the project is later migrated back to Supabase Auth.
 */
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
    const session = {
      token: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()),
      member_id: member.id,
      created_at: new Date().toISOString()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem("loggedUser", JSON.stringify(member));
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("loggedUser");
  }

  function getSessionMember() {
    try {
      return JSON.parse(localStorage.getItem("loggedUser") || "null");
    } catch (_) {
      return null;
    }
  }

  async function registerMember({ name, phone, email, password }) {
    if (!window.db || typeof window.db.rpc !== "function") {
      throw new Error("Supabase is not initialized. Please refresh the page and try again.");
    }

    try {
      const { data, error } = await window.db.rpc("rihula_custom_register", {
        p_name: name,
        p_phone: normalizeKenyanPhone(phone),
        p_email: String(email || "").trim().toLowerCase(),
        p_password: password
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || "Registration failed.");
      return data;
    } catch (error) {
      const message = String(error?.message || error || "");
      if (message === "Failed to fetch" || /failed to fetch|networkerror|network request failed/i.test(message)) {
        throw new Error("Unable to reach the RIHULA server. Please check your internet connection, refresh the page, and try again.");
      }
      throw error;
    }
  }

  async function loginMember(loginId, password) {
    let identifier = String(loginId || "").trim();
    if (!identifier.includes("@")) identifier = normalizeKenyanPhone(identifier);
    else identifier = identifier.toLowerCase();

    const { data, error } = await db.rpc("rihula_custom_login", {
      p_login: identifier,
      p_password: password
    });
    if (error) throw error;
    if (!data?.success || !data?.member) throw new Error(data?.message || "Invalid email/phone or password.");
    saveSession(data.member);
    return data.member;
  }

  async function changeMemberPassword(memberId, currentPassword, newPassword) {
    const { data, error } = await db.rpc("rihula_custom_change_password", {
      p_member_id: memberId,
      p_current_password: currentPassword,
      p_new_password: newPassword
    });
    if (error) throw error;
    if (!data?.success) throw new Error(data?.message || "Could not change password.");
    return data;
  }

  window.RihulaCustomAuth = {
    normalizeKenyanPhone,
    registerMember,
    loginMember,
    changeMemberPassword,
    saveSession,
    clearSession,
    getSessionMember
  };
})();
