async function loadMemberData() {

    const { data: authData, error: authError } = await db.auth.getUser();
    if (authError || !authData || !authData.user) {
        localStorage.removeItem("loggedUser");
        window.location.replace("login.html");
        return;
    }

    let user = null;
    const { data, error } = await db
        .from("members")
        .select("*")
        .eq("auth_id", authData.user.id)
        .single();

    if (error || !data || data.is_member !== true) {
        localStorage.removeItem("loggedUser");
        await db.auth.signOut();
        window.location.replace("login.html");
        return;
    }

    if (!error && data) {

        user = data;

        localStorage.setItem(
            "loggedUser",
            JSON.stringify(user)
        );
        updateOnlineStatus(true);
    }

    const hour = new Date().getHours();

let greeting = "";

if (hour >= 5 && hour < 12) {
    greeting = "🌅 Good Morning";
} else if (hour >= 12 && hour < 17) {
    greeting = "☀️ Good Afternoon";
} else if (hour >= 17 && hour < 21) {
    greeting = "🌇 Good Evening";
} else {
    greeting = "🌙 Good Night";
}

const firstName = user.name.split(" ")[0];

document.getElementById("welcomeName").innerHTML = `
<div style="line-height:1.4;">
    <div style="font-size:30px;font-weight:bold;">
        ${greeting}, ${firstName} 👋
    </div>
    <div style="font-size:16px;opacity:0.9;">
        Welcome back!
    </div>
</div>
`;
    const images =
        document.querySelectorAll("#profileImage");

    images.forEach(img => {
        if (user.photo_url) {
            img.src = user.photo_url;
        }
    });

    if (
        document.getElementById("profileScreenImage") &&
        user.photo_url
    ) {
        document.getElementById("profileScreenImage").src =
            user.photo_url;
    }

    await loadContributionHistory(user.phone);
    await loadAnnouncements();
    await loadNotifications();
    await loadSavingsStats(user.phone);
    await loadCollectionPeriods();
    if (typeof window.loadMyRank === "function") await window.loadMyRank();
   await loadGroupGoal(); 
   await loadContributionDayTotals();
}

async function logout() {

    const user =
        JSON.parse(localStorage.getItem("loggedUser"));

    if (user) {

        const { error } = await db
            .from("members")
            .update({
                online: false,
                last_seen: new Date().toISOString()
            })
            .eq("phone", user.phone);

        if (error) {
            showPopup(error.message);
            return;
        }
    }

    try { await db.auth.signOut(); } catch (e) { console.warn("Supabase sign-out failed", e); }
    localStorage.removeItem("loggedUser");
    localStorage.removeItem("rihulaMemberSession");
    window.location.replace("login.html");
}

loadMemberData();
updateUnreadCount();
updateOnlineStatus(true);
if (typeof window.loadMyRank === "function") window.loadMyRank();
showDashboard();
updateLastSeen();
loadOnlineMembers();

// Keep the personal savings card current after an admin records a contribution
// or withdrawal while the member remains on the dashboard.
setInterval(() => {
    const currentUser = JSON.parse(localStorage.getItem("loggedUser") || "null");
    if (currentUser && currentUser.phone) {
        loadSavingsStats(currentUser.phone);
    }
}, 15000);

window.addEventListener("pageshow", () => {
    const currentUser = JSON.parse(localStorage.getItem("loggedUser") || "null");
    if (currentUser && currentUser.phone) {
        loadSavingsStats(currentUser.phone);
    }
});

window.addEventListener("focus", () => {
    const currentUser = JSON.parse(localStorage.getItem("loggedUser") || "null");
    if (currentUser && currentUser.phone) {
        loadSavingsStats(currentUser.phone);
    }
});

setInterval(() => {
    updateLastSeen();
    loadOnlineMembers();
}, 30000); // Refresh every 30 seconds
function showHistory() {

    document.getElementById("dashboardScreen")
        .style.display = "none";

    document.getElementById("historyScreen")
        .style.display = "block";

        document.getElementById("chatScreen")
    .style.display = "none";
}


