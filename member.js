async function loadMemberData() {

    let user =
        JSON.parse(localStorage.getItem("loggedUser"));

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    const { data, error } = await db
        .from("members")
        .select("*")
        .eq("phone", user.phone)
        .single();

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
    await loadMyRank();
   await loadGroupGoal(); 
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
            alert(error.message);
            return;
        }
    }

    localStorage.removeItem("loggedUser");

    window.location.href = "login.html";
}

loadMemberData();
updateUnreadCount();
updateOnlineStatus(true);
loadMyRank();
showDashboard();
updateLastSeen();
loadOnlineMembers();

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

        const { data, error } = await db
            .from("contributions")
            .select("*")
            .eq("member_phone", String(phone))
            .order("created_at", { ascending: false });

        if (error) {
            alert("Supabase Error: " + error.message);
            return;
        }

        const container =
    document.getElementById("historyOnlyContainer");

        if (!data || data.length === 0) {
            container.innerHTML =
                "<p>No contributions yet.</p>";
            return;
        }

        container.innerHTML = "";

        data.forEach(item => {

            container.innerHTML += `
                <div class="card">
                    <h3>KSh ${item.amount}</h3>
                    <p>${new Date(item.created_at).toLocaleDateString()}</p>
                </div>
            `;
        });

    } catch (err) {

        alert("Catch Error: " + err.message);

    }
}
async function loadSavingsStats(phone) {

    try {

        const { data: myData, error: myError } = await db
            .from("contributions")
            .select("amount")
            .eq("member_phone", String(phone));

        if (myError) {
            alert(myError.message);
            return;
        }

        let myTotal = 0;

        (myData || []).forEach(item => {
            myTotal += Number(item.amount || 0);
        });

        document.getElementById("mySavings").innerText =
            "KSh " + myTotal.toLocaleString();

        const { data: groupData, error: groupError } = await db
            .from("contributions")
            .select("amount");

        if (groupError) {
            alert(groupError.message);
            return;
        }

        let groupTotal = 0;

        (groupData || []).forEach(item => {
            groupTotal += Number(item.amount || 0);
        });

        document.getElementById("groupSavings").innerText =
            "KSh " + groupTotal.toLocaleString();

        const user =
    JSON.parse(localStorage.getItem("loggedUser"));

const goal =
    Number(user.goal || 5000);

        const percent =
            Math.round((myTotal / goal) * 100);

        document.getElementById("goalAmount").innerText =
            `KSh ${myTotal} / KSh ${goal}`;

        document.getElementById("progressText").innerText =
            percent + "%";

        document.getElementById("progressFill").style.width =
            percent + "%";

    } catch (err) {

        alert("Savings Error: " + err.message);

    }
}

