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
    }

    document.getElementById("welcomeName").innerText =
        "Welcome " + user.name;

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

function showHistory() {

    document.getElementById("dashboardScreen")
        .style.display = "none";

    document.getElementById("historyScreen")
        .style.display = "block";
        
        document.getElementById("chatScreen")
    .style.display = "none";
}

function showDashboard() {

    document.getElementById("dashboardScreen")
        .style.display = "block";

    document.getElementById("historyScreen")
        .style.display = "none";

    document.getElementById("profileScreen")
        .style.display = "none";

    document.getElementById("leadersScreen")
        .style.display = "none";

    document.getElementById("contributeScreen")
        .style.display = "none";
        
        document.getElementById("chatScreen")
    .style.display = "none";
    
    document.getElementById("announcementsScreen").style.display = "none";
    
}
function showProfile() {

    const user =
        JSON.parse(localStorage.getItem("loggedUser"));

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

    document.getElementById("profileScreenStatus")
    .innerText =
    user.online
        ? "🟢 Online"
        : "⏰ Last seen recently";

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

function showAnnouncements() {

    document.getElementById("dashboardScreen").style.display = "none";
    document.getElementById("historyScreen").style.display = "none";
    document.getElementById("profileScreen").style.display = "none";
    document.getElementById("leadersScreen").style.display = "none";
    document.getElementById("contributeScreen").style.display = "none";
    document.getElementById("chatScreen").style.display = "none";

    document.getElementById("announcementsScreen").style.display = "block";
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

    const user =
        JSON.parse(localStorage.getItem("loggedUser"));

    const currentPassword =
        document.getElementById("currentPassword").value;

    const newPassword =
        document.getElementById("newPassword").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;

    if (!currentPassword ||
        !newPassword ||
        !confirmPassword) {

        alert("Fill all fields");
        return;
    }

    if (newPassword !== confirmPassword) {

        alert("New passwords do not match");
        return;
    }

    if (currentPassword !== user.password) {

        alert("Current password is incorrect");
        return;
    }

    const { error } = await db
        .from("members")
        .update({
            password: newPassword
        })
        .eq("phone", user.phone);

    if (error) {

        alert(error.message);
        return;
    }

    user.password = newPassword;

    localStorage.setItem(
        "loggedUser",
        JSON.stringify(user)
    );

    alert("Password updated successfully");

    document.getElementById("currentPassword").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";
}
async function loadAnnouncements() {

    const { data, error } = await db
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) return;

    const container =
        document.getElementById("announcementsContainer");

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

function showChat() {

    document.getElementById("dashboardScreen").style.display = "none";
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

        mediaRecorder.onstop = () => {

            const audioBlob =
                new Blob(audioChunks, {
                    type: "audio/webm"
                });

            console.log("Voice recorded:", audioBlob);

            alert("Voice recorded successfully");
        };

        mediaRecorder.start();

        document.getElementById("recordBtn").innerText = "⏹";

        document.getElementById("recordBtn").onclick =
            stopRecording;

    } catch (err) {

        alert("Microphone permission denied");

    }
}

function stopRecording() {

    mediaRecorder.stop();

    document.getElementById("recordBtn").innerText = "🎤";

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
        .order("created_at", { ascending: false })
        .limit(10);

    if (error) {
        alert(error.message);
        return;
    }

    const container =
        document.getElementById("chatMessages");

    if (!container) return;

    container.innerHTML = "";

    data.reverse().forEach(item => {

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

            <p>${item.message}</p>


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


        
window.addEventListener("beforeunload", () => {
    updateOnlineStatus(false);
});
setInterval(() => {
    loadMemberData();
    loadOnlineMembers();
}, 30000);
async function loadOnlineMembers() {

    const { data, error } = await db
        .from("members")
        .select("name, photo_url")
        .eq("online", true);

    if (error) return;

    const container =
        document.getElementById("onlineMembers");

    if (!container) return;

    container.innerHTML = "";

    data.forEach(member => {

        container.innerHTML += `
        <div class="online-user">
            <img src="${member.photo_url || 'images/logo.jpg'}"
                 class="online-avatar">

            <span>${member.name}</span>

            <div class="online-dot"></div>
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
function showMessageMenu(event, id) {

    event.preventDefault();

    const action = prompt(
        "Type:\n1 = Delete\n2 = Copy"
    );

    if (action === "1") {
        deleteMessage(id);
    }
}
let selectedMessageId = null;
let selectedMessageText = "";

function showMessageMenu(id, text) {

    selectedMessageId = id;
    selectedMessageText = text;

    document.getElementById("messageMenu")
        .style.display = "block";
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

    const user = JSON.parse(
        localStorage.getItem("loggedUser")
    );

    if (!user) return;

    const { data, error } = await db
        .from("contributions")
        .select("member_phone, amount");

    if (error) {
        console.error(error);
        return;
    }

    const totals = {};

    data.forEach(item => {

        const phone = item.member_phone;

        if (!totals[phone]) {
            totals[phone] = 0;
        }

        totals[phone] += Number(item.amount || 0);

    });

    const ranking = Object.entries(totals)
        .sort((a, b) => b[1] - a[1]);

    const rank =
        ranking.findIndex(
            item => item[0] === user.phone
        ) + 1;

    document.getElementById("myRank").innerText =
        rank > 0 ? "#" + rank : "Unranked";
}
function showAnnouncements() {

    document.getElementById("dashboardScreen").style.display = "none";
    document.getElementById("historyScreen").style.display = "none";
    document.getElementById("profileScreen").style.display = "none";
    document.getElementById("leadersScreen").style.display = "none";
    document.getElementById("contributeScreen").style.display = "none";
    document.getElementById("chatScreen").style.display = "none";

    document.getElementById("announcementsScreen").style.display = "block";
    
    document.getElementById("announcementsScreen").style.display = "none";
}

async function showAnnouncements() {

    document.getElementById("dashboardScreen").style.display = "none";
    document.getElementById("historyScreen").style.display = "none";
    document.getElementById("profileScreen").style.display = "none";
    document.getElementById("leadersScreen").style.display = "none";
    document.getElementById("contributeScreen").style.display = "none";
    document.getElementById("chatScreen").style.display = "none";

    document.getElementById("announcementsScreen").style.display = "block";

    const container =
        document.getElementById("announcementsOnlyContainer");

    const { data, error } = await db
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        container.innerHTML = "<p>Error loading announcements.</p>";
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