async function showProfile() {

    let user =
    JSON.parse(localStorage.getItem("loggedUser"));

const { data } = await db
    .from("members")
    .select("*")
    .eq("phone", user.phone)
    .single();

if (data) {
    user = data;

    localStorage.setItem(
        "loggedUser",
        JSON.stringify(user)
    );
}

    document.getElementById("dashboardScreen")
        .style.display = "none";

    document.getElementById("profileScreen")
        .style.display = "block";

        document.getElementById("chatScreen")
    .style.display = "none";

    document.getElementById("passwordnName")
    .innerText = user.name;

    document.getElementById("profileScreenPhone")
        .innerText = user.phone;

    if (user.online) {

    document.getElementById("profileScreenStatus")
    .innerText = "🟢 Online";

} else if (user.last_seen) {

    const lastSeen = new Date(user.last_seen);
    const now = new Date();

    const diffMinutes =
        Math.floor((now - lastSeen) / 60000);

    if (diffMinutes < 1) {

        document.getElementById("profileScreenStatus")
        .innerText = "⏰ Last seen just now";

    } else if (diffMinutes < 60) {

        document.getElementById("profileScreenStatus")
        .innerText =
        `⏰ Last seen ${diffMinutes} min ago`;

    } else if (diffMinutes < 1440) {

        document.getElementById("profileScreenStatus")
        .innerText =
        `⏰ Last seen ${Math.floor(diffMinutes / 60)} hr ago`;

    } else {

        document.getElementById("profileScreenStatus")
        .innerText =
        `⏰ Last seen ${Math.floor(diffMinutes / 1440)} day(s) ago`;
    }

} else {

    document.getElementById("profileScreenStatus")
    .innerText = "⚫ Offline";

}


    if (user.photo_url) {
        document.getElementById("profileScreenImage")
            .src = user.photo_url;
    }
    document.getElementById("goalInput").value =
    user.goal || 5000;
}
function showLeaders() {

    document.getElementById("dashboardScreen")
        .style.display = "none";

    document.getElementById("historyScreen")
        .style.display = "none";

    document.getElementById("profileScreen")
        .style.display = "none";

    document.getElementById("leadersScreen")
        .style.display = "block";

        document.getElementById("chatScreen")
    .style.display = "none";
}
function showGroupMembers() {

    document.getElementById("dashboardScreen").style.display = "none";
    document.getElementById("historyScreen").style.display = "none";
    document.getElementById("profileScreen").style.display = "none";
    document.getElementById("leadersScreen").style.display = "none";
    document.getElementById("contributeScreen").style.display = "none";
    document.getElementById("chatScreen").style.display = "none";
    document.getElementById("announcementsScreen").style.display = "none";
    document.getElementById("aiScreen").style.display = "none";

    document.getElementById("groupMembersScreen").style.display = "block";
    
    loadGroupMembers();
}
async function loadGroupMembers() {

    const { data, error } = await db
        .from("members")
        .select("name, phone, photo_url, online, role")
data.sort((a, b) => {

    const leaderOrder = {
        "Chairperson": 1,
        "Secretary": 2,
        "Treasurer": 3
    };

    const aOrder = leaderOrder[a.role] || 99;
    const bOrder = leaderOrder[b.role] || 99;

    if (aOrder !== bOrder) {
        return aOrder - bOrder;
    }

    return a.name.localeCompare(b.name);

});
    const container = document.getElementById("membersContainer");

    if (error) {
    console.log(error);
    container.innerHTML = `<p>${error.message}</p>`;
    return;
}

    if (!data || data.length === 0) {
        container.innerHTML = "<p>No members found.</p>";
        return;
    }

    container.innerHTML = "";

    data.forEach(member => {

        container.innerHTML += `
            <div class="card">
                <img src="${member.photo_url || 'images/logo.jpg'}"
                     class="leader-photo">

                <h3>${member.name}</h3>
                
                <p class="member-position">
${member.role || "👤 Member"}
</p>

<p>
    ${member.online ? "🟢 Online" : "⚫ Offline"}
</p>

<div class="leader-buttons">

    <a href="tel:${member.phone}" class="leader-btn">
    📞 Call
</a>

<a href="https://wa.me/254${member.phone.toString().replace(/^0/, "")}" class="leader-btn">
    💬 WhatsApp
</a>
    
    

</div>
        `;
    });
}
async function loadGroupGoal() {

    try {

        // Get group goal from settings
        const { data: settings, error: settingsError } = await db
            .from("settings")
            .select("group_goal")
            .eq("id", 1)
            .single();

        if (settingsError) {
            console.error("Group goal error:", settingsError);
            return;
        }

        const goal = Number(settings.group_goal || 0);

        // Get all contributions
        const { data: contributions, error: contributionError } =
            await db
                .from("contributions")
                .select("amount");

        if (contributionError) {
            console.error(
                "Contribution error:",
                contributionError
            );
            return;
        }

        // Calculate total collected
        let collected = 0;

        (contributions || []).forEach(item => {
            collected += Number(item.amount || 0);
        });

        // Calculate remaining
        const remaining = Math.max(goal - collected, 0);

        // Calculate percentage
        let percent = 0;

        if (goal > 0) {
            percent = Math.round(
                (collected / goal) * 100
            );
        }

        // Don't allow progress to visually exceed 100%
        const progressPercent = Math.min(percent, 100);

        // =========================
        // DASHBOARD GROUP GOAL
        // =========================

        const groupGoal =
            document.getElementById("groupGoal");

        if (groupGoal) {
            groupGoal.innerText =
                "KSh " + goal.toLocaleString();
        }

        const groupCollected =
            document.getElementById("groupCollected");

        if (groupCollected) {
            groupCollected.innerText =
                "KSh " + collected.toLocaleString();
        }

        const groupRemaining =
            document.getElementById("groupRemaining");

        if (groupRemaining) {
            groupRemaining.innerText =
                "KSh " + remaining.toLocaleString();
        }

        const groupPercent =
            document.getElementById("groupPercent");

        if (groupPercent) {
            groupPercent.innerText =
                percent + "% Complete";
        }

        const groupProgress =
            document.getElementById("groupProgress");

        if (groupProgress) {
            groupProgress.style.width =
                progressPercent + "%";
        }


        // =========================
        // GROUP GOAL SCREEN
        // =========================

        const goalAmount =
            document.getElementById("groupGoalAmount");

        if (goalAmount) {
            goalAmount.innerText =
                "KSh " + goal.toLocaleString();
        }

        const goalCollected =
            document.getElementById("groupGoalCollected");

        if (goalCollected) {
            goalCollected.innerText =
                "KSh " + collected.toLocaleString();
        }

        const goalRemaining =
            document.getElementById("groupGoalRemaining");

        if (goalRemaining) {
            goalRemaining.innerText =
                "KSh " + remaining.toLocaleString();
        }

        const goalPercent =
            document.getElementById("groupGoalPercent");

        if (goalPercent) {
            goalPercent.innerText =
                percent + "%";
        }

        const goalProgress =
            document.getElementById("groupGoalProgress");

        if (goalProgress) {
            goalProgress.style.width =
                progressPercent + "%";
        }

        const goalComplete =
            document.getElementById("groupGoalComplete");

        if (goalComplete) {
            goalComplete.innerText =
                percent + "% Complete";
        }

    } catch (error) {

        console.error(
            "Group Goal Error:",
            error
        );

    }
}
function showContribute() {

    document.getElementById("dashboardScreen")
        .style.display = "none";

    document.getElementById("historyScreen")
        .style.display = "none";

    document.getElementById("profileScreen")
        .style.display = "none";

    document.getElementById("leadersScreen")
        .style.display = "none";

    document.getElementById("contributeScreen")
        .style.display = "block";

        document.getElementById("chatScreen")
    .style.display = "none";
}

