async function loadMemberData() {

    const user =
        JSON.parse(localStorage.getItem("loggedUser"));


    if (!user) {
        window.location.href = "login.html";
        return;
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

    await loadContributionHistory(user.phone);
    await loadAnnouncements();
    await loadNotifications();
    await loadSavingsStats(user.phone);
}

function logout() {
    localStorage.removeItem("loggedUser");
    window.location.href = "login.html";
}
loadMemberData();

function showHistory() {

    document.getElementById("dashboardScreen")
        .style.display = "none";

    document.getElementById("historyScreen")
        .style.display = "block";
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
}
function showProfile() {

    const user =
        JSON.parse(localStorage.getItem("loggedUser"));

    document.getElementById("dashboardScreen")
        .style.display = "none";

    document.getElementById("profileScreen")
        .style.display = "block";

    document.getElementById("profileScreenName")
        .innerText = user.name;

    document.getElementById("profileScreenPhone")
        .innerText = user.phone;

    document.getElementById("profileScreenStatus")
        .innerText = user.status || "Member";

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
function showChat() {

    document.getElementById("dashboardScreen").style.display = "none";
    document.getElementById("historyScreen").style.display = "none";
    document.getElementById("profileScreen").style.display = "none";
    document.getElementById("leadersScreen").style.display = "none";
    document.getElementById("contributeScreen").style.display = "none";

    document.getElementById("chatScreen").style.display = "block";

    loadMessages();
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
                message: message
            }
        ]);

    if (error) {
        alert(error.message);
        return;
    }

    document.getElementById("chatMessage").value = "";

    loadMessages();
}
async function loadMessages() {

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

    data.forEach(item => {

        container.innerHTML += `
        <div class="card">
            <h3>${item.name}</h3>
            <p>${item.message}</p>
        </div>
        `;
    });
}
setInterval(() => {

    const chatScreen =
        document.getElementById("chatScreen");

    if (
        chatScreen &&
        chatScreen.style.display === "block"
    ) {
        loadMessages();
    }

}, 5000);
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