async function changePassword() {

    const user = JSON.parse(localStorage.getItem("loggedUser"));

    const currentPassword = document.getElementById("currentPassword").value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
        alert("Please fill all fields.");
        return;
    }

    if (newPassword !== confirmPassword) {
        alert("New passwords do not match.");
        return;
    }

    if (newPassword.length < 6) {
        alert("Password must be at least 6 characters long.");
        return;
    }

    const { data, error } = await db
        .from("members")
        .select("id,password")
        .eq("phone", user.phone)
        .single();

    if (error || !data) {
        alert("Member not found.");
        return;
    }

    if (currentPassword !== data.password) {
        alert("Current password is incorrect.");
        return;
    }

    if (newPassword === data.password) {
        alert("Your new password cannot be the same as your current password.");
        return;
    }

    const { error: updateError } = await db
        .from("members")
        .update({
            password: newPassword
        })
        .eq("id", data.id);

    if (updateError) {
        alert(updateError.message);
        return;
    }

    user.password = newPassword;
    localStorage.setItem("loggedUser", JSON.stringify(user));

    document.getElementById("currentPassword").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";

    alert("Password changed successfully.");
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

    data.forEach(item => {

        container.innerHTML += `
        <div class="card">
            <h3>${item.title}</h3>
            <p>${item.message}</p>
        </div>
        `;
    });
}
async function uploadProfilePhoto() {

    const user =
        JSON.parse(localStorage.getItem("loggedUser"));

    const file =
        document.getElementById("photoUpload").files[0];

    if (!file) {
        alert("Please select a photo");
        return;
    }

    const fileName =
        `${user.phone}_${Date.now()}`;

    const { error: uploadError } = await db.storage
    .from("profile-pictures")
    .upload(fileName, file);

if (uploadError) {
    console.log(uploadError);
    alert(uploadError.message);
    return;
}

    const { data } = db.storage
        .from("profile-pictures")
        .getPublicUrl(fileName);

    const photoUrl = data.publicUrl;

    const { error: updateError } = await db
        .from("members")
        .update({
            photo_url: photoUrl
        })
        .eq("phone", user.phone);

    if (updateError) {
        alert(updateError.message);
        return;
    }

    user.photo_url = photoUrl;

    localStorage.setItem(
        "loggedUser",
        JSON.stringify(user)
    );

    document.getElementById("profileImage").src =
        photoUrl;

    document.getElementById("profileScreenImage").src =
        photoUrl;

    alert("Profile photo updated successfully");
}
async function saveGoal() {

    const user =
        JSON.parse(localStorage.getItem("loggedUser"));

    const goal =
        Number(document.getElementById("goalInput").value);

    if (!goal || goal <= 0) {
        alert("Enter a valid goal amount");
        return;
    }

    const { error } = await db
        .from("members")
        .update({ goal: goal })
        .eq("phone", user.phone);

    if (error) {
        alert(error.message);
        return;
    }

    user.goal = goal;

    localStorage.setItem(
        "loggedUser",
        JSON.stringify(user)
    );

    alert("Goal updated successfully");

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
        alert("Type a message");
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
        alert(error.message);
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
        alert("Upload failed");
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
    alert("Failed to send voice message.");
} else {
    alert("Voice message sent.");
}
};

        mediaRecorder.start();

        const btn = document.getElementById("recordBtn");
btn.innerHTML = "🔴 Recording";
btn.style.background = "#dc2626";

        document.getElementById("recordBtn").onclick =
            stopRecording;

    } catch (err) {

        alert("Microphone permission denied");

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
        alert(error.message);
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
     onmousedown="startHold(${item.id}, \`${item.message.replace(/`/g,'\\`')}\`)"
     onmouseup="cancelHold()"
     ontouchstart="startHold(${item.id}, \`${item.message.replace(/`/g,'\\`')}\`)"
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
        alert("Fill all fields");
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
        alert(error.message);
        return;
    }

    alert("Recovery information saved successfully");
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
        alert(error.message);
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
        alert(error.message);
        return;
    }

    if (data.name !== user.name) {
        alert("You can only delete your own messages");
        return;
    }

    const { error: deleteError } = await db
        .from("messages")
        .delete()
        .eq("id", selectedMessageId);

    if (deleteError) {
        alert(deleteError.message);
        return;
    }

    closeMessageMenu();
    loadMessages();
}

function copySelectedMessage() {

    navigator.clipboard.writeText(
        selectedMessageText
    );

    alert("Message copied");

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
async function loadMyRank() {

    const user =
        JSON.parse(localStorage.getItem("loggedUser"));

    if (!user) return;

    const { data: members } = await db
        .from("members")
        .select("*");

    const rankings = [];

    for (const member of members || []) {

        const { data: contributions } = await db
            .from("contributions")
            .select("amount")
            .eq("member_phone", member.phone);

        let total = 0;

        (contributions || []).forEach(item => {
            total += Number(item.amount || 0);
        });

        rankings.push({
            phone: member.phone,
            total: total
        });
    }

    rankings.sort((a, b) => b.total - a.total);

    const rank =
        rankings.findIndex(
            item => item.phone == user.phone
        ) + 1;

    document.getElementById("myRank").innerText =
        rank > 0 ? "#" + rank : "Unranked";
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
        alert(error.message);
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