function showGroupGoal() {

    document.getElementById("dashboardScreen").style.display = "none";
    document.getElementById("historyScreen").style.display = "none";
    document.getElementById("announcementsScreen").style.display = "none";
    document.getElementById("profileScreen").style.display = "none";
    document.getElementById("leadersScreen").style.display = "none";
    document.getElementById("contributeScreen").style.display = "none";
    document.getElementById("chatScreen").style.display = "none";
    document.getElementById("aiScreen").style.display = "none";
    document.getElementById("groupMembersScreen").style.display = "none";

    document.getElementById("groupGoalScreen").style.display = "block";
}

async function loadContributionHistory(phone) {

    try {

        // Get contributions
        const { data: contributions, error: contributionError } =
            await db
                .from("contributions")
                .select("amount, created_at")
                .eq("member_phone", String(phone));


        if (contributionError) {
            console.error(
                "Contribution history error:",
                contributionError
            );
            return;
        }


        // Get withdrawals
        const { data: withdrawals, error: withdrawalError } =
            await db
                .from("withdrawals")
                .select("amount, reason, created_at")
                .eq("member_phone", String(phone));


        if (withdrawalError) {
            console.error(
                "Withdrawal history error:",
                withdrawalError
            );
            return;
        }


        const history = [];


        // Add contributions
        (contributions || []).forEach(item => {

            history.push({
                type: "contribution",
                amount: Number(item.amount || 0),
                reason: "Contribution",
                created_at: item.created_at
            });

        });


        // Add withdrawals
        (withdrawals || []).forEach(item => {

            history.push({
                type: "withdrawal",
                amount: Number(item.amount || 0),
                reason: item.reason || "Savings withdrawal",
                created_at: item.created_at
            });

        });


        // Newest first
        history.sort(
            (a, b) =>
                new Date(b.created_at) -
                new Date(a.created_at)
        );


        const container =
            document.getElementById(
                "historyOnlyContainer"
            );


        if (!container) return;


        if (history.length === 0) {

            container.innerHTML =
                "<p>No savings activity yet.</p>";

            return;
        }


        container.innerHTML = "";


        history.forEach(item => {

            const date =
                item.created_at
                    ? new Date(
                        item.created_at
                    ).toLocaleDateString()
                    : "";


            if (item.type === "withdrawal") {

                container.innerHTML += `

                    <div class="card">

                        <h3 style="color:#c0392b;">
                            💸 -KSh ${item.amount.toLocaleString()}
                        </h3>

                        <p>
                            ${item.reason}
                        </p>

                        <small>
                            ${date}
                        </small>

                    </div>

                `;

            } else {

                container.innerHTML += `

                    <div class="card">

                        <h3 style="color:#087f4f;">
                            💰 +KSh ${item.amount.toLocaleString()}
                        </h3>

                        <p>
                            Contribution
                        </p>

                        <small>
                            ${date}
                        </small>

                    </div>

                `;

            }

        });


    } catch (error) {

        console.error(
            "Savings history error:",
            error
        );

    }
}
async function loadSavingsStats(phone) {

    try {
        const requestedPhone = String(phone || "").trim();

        if (!requestedPhone) return;

        let contributions = 0;
        let withdrawals = 0;
        let usedRpc = false;

        // Primary source: secure member finance function.
        const { data, error } = await db.rpc(
            "get_member_finance",
            { p_phone: requestedPhone }
        );

        if (!error) {
            const row = Array.isArray(data) ? (data[0] || {}) : (data || {});
            contributions = Number(row.contributions || 0);
            withdrawals = Number(row.withdrawals || 0);
            usedRpc = true;
        } else {
            console.warn("get_member_finance failed; using personal row fallback:", error.message);

            // Fallback for projects where the RPC has not yet been deployed.
            const [cResult, wResult] = await Promise.all([
                db.from("contributions")
                    .select("member_phone, amount")
                    .eq("member_phone", requestedPhone),
                db.from("withdrawals")
                    .select("member_phone, amount")
                    .eq("member_phone", requestedPhone)
            ]);

            if (cResult.error) throw cResult.error;
            if (wResult.error) throw wResult.error;

            contributions = (cResult.data || []).reduce(
                (sum, row) => sum + Number(row.amount || 0),
                0
            );

            withdrawals = (wResult.data || []).reduce(
                (sum, row) => sum + Number(row.amount || 0),
                0
            );
        }

        const currentSavings = Math.max(
            contributions - withdrawals,
            0
        );

        const mySavings = document.getElementById("mySavings");

        if (mySavings) {
            mySavings.textContent =
                "KSh " + currentSavings.toLocaleString("en-KE");
        }

        const user =
            JSON.parse(localStorage.getItem("loggedUser") || "{}");

        const goal = Number(user.goal || 5000);

        const percent = goal > 0
            ? Math.min(
                100,
                Math.round((currentSavings / goal) * 100)
            )
            : 0;

        const goalAmount = document.getElementById("goalAmount");
        if (goalAmount) {
            goalAmount.textContent =
                "KSh " + currentSavings.toLocaleString("en-KE") +
                " / KSh " + goal.toLocaleString("en-KE");
        }

        const progressText = document.getElementById("progressText");
        if (progressText) {
            progressText.textContent = percent + "%";
        }

        const progressFill = document.getElementById("progressFill");
        if (progressFill) {
            progressFill.style.width = percent + "%";
        }

        console.log("RIHULA PERSONAL SAVINGS", {
            phone: requestedPhone,
            contributions,
            withdrawals,
            savings: currentSavings,
            source: usedRpc ? "get_member_finance" : "fallback"
        });

    } catch (error) {
        console.error("Personal savings update error:", error);
        // Keep the last valid value on screen instead of replacing it with 0.
    }
}

