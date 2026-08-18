/* RIHULA Finance Engine
   Single source of truth:
   Net Savings = Contributions - Withdrawals
*/
(function () {
  "use strict";

  const money = v => Number.isFinite(Number(v)) ? Number(v) : 0;
  const fmt = v => "KSh " + money(v).toLocaleString("en-KE", {maximumFractionDigits: 2});

  async function sumTable(table, phone) {
    let q = db.from(table).select("amount");
    if (phone !== undefined && phone !== null) q = q.eq("member_phone", String(phone));
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).reduce((s, r) => s + money(r.amount), 0);
  }

  async function netFor(phone) {
    const contributions = await sumTable("contributions", phone);
    const withdrawals = await sumTable("withdrawals", phone);
    return {
      contributions,
      withdrawals,
      net: Math.max(contributions - withdrawals, 0)
    };
  }

  async function groupNet() {
    const contributions = await sumTable("contributions");
    const withdrawals = await sumTable("withdrawals");
    return {
      contributions,
      withdrawals,
      net: Math.max(contributions - withdrawals, 0)
    };
  }

  window.rihulaFinance = { money, fmt, netFor, groupNet };

  // Member dashboard
  window.loadSavingsStats = async function (phone) {
    try {
      const result = await netFor(phone);
      const user = JSON.parse(localStorage.getItem("loggedUser") || "null") || {};
      const goal = Number(user.goal || 5000);
      const percent = goal > 0 ? Math.min(100, Math.round(result.net / goal * 100)) : 0;

      const savings = document.getElementById("mySavings");
      if (savings) savings.textContent = fmt(result.net);

      const goalAmount = document.getElementById("goalAmount");
      if (goalAmount) goalAmount.textContent = `${fmt(result.net)} / ${fmt(goal)}`;

      const progressText = document.getElementById("progressText");
      if (progressText) progressText.textContent = percent + "%";

      const fill = document.getElementById("progressFill");
      if (fill) fill.style.width = percent + "%";

      const group = await groupNet();
      const groupSavings = document.getElementById("groupSavings");
      if (groupSavings) groupSavings.textContent = fmt(group.net);
    } catch (e) {
      console.error("RIHULA finance: member savings failed", e);
    }
  };

  // Member's rank uses NET savings, not gross contributions.
  window.loadMyRank = async function () {
    const user = JSON.parse(localStorage.getItem("loggedUser") || "null");
    const el = document.getElementById("myRank");
    if (!user || !el) return;

    try {
      const { data: members, error } = await db.from("members").select("phone");
      if (error) throw error;

      const rankings = [];
      for (const member of members || []) {
        const result = await netFor(member.phone);
        rankings.push({ phone: String(member.phone), total: result.net });
      }

      rankings.sort((a, b) => b.total - a.total);
      const index = rankings.findIndex(x => x.phone === String(user.phone));
      el.textContent = index >= 0 ? "#" + (index + 1) : "Unranked";
    } catch (e) {
      console.error("RIHULA finance: member rank failed", e);
    }
  };

  // Group goal uses NET savings.
  window.loadGroupGoal = async function () {
    try {
      const { data: settings, error: settingsError } = await db
        .from("settings").select("group_goal").eq("id", 1).single();
      if (settingsError) throw settingsError;

      const goal = money(settings.group_goal);
      const group = await groupNet();
      const collected = group.net;
      const remaining = Math.max(goal - collected, 0);
      const percent = goal > 0 ? Math.round(collected / goal * 100) : 0;
      const width = Math.min(percent, 100);

      const values = {
        groupGoal: fmt(goal),
        groupCollected: fmt(collected),
        groupRemaining: fmt(remaining),
        groupPercent: percent + "% Complete",
        groupGoalAmount: fmt(goal),
        groupGoalCollected: fmt(collected),
        groupGoalRemaining: fmt(remaining),
        groupGoalPercent: percent + "%",
        groupGoalComplete: percent + "% Complete"
      };

      Object.keys(values).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = values[id];
      });

      ["groupProgress", "groupGoalProgress"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.width = width + "%";
      });
    } catch (e) {
      console.error("RIHULA finance: group goal failed", e);
    }
  };

  // Admin dashboard total savings uses NET savings.
  window.loadDashboardStats = async function () {
    try {
      const { count, error: countError } = await db
        .from("members").select("*", { count: "exact", head: true });
      if (!countError) {
        const el = document.getElementById("totalMembers");
        if (el) el.textContent = count || 0;
      }

      const { count: pending, error: pendingError } = await db
        .from("members").select("*", { count: "exact", head: true }).eq("status", "pending");
      if (!pendingError) {
        const el = document.getElementById("pendingMembers");
        if (el) el.textContent = pending || 0;
      }

      const group = await groupNet();
      const el = document.getElementById("totalSavings");
      if (el) el.textContent = fmt(group.net);
    } catch (e) {
      console.error("RIHULA finance: admin stats failed", e);
    }
  };

  window.loadGroupSavings = async function () {
    try {
      const group = await groupNet();
      ["adminGroupSavings", "totalSavings"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = fmt(group.net);
      });
    } catch (e) {
      console.error("RIHULA finance: group savings failed", e);
    }
  };

  // Admin/member leaderboard uses NET savings.
  window.loadLeaderboard = async function () {
    const container = document.getElementById("leaderboardContainer");
    if (!container) return;

    try {
      const { data: members, error } = await db.from("members").select("name, phone");
      if (error) throw error;

      const rankings = [];
      for (const member of members || []) {
        const result = await netFor(member.phone);
        rankings.push({ name: member.name || "Member", total: result.net });
      }
      rankings.sort((a, b) => b.total - a.total);

      container.innerHTML = rankings.length ? rankings.map((m, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "#" + (i + 1);
        return `<div class="leaderboard-card">
          <h3>${medal} ${escapeHtml(m.name)}</h3>
          <p>${fmt(m.total)}</p>
        </div>`;
      }).join("") : "<p>No members found.</p>";
    } catch (e) {
      console.error("RIHULA finance: leaderboard failed", e);
      container.innerHTML = "<p>Unable to load leaderboard.</p>";
    }
  };

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, c => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
    }[c]));
  }

  // Refresh all finance-related UI after a withdrawal/contribution.
  window.refreshRihulaFinance = async function () {
    const user = JSON.parse(localStorage.getItem("loggedUser") || "null");
    await Promise.allSettled([
      window.loadDashboardStats?.(),
      window.loadGroupSavings?.(),
      window.loadLeaderboard?.(),
      user ? window.loadSavingsStats?.(user.phone) : Promise.resolve(),
      user ? window.loadMyRank?.() : Promise.resolve(),
      window.loadGroupGoal?.()
    ]);
  };

  // Re-run after all existing legacy scripts have initialized.
  window.addEventListener("load", () => {
    setTimeout(() => window.refreshRihulaFinance(), 50);
  });
})();