function toggleSinglePassword(inputId, button) {

    const input =
        document.getElementById(inputId);

    if (!input) return;

    if (input.type === "password") {

        input.type = "text";

        button.innerText = "🙈";

    } else {

        input.type = "password";

        button.innerText = "👁";

    }
}
async function loadCollectionPeriods() {
    try {
        const user = JSON.parse(
            localStorage.getItem("loggedUser") || "null"
        );

        const todayEl =
            document.getElementById("memberCollectedToday");

        const weekEl =
            document.getElementById("memberCollectedWeek");

        const monthEl =
            document.getElementById("memberCollectedMonth");

        // This card is PERSONAL only.
        // Never use group totals here.
        if (!user || !user.phone) {
            if (todayEl) todayEl.textContent = "KSh 0";
            if (weekEl) weekEl.textContent = "KSh 0";
            if (monthEl) monthEl.textContent = "KSh 0";
            return;
        }

        const normalizePhone = phone => {
            let p = String(phone || "").replace(/\D/g, "");

            if (p.startsWith("254")) {
                p = "0" + p.substring(3);
            }

            return p;
        };

        const myPhone = normalizePhone(user.phone);

        // Load contribution rows and keep ONLY this member's rows.
        const { data, error } = await db
            .from("contributions")
            .select("member_phone, amount, created_at");

        if (error) {
            console.error(
                "Personal contribution periods error:",
                error
            );

            if (todayEl) todayEl.textContent = "KSh 0";
            if (weekEl) weekEl.textContent = "KSh 0";
            if (monthEl) monthEl.textContent = "KSh 0";
            return;
        }

        const mine = (data || []).filter(row =>
            normalizePhone(row.member_phone) === myPhone
        );

        const now = new Date();

        const startOfDay = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

        const startOfWeek = new Date(startOfDay);
        const daysFromMonday =
            (startOfDay.getDay() + 6) % 7;

        startOfWeek.setDate(
            startOfWeek.getDate() - daysFromMonday
        );

        const startOfMonth = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );

        let today = 0;
        let week = 0;
        let month = 0;

        mine.forEach(row => {
            const date = new Date(row.created_at);
            const amount = Number(row.amount || 0);

            if (Number.isNaN(date.getTime())) return;

            if (date >= startOfDay) today += amount;
            if (date >= startOfWeek) week += amount;
            if (date >= startOfMonth) month += amount;
        });

        const format = value =>
            "KSh " + Number(value || 0).toLocaleString("en-KE");

        if (todayEl) todayEl.textContent = format(today);
        if (weekEl) weekEl.textContent = format(week);
        if (monthEl) monthEl.textContent = format(month);

        console.log("RIHULA PERSONAL CONTRIBUTIONS", {
            memberPhone: user.phone,
            today,
            week,
            month,
            records: mine.length
        });

    } catch (error) {
        console.error(
            "Personal contribution periods failed:",
            error
        );
    }
}

async function changePassword() {
    const user = JSON.parse(localStorage.getItem("loggedUser") || "null");
    const currentPassword = document.getElementById("currentPassword").value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    if (!user || !user.id) {
        showPopup("Your login session has expired. Please log in again.", "error");
        return;
    }
    if (!currentPassword || !newPassword || !confirmPassword) {
        showPopup("Please fill all fields.");
        return;
    }
    if (newPassword !== confirmPassword) {
        showPopup("New passwords do not match.");
        return;
    }
    if (newPassword.length < 8) {
        showPopup("Password must be at least 8 characters long.");
        return;
    }

    try {
        await RihulaCustomAuth.changeMemberPassword(user.id, currentPassword, newPassword);
        document.getElementById("currentPassword").value = "";
        document.getElementById("newPassword").value = "";
        document.getElementById("confirmPassword").value = "";
        showPopup("Password changed successfully.");
    } catch (error) {
        console.error("CHANGE PASSWORD ERROR:", error);
        showPopup(error.message || "Could not change password.", "error");
    }
}
function togglePasswordVisibility() {

    const fields = [
        "currentPassword",
        "newPassword",
        "confirmPassword"
    ];

    fields.forEach(id => {

        const input = document.getElementById(id);

        input.type =
            input.type === "password"
            ? "text"
            : "password";

    });

}
async function loadAnnouncements() {

    const { data, error } = await db
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) return;

    const container =
document.getElementById("announcementsOnlyContainer");

    if (!container) return;

    container.innerHTML = "";

    if (!data || data.length === 0) {
        container.innerHTML = "<p>No announcements available.</p>";
        return;
    }

    data.forEach(item => {

        container.innerHTML += `
        <div class="card">
            <h3>${item.title}</h3>
            <p>${item.message}</p>
        </div>
        `;
    });

    const latest = data[0];
    const featuredTitle = document.getElementById("dashboardAnnouncementTitle");
    const featuredMessage = document.getElementById("dashboardAnnouncementMessage");

    if (latest) {
        if (featuredTitle) featuredTitle.innerText = latest.title || "Latest announcement";
        if (featuredMessage) featuredMessage.innerText = latest.message || "Check the announcements section for more information.";
    }
}
async function uploadProfilePhoto() {

    const user =
        JSON.parse(localStorage.getItem("loggedUser"));

    const input =
        document.getElementById("photoUpload");

    const button =
        document.getElementById("uploadPhotoButton");


    if (
        !user ||
        !input ||
        !input.files ||
        !input.files[0]
    ) {
        showPopup(
            "Please choose a photo first.",
            "warning"
        );
        return;
    }


    const file = input.files[0];


    // =========================
    // CHECK FILE TYPE
    // =========================

    if (!file.type.startsWith("image/")) {

        showPopup(
            "Please select an image.",
            "warning"
        );

        input.value = "";
        return;
    }


    // =========================
    // CHECK FILE SIZE
    // Maximum 5MB
    // =========================

    if (file.size > 5 * 1024 * 1024) {

        showPopup(
            "Photo must be less than 5MB.",
            "warning"
        );

        input.value = "";
        return;
    }


    if (button) {

        button.disabled = true;

        button.innerText =
            "⏳ Uploading...";
    }


    try {

        // =========================
        // GET CUSTOM MEMBER SESSION
        // =========================

        const authUser = JSON.parse(localStorage.getItem("loggedUser") || "null");

        if (!authUser || !authUser.id) {
            showPopup(
                "Your login session has expired. Please log in again.",
                "error"
            );
            return;
        }


        // =========================
        // FILE EXTENSION
        // =========================

        const extension =
            file.name
                .split(".")
                .pop()
                .toLowerCase();


        // =========================
        // UNIQUE FILE NAME
        // =========================

        const fileName =
            `members/${authUser.id}/${Date.now()}.${extension}`;


        console.log(
            "Uploading profile photo:",
            fileName
        );


        // =========================
        // UPLOAD
        // =========================

        const {
            error: uploadError
        } = await db.storage
            .from("profile-pictures")
            .upload(
                fileName,
                file,
                {
                    cacheControl: "3600",
                    upsert: false
                }
            );


        if (uploadError) {

            console.error(
                "PROFILE PHOTO UPLOAD ERROR:",
                uploadError
            );

            const storageMessage =
                uploadError?.message ||
                uploadError?.error_description ||
                uploadError?.details ||
                "Unknown Storage error";

            console.error(
                "PROFILE PHOTO STORAGE DETAILS:",
                storageMessage
            );

            showPopup(
                "Photo upload failed. Please check Supabase Storage setup.",
                "error"
            );

            return;
        }


        // =========================
        // GET PUBLIC URL
        // =========================

        const {
            data: publicData
        } = db.storage
            .from("profile-pictures")
            .getPublicUrl(fileName);


        const photoUrl =
            publicData?.publicUrl;


        if (!photoUrl) {

            showPopup(
                "Photo uploaded but URL could not be created.",
                "error"
            );

            return;
        }


        // =========================
        // SAVE URL TO MEMBER
        // =========================

        const {
            error: updateError
        } = await db
            .from("members")
            .update({
                photo_url: photoUrl
            })
            .eq(
                "id",
                authUser.id
            );


        if (updateError) {

            console.error(
                "PROFILE DATABASE ERROR:",
                updateError
            );

            showPopup(
                "Photo uploaded, but could not save it to your profile.",
                "error"
            );

            return;
        }


        // =========================
        // UPDATE LOCAL USER
        // =========================

        user.photo_url = photoUrl;

        localStorage.setItem(
            "loggedUser",
            JSON.stringify(user)
        );


        // =========================
        // UPDATE PROFILE IMAGE
        // =========================

        const profileImage =
            document.getElementById(
                "profileImage"
            );

        const profileScreenImage =
            document.getElementById(
                "profileScreenImage"
            );


        if (profileImage) {
            profileImage.src = photoUrl;
        }


        if (profileScreenImage) {
            profileScreenImage.src = photoUrl;
        }


        // Clear file input
        input.value = "";


        showPopup(
            "Profile photo updated successfully!",
            "success"
        );


    } catch (error) {

        console.error(
            "PROFILE PHOTO ERROR:",
            error
        );

        showPopup(
            "Something went wrong while uploading the photo.",
            "error"
        );


    } finally {

        if (button) {

            button.disabled = false;

            button.innerText =
                "📷 Upload Profile Photo";
        }
    }
}
async function saveGoal() {

    const user =
        JSON.parse(localStorage.getItem("loggedUser"));

    const goal =
        Number(document.getElementById("goalInput").value);

    if (!goal || goal <= 0) {
        showPopup("Enter a valid goal amount");
        return;
    }

    const { error } = await db
        .from("members")
        .update({ goal: goal })
        .eq("phone", user.phone);

    if (error) {
        showPopup(error.message);
        return;
    }

    user.goal = goal;

    localStorage.setItem(
        "loggedUser",
        JSON.stringify(user)
    );

    showPopup("Goal updated successfully");

    loadSavingsStats(user.phone);
}
function scrollToBottom() {
    const container =
        document.getElementById("chatMessages");

    if (container) {
        container.scrollTop =
            container.scrollHeight;
    }
}

function showAI() {

    document.getElementById("dashboardScreen").style.display = "none";
    document.getElementById("historyScreen").style.display = "none";
    document.getElementById("profileScreen").style.display = "none";
    document.getElementById("leadersScreen").style.display = "none";
    document.getElementById("contributeScreen").style.display = "none";
    document.getElementById("chatScreen").style.display = "none";
    document.getElementById("announcementsScreen").style.display = "none";

    document.getElementById("aiScreen").style.display = "block";
}

function showDashboard() {

    document.getElementById("dashboardScreen").style.display = "block";
    document.getElementById("historyScreen").style.display = "none";
    document.getElementById("profileScreen").style.display = "none";
    document.getElementById("leadersScreen").style.display = "none";
    document.getElementById("contributeScreen").style.display = "none";
    document.getElementById("chatScreen").style.display = "none";
    document.getElementById("announcementsScreen").style.display = "none";
    document.getElementById("aiScreen").style.display = "none";
    document.getElementById("groupGoalScreen").style.display = "none";
    document.getElementById("groupMembersScreen").style.display = "none";

    
}
function showChat() {

    document.getElementById("historyScreen").style.display = "none";
    document.getElementById("profileScreen").style.display = "none";
    document.getElementById("leadersScreen").style.display = "none";
    document.getElementById("contributeScreen").style.display = "none";

    document.getElementById("chatScreen").style.display = "block";

    document.getElementById("unreadBadge").style.display = "none";

    loadMessages();
    loadOnlineMembers();
    scrollToBottom();
}
async function sendMessage() {

    const user =
        JSON.parse(localStorage.getItem("loggedUser"));

    const message =
        document.getElementById("chatMessage").value;

    if (!message) {
        showPopup("Type a message");
        return;
    }

    const { error } = await db
        .from("messages")
        .insert([
         {
    name: user.name,
    message: message,
    status: "✓",
    photo_url: user.photo_url || ""
}

        ]);

    if (error) {
        showPopup(error.message);
        return;
    }

    document.getElementById("chatMessage").value = "";

    loadMessages();
}
let mediaRecorder;
let audioChunks = [];
async function startRecording() {

    try {

        const stream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });

        mediaRecorder = new MediaRecorder(stream);

        audioChunks = [];

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

    mediaRecorder.onstop = async () => {

    const audioBlob = new Blob(audioChunks, {
        type: "audio/webm"
    });

    const fileName = `voice_${Date.now()}.webm`;

const { error } = await db.storage
    .from("voice-notes")
    .upload(fileName, audioBlob);
    
    if (error) {
        showPopup("Upload failed");
        console.error(error);
        return;
    }
const { data: publicUrlData } = db.storage
    .from("voice-notes")
    .getPublicUrl(fileName);

const audioUrl = publicUrlData.publicUrl;
    console.log("Voice URL:", audioUrl);

    const user = JSON.parse(localStorage.getItem("loggedUser"));

const { error: msgError } = await db
    .from("messages")
    .insert([{
        name: user.name,
        message: "",
        audio_url: audioUrl,
        status: "✓",
        photo_url: user.photo_url
    }]);

if (msgError) {
    console.error(msgError);
    showPopup("Failed to send voice message.");
} else {
    showPopup("Voice message sent.");
}
};

        mediaRecorder.start();

        const btn = document.getElementById("recordBtn");
btn.innerHTML = "🔴 Recording";
btn.style.background = "#dc2626";

        document.getElementById("recordBtn").onclick =
            stopRecording;

    } catch (err) {

        showPopup("Microphone permission denied");

    }
}

function stopRecording() {

    mediaRecorder.stop();

    const btn = document.getElementById("recordBtn");
btn.innerHTML = "🎤";
btn.style.background = "#15803d";

    document.getElementById("recordBtn").onclick =
        startRecording;
}
async function loadMessages() {
const user =
        JSON.parse(localStorage.getItem("loggedUser"));

    await db
        .from("messages")
        .update({ status: "read" })
        .neq("name", user.name)
        .eq("status", "✓");

updateUnreadCount();

    const { data, error } = await db
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {
        showPopup(error.message);
        return;
    }

    const container =
        document.getElementById("chatMessages");

    if (!container) return;

    container.innerHTML = "";

    data.forEach(item => {

        const mine =
            item.name === user.name;

        const time =
            new Date(item.created_at)
            .toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            });


        container.innerHTML += `
        <div class="chat-message ${mine ? 'my-msg' : 'other-msg'}"
     onmousedown="startHold(${item.id}, decodeURIComponent('${encodeURIComponent(item.message || "")}'))"
     onmouseup="cancelHold()"
     ontouchstart="startHold(${item.id}, decodeURIComponent('${encodeURIComponent(item.message || "")}'))"
     ontouchend="cancelHold()">

            <div class="chat-header">
    <img src="${item.photo_url || 'images/logo.jpg'}" class="chat-avatar">
    <h4>${item.name}</h4>
</div>

            ${item.audio_url
    ? `<audio controls style="width:100%;">
           <source  src="${item.audio_url}"
           type="audio/webm">
           Your browser does not support audio.
       </audio>`
    : `<p>${item.message}</p>`
}


            <div class="chat-footer">
                <span class="chat-time">${time}</span>
                ${mine ? `
                <span class="chat-status">
                    ${item.status === "read" ? "✓✓" : "✓"}
                </span>
                ` : ''}
            </div>

        </div>
        `;
    });

    container.scrollTop =
        container.scrollHeight;
}
/*
setInterval(() => {

    updateUnreadCount();

    const chatScreen =
        document.getElementById("chatScreen");

        if (
    chatScreen &&
    chatScreen.style.display === "block"
) {
    loadMessages();
    loadOnlineMembers();
}

}, 5000);
*/
async function loadNotifications() {

    const { data, error } = await db
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) return;

    const container =
        document.getElementById("notificationsContainer");

    if (!container) return;

    container.innerHTML = "";

    if (!data || data.length === 0) {
        container.innerHTML =
            "<p>No notifications available.</p>";
        return;
    }

    data.forEach(item => {
    container.innerHTML += `
    <div class="card">
        <h3>${item.title}</h3>
        <p>${item.message}</p>

        <button
            class="btn delete-btn"
            onclick="deleteNotification(${item.id})">
            🗑 Delete
        </button>

    </div>
    `;
});
}
async function saveRecoveryInfo() {

    const user =
        JSON.parse(localStorage.getItem("loggedUser"));

        console.log("Logged User:", user.name);

    const answer1 =
        document.getElementById("answer1").value;

    const answer2 =
        document.getElementById("answer2").value;

    const idNumber =
        document.getElementById("idNumber").value;

    if (!answer1 || !answer2 || !idNumber) {
        showPopup("Fill all fields");
        return;
    }

    const { error } = await db
        .from("members")
        .update({
            answer1: answer1,
            answer2: answer2,
            id_number: idNumber
        })
        .eq("phone", user.phone);

    if (error) {
        showPopup(error.message);
        return;
    }

    showPopup("Recovery information saved successfully");
}
async function updateUnreadCount() {

    const user =
        JSON.parse(localStorage.getItem("loggedUser"));

    const { data, error } = await db
        .from("messages")
        .select("*")
        .neq("name", user.name)
        .eq("status", "✓");

    if (error) return;

    const badge =
        document.getElementById("unreadBadge");
    if (!badge) return;

    const count = data ? data.length : 0;

    badge.innerText = count;

    badge.style.display =
        count > 0 ? "flex" : "none";
}
async function updateOnlineStatus(isOnline) {

    const user =
        JSON.parse(localStorage.getItem("loggedUser"));

    if (!user) return;

    await db
        .from("members")
        .update({
            online: isOnline,
            last_seen: new Date().toISOString()
        })
        .eq("phone", user.phone);
}
async function loadOnlineMembers() {

    const fiveMinutesAgo =
new Date(Date.now() - 5 * 60 * 1000).toISOString();

const { data, error } = await db
    .from("members")
    .select("name, photo_url, last_seen");

    if (error) return;

    const container =
        document.getElementById("onlineMembers");

    if (!container) return;

    container.innerHTML = "";

    data.forEach(member => {

    let status = "⚫ Offline";

if (member.last_seen) {

    const diffMinutes = Math.floor(
        (Date.now() - new Date(member.last_seen)) / 60000
    );

    if (diffMinutes < 5) {
        status = "🟢 Online";
    } else if (diffMinutes < 60) {
        status = ` ${diffMinutes} min ago`;
    } else if (diffMinutes < 1440) {
        status = `${Math.floor(diffMinutes / 60)} hr ago`;
    } else {
        status = `${Math.floor(diffMinutes / 1440)} day(s) ago`;
    }
}

const firstName = member.name.split(" ")[0];

container.innerHTML += `
<div class="online-user"
     onclick="showMemberStatus(
        '${member.name}',
        '${member.photo_url || "images/logo.jpg"}',
        '${member.last_seen || ""}'
     )">

    <div style="position:relative;display:inline-block;">
        <img src="${member.photo_url || 'images/logo.jpg'}"
             class="online-avatar">

        ${status === "🟢 Online"
        ? `<span style="
            position:absolute;
            bottom:2px;
            right:2px;
            width:12px;
            height:12px;
            background:#22c55e;
            border:2px solid white;
            border-radius:50%;
        "></span>`
        : ""}
    </div>

    <small>${firstName}</small>

</div>
    <div>
    <strong>${member.name.split(" ")[0]}</strong> <br>
        <small>${status === "🟢 Online" ? "Online" : status}</small>
    </div>

    </div>
</div>
`;
});
}
async function loadOfflineMembers() {

    const { data, error } = await db
        .from("members")
        .select("name, photo_url, last_seen")
        .eq("online", false);

    if (error) return;

    console.log(data);
}
async function deleteMessage(id) {

    const confirmDelete =
        confirm("Delete this message?");

    if (!confirmDelete) return;

    const { error } = await db
        .from("messages")
        .delete()
        .eq("id", id);

    if (error) {
        showPopup(error.message);
        return;
    }

    loadMessages();
}
async function updateLastSeen() {

    const user = JSON.parse(localStorage.getItem("loggedUser"));

    if (!user) return;

    await db
        .from("members")
        .update({
            last_seen: new Date().toISOString()
        })
        .eq("phone", user.phone);
}
function showMemberStatus(name, photo, lastSeen) {

    let status = "⚫ Offline";

    if (lastSeen) {

        const diffMinutes = Math.floor(
            (Date.now() - new Date(lastSeen)) / 60000
        );

        if (diffMinutes < 5) {
            status = "🟢 Online";
        } else if (diffMinutes < 60) {
            status = `⏰ Last seen ${diffMinutes} min ago`;
        } else if (diffMinutes < 1440) {
            status = `⏰ Last seen ${Math.floor(diffMinutes / 60)} hr ago`;
        } else {
            status = `⏰ Last seen ${Math.floor(diffMinutes / 1440)} day(s) ago`;
        }
    }

    document.getElementById("popupPhoto").src = photo;
    document.getElementById("popupName").innerText = name;
    document.getElementById("popupStatus").innerText = status;

    document.getElementById("memberStatusPopup").style.display = "flex";
}

function closeMemberStatus() {
    document.getElementById("memberStatusPopup").style.display = "none";

    document.getElementById("memberStatusPopup").onclick = function(e) {
    if (e.target === this) {
        closeMemberStatus();
    }
};
}

let selectedMessageId = null;
let selectedMessageText = "";

function showMessageMenu(id, text) {
    selectedMessageId = id;
    selectedMessageText = text || "";
    const menu = document.getElementById("messageMenu");
    if (!menu) return;
    menu.style.display = "block";
    menu.setAttribute("role", "menu");
}

function closeMessageMenu() {

    document.getElementById("messageMenu")
        .style.display = "none";
}

async function deleteSelectedMessage() {

    const user =
        JSON.parse(localStorage.getItem("loggedUser"));

    const { data, error } = await db
        .from("messages")
        .select("*")
        .eq("id", selectedMessageId)
        .single();

    if (error) {
        showPopup(error.message);
        return;
    }

    if (data.name !== user.name) {
        showPopup("You can only delete your own messages");
        return;
    }

    const { error: deleteError } = await db
        .from("messages")
        .delete()
        .eq("id", selectedMessageId);

    if (deleteError) {
        showPopup(deleteError.message);
        return;
    }

    closeMessageMenu();
    loadMessages();
}

async function copySelectedMessage() {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(selectedMessageText || "");
        } else {
            const area = document.createElement("textarea");
            area.value = selectedMessageText || "";
            area.style.position = "fixed";
            area.style.opacity = "0";
            document.body.appendChild(area);
            area.select();
            document.execCommand("copy");
            area.remove();
        }
        showPopup("Message copied", "success");
    } catch (error) {
        console.error(error);
        showPopup("Could not copy this message.", "error");
    }
    closeMessageMenu();
}
let holdTimer;

function startHold(id, text) {

    holdTimer = setTimeout(() => {
        showMessageMenu(id, text);
    }, 800); // hold for 0.8 seconds
}
function cancelHold() {

    clearTimeout(holdTimer);
}

async function showAnnouncements() {

    document.getElementById("dashboardScreen").style.display = "none";
    document.getElementById("historyScreen").style.display = "none";
    document.getElementById("profileScreen").style.display = "none";
    document.getElementById("leadersScreen").style.display = "none";
    document.getElementById("contributeScreen").style.display = "none";
    document.getElementById("chatScreen").style.display = "none";
    document.getElementById("groupMembersScreen").style.display = "none";
    document.getElementById("aiScreen").style.display = "none";

    document.getElementById("announcementsScreen").style.display = "block";

    const container = document.getElementById("announcementsOnlyContainer");

    const { data, error } = await db
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        container.innerHTML = "<p>Failed to load announcements.</p>";
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = "<p>No announcements available.</p>";
        return;
    }

    container.innerHTML = "";

    data.forEach(item => {
        container.innerHTML += `
            <div class="card">
                <h3>${item.title}</h3>
                <p>${item.message}</p>
            </div>
        `;
    });
}
async function deleteNotification(id) {

    const ok = confirm("Delete this notification?");

    if (!ok) return;

    const { error } = await db
        .from("notifications")
        .delete()
        .eq("id", id);

    if (error) {
        showPopup(error.message);
        return;
    }

    loadNotifications();
}

// CONTRIBUTION REMINDER

async function checkContributionReminder() {
console.log("Reminder function running");
    const user =
        JSON.parse(localStorage.getItem("loggedUser"));

    if (!user) return;

    const today = new Date().getDate();

    // remind every 25th
    if (today >= 1) {

        const container =
document.getElementById("notificationsContainer");

if(container){

container.innerHTML =
`
<div class="card">
<h3>🔔 Contribution Reminder</h3>
<p>
Today is contribution day.
Minimum contribution is KSh 50.
Please make your contribution before midnight.
</p>
</div>
`
+ container.innerHTML;

}

    }
}
function filterMembers() {

    const input = document
        .getElementById("memberSearch")
        .value
        .toLowerCase();

    const cards = document
        .querySelectorAll("#membersContainer .card");

    cards.forEach(card => {

        const text = card.innerText.toLowerCase();

        if (text.includes(input)) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }

    });

}


function copyMpesaNumber() {
    const number = "0743361713";

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(number)
            .then(() => showPopup("M-Pesa number copied.", "success"))
            .catch(() => showPopup("Could not copy the number.", "error"));
        return;
    }

    const temp = document.createElement("textarea");
    temp.value = number;
    document.body.appendChild(temp);
    temp.select();

    try {
        document.execCommand("copy");
        showPopup("M-Pesa number copied.", "success");
    } catch (error) {
        showPopup("Could not copy the number.", "error");
    }

    temp.remove();
}
async function loadContributionDayTotals() {

    try {

        const { data, error } = await db
            .from("contributions")
            .select("amount, created_at");

        if (error) {
            console.error(
                "Contribution day error:",
                error
            );
            return;
        }

        const contributions = data || [];
        const now = new Date();

        /*
         * Find the most recent completed Wednesday
         */

        const wednesday = new Date(now);
        const currentDay = wednesday.getDay();

        let daysSinceWednesday =
            (currentDay - 3 + 7) % 7;

        // If today is Wednesday, use today
        wednesday.setDate(
            wednesday.getDate() - daysSinceWednesday
        );

        wednesday.setHours(0, 0, 0, 0);

        /*
         * Find the most recent completed Saturday
         */

        const saturday = new Date(now);

        let daysSinceSaturday =
            (currentDay - 6 + 7) % 7;

        saturday.setDate(
            saturday.getDate() - daysSinceSaturday
        );

        saturday.setHours(0, 0, 0, 0);


        /*
         * End of each contribution day
         */

        const nextWednesday =
            new Date(wednesday);

        nextWednesday.setDate(
            nextWednesday.getDate() + 1
        );

        const nextSaturday =
            new Date(saturday);

        nextSaturday.setDate(
            nextSaturday.getDate() + 1
        );


        let wednesdayTotal = 0;
        let saturdayTotal = 0;


        contributions.forEach(item => {

            if (!item.created_at) return;

            const date =
                new Date(item.created_at);

            if (Number.isNaN(date.getTime())) {
                return;
            }

            const amount =
                Number(item.amount || 0);


            // Wednesday
            if (
                date >= wednesday &&
                date < nextWednesday
            ) {
                wednesdayTotal += amount;
            }


            // Saturday
            if (
                date >= saturday &&
                date < nextSaturday
            ) {
                saturdayTotal += amount;
            }

        });


        const wednesdayEl =
            document.getElementById(
                "wednesdayAmount"
            );

        const saturdayEl =
            document.getElementById(
                "saturdayAmount"
            );


        if (wednesdayEl) {
            wednesdayEl.innerText =
                "KSh " +
                wednesdayTotal.toLocaleString() +
                " collected";
        }


        if (saturdayEl) {
            saturdayEl.innerText =
                "KSh " +
                saturdayTotal.toLocaleString() +
                " collected";
        }


    } catch (error) {

        console.error(
            "Contribution day error:",
            error
        );

    }
}
/* =========================================================
   ANDROID / PHONE BACK BUTTON NAVIGATION
   Keeps member dashboard screens in browser history
   ========================================================= */

(function () {

    const screens = [
        "showDashboard",
        "showHistory",
        "showAnnouncements",
        "showProfile",
        "showLeaders",
        "showGroupMembers",
        "showGroupGoal",
        "showContribute",
        "showChat",
        "showAI"
    ];

    const originalFunctions = {};
    let handlingBack = false;

    // Save the original functions
    screens.forEach(name => {
        if (typeof window[name] === "function") {
            originalFunctions[name] = window[name];
        }
    });

    // Replace each function with a history-aware version
    screens.forEach(name => {

        if (!originalFunctions[name]) return;

        window[name] = function () {

            // Don't create another history entry when
            // the Android/browser Back button is being handled
            if (!handlingBack) {
                history.pushState(
                    { rihulaScreen: name },
                    "",
                    "#" + name
                );
            }

            originalFunctions[name]();
        };
    });

    // Initial dashboard state
    if (!history.state || !history.state.rihulaScreen) {
        history.replaceState(
            { rihulaScreen: "showDashboard" },
            "",
            "#dashboard"
        );
    }

    // Android / browser Back button
    window.addEventListener("popstate", function (event) {

        const state = event.state;

        if (!state || !state.rihulaScreen) {
            return;
        }

        const screen = state.rihulaScreen;

        if (originalFunctions[screen]) {

            handlingBack = true;

            originalFunctions[screen]();

            handlingBack = false;
        }
    });

})();