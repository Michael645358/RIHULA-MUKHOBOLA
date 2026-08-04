
console.log("DB:", db);
async function addMember() {

    const name =
    document.getElementById("memberName").value.trim();

const phone =
    document.getElementById("memberPhone").value.trim();

const password =
    document.getElementById("memberPassword").value;

const answer1 =
    document.getElementById("answer1").value;

const answer2 =
    document.getElementById("answer2").value;

const idNumber =
    document.getElementById("idNumber").value;

    console.log("Supabase object:", supabase);

    try {

        const { error } = await db
            .from("members")
            .insert([
                {
    name: name,
    phone: phone,
    password: password,
    answer1: answer1,
    answer2: answer2,
    id_number: idNumber,
    role: "member",
    status: "pending"
}
            ]);

        if (error) {
            alert("SUPABASE ERROR: " + error.message);
        } else {
            alert("Member Added Successfully");
        }

    } catch(err) {
        alert("CATCH ERROR: " + err.message);
    }
}
async function recordContribution() {

    const phone =
        document.getElementById("contributorPhone").value;

    const amount =
        document.getElementById("contributionAmount").value;

    if (!phone || !amount) {
        alert("Fill all fields");
        return;
    }

    const { error } = await db
        .from("contributions")
        .insert([
            {
                member_phone: phone,
                amount: amount
            }
        ]);

    if (error) {
        alert("ERROR: " + error.message);
    } else {

        alert("Contribution Saved Successfully");

        document.getElementById("contributorPhone").value = "";
        document.getElementById("contributionAmount").value = "";

        loadLeaderboard();
        loadStats();
        loadDashboardStats();

    }
}
async function loadStats() {

    const { count: memberCount } = await db
        .from("members")
        .select("*", { count: "exact", head: true });

    const { data: contributions, error } = await db
        .from("contributions")
        .select("amount");

    console.log("Contributions Data:", contributions);
    console.log("Contributions Error:", error);

    let total = 0;

    (contributions || []).forEach(item => {
        total += Number(item.amount || 0);
    });

    console.log("Total Contributions:", total);

    const totalMembers = document.getElementById("totalMembers");

    if (totalMembers) {
        totalMembers.innerText = memberCount || 0;
    }

    const totalSavings = document.getElementById("totalSavings");

    if (totalSavings) {
        totalSavings.innerText = "KSh " + total.toLocaleString();
    }
}
async function loadGroupSavings() {

    const { data, error } = await db
        .from("contributions")
        .select("amount");

    if (error) return;

    let total = 0; 

    data.forEach(item => {
        total += Number(item.amount);
    });

    const adminElement =
        document.getElementById("adminGroupSavings");

    if (adminElement) {
        adminElement.innerText =
            "KSh " + total.toLocaleString();
    }
}

window.onload = function () {

    loadStats();
    loadOnlineCount();
    loadGroupSavings();
    loadPendingMembers();
    loadAnnouncements();
    loadAnnouncementsList();
    loadLeadership();
    loadLeaderboard(); 

    
    if (document.getElementById("membersBody")) {
        loadMembers();
    }

    const splash = document.getElementById("splash-screen");
    const loadingText = document.getElementById("loading-text");

    if (!splash || !loadingText) return;

    if (sessionStorage.getItem("splashShown")) {
        splash.style.display = "none";
        return;
    }

    sessionStorage.setItem("splashShown", "true");

    let percent = 0;

    const timer = setInterval(function () {

        percent++;

        loadingText.innerHTML = percent + "%";

        if (percent >= 100) {

            clearInterval(timer);

            splash.style.display = "none";
        }

    }, 50);

};
async function editMember() {

    const phone =
        document.getElementById("editPhone").value;

    const name =
        document.getElementById("editName").value;

    const { error } = await db
        .from("members")
        .update({
            name: name
        })
        .eq("phone", phone);

    if (error) {
        alert(error.message);
    } else {
        alert("Member Updated Successfully");
    }
}

async function editContribution() {

    const phone =
        document.getElementById(
            "editContributionPhone"
        ).value;

    const amount =
        document.getElementById(
            "editContributionAmount"
        ).value;

    const { error } = await db
        .from("contributions")
        .update({
            amount: amount
        })
        .eq("member_phone", phone);

    if (error) {
        alert(error.message);
    } else {
        alert("Contribution Updated Successfully");
    }
}
async function loadMembers() {

    const { data, error } = await db
        .from("members")
        .select("*");

    if (error) {
        alert(error.message);
        return;
    }

    const body =
        document.getElementById("membersBody");

    body.innerHTML = "";

    for (const member of data) {
        const { data: contributions } = await db
    .from("contributions")
    .select("amount")
    .eq("member_phone", member.phone);

let totalSavings = 0;

(contributions || []).forEach(item => {
    totalSavings += Number(item.amount || 0);
});

    body.innerHTML += `
<div class="member-card">
    <h3>${member.name}</h3>

    <p><strong>Phone:</strong> ${member.phone}</p>

    <p><strong>Role:</strong> ${member.role}</p>

    <p><strong>Status:</strong> ${member.status}</p>
    
    <p><strong>Total Saved:</strong> KSh${totalSavings}</p>

    <div class="member-actions">
<button
    onclick="viewHistory('${member.phone}','${member.name}')"
    class="btn">
    History
</button>

        <button
            onclick="deleteMember('${member.phone}')"
            class="btn">
            Delete
        </button>

    </div>
</div>
`;
    }
}
async function deleteMember(phone) {

    const confirmDelete =
        confirm("Delete this member?");

    if (!confirmDelete) return;

    const { error } = await db
        .from("members")
        .delete()
        .eq("phone", phone);

    if (error) {
        alert(error.message);
    } else {
        alert("Member Deleted");
        loadMembers();
    }
}
async function approveMember(phone) {

    const { error } = await db
        .from("members")
        .update({
            status: "approved"
        })
        .eq("phone", phone);

    if (error) {
        alert(error.message);
    } else {
        alert("Member Approved");

await addActivity(
    "Approved member: " + phone
);

loadMembers();
loadPendingMembers();
loadDashboardStats();
loadLeaderboard();
    }
}
async function loadPendingMembers() {

    const body = document.getElementById("pendingMembersBody");

    if (!body) return;

    body.innerHTML = "<p>Loading pending members...</p>";

    const { data, error } = await db
        .from("members")
        .select("*")
        .eq("status", "pending");

    if (error) {
        body.innerHTML = `
            <div class="member-card">
                <h3>Error</h3>
                <p>${error.message}</p>
            </div>
        `;
        return;
    }

    body.innerHTML = "";

    if (!data || data.length === 0) {

        body.innerHTML = `
            <div class="member-card">
                <h3>✅ No Pending Members</h3>
                <p>All members have been approved.</p>
            </div>
        `;

        return;
    }

    data.forEach(member => {

        body.innerHTML += `
        <div class="member-card">
            <h3>${member.name}</h3>
            <p><strong>Phone:</strong> ${member.phone}</p>
            <p><strong>Status:</strong> ${member.status}</p>

            <button class="btn"
                onclick="approveMember('${member.phone}')">
                Approve
            </button>
        </div>
        `;

    });
}
const slides = document.querySelectorAll(".slide");

let currentSlide = 0;

if (slides.length > 0) {

    setInterval(() => {

        slides[currentSlide].classList.remove("active");

        currentSlide++;

        if (currentSlide >= slides.length) {
            currentSlide = 0;
        }

        slides[currentSlide].classList.add("active");

    }, 4000);

}
async function logout() {

    const user = JSON.parse(localStorage.getItem("loggedUser"));

    if (user) {
        await db
            .from("members")
            .update({
                online: false
            })
            .eq("phone", user.phone);
    }

    localStorage.removeItem("loggedUser");

    window.location.href = "login.html";
}
async function loadAnnouncements() {

    const { data, error } = await db
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.log(error.message);
        return;
    }

    const container =
        document.getElementById("announcementsContainer");

    if (!container) return;

    container.innerHTML = "";

    data.forEach(item => {

        container.innerHTML += `
<div class="announcement">

    <span class="date-badge">
        ${new Date(item.created_at).toLocaleDateString()}
    </span>

    <h3>${item.title}</h3>

    <p>${item.message}</p>

</div>
`;
    });

}
async function addAnnouncement() {

    const title =
        document.getElementById("announcementTitle").value.trim();

    const message =
        document.getElementById("announcementMessage").value.trim();

    if (!title || !message) {
        alert("Please enter both title and message.");
        return;
    }

    const { error } = await db
        .from("announcements")
        .insert([
            {
                title: title,
                message: message
            }
        ]);

    if (error) {
        alert("Error: " + error.message);
        return;
    }

    alert("Announcement posted successfully!");

    document.getElementById("announcementTitle").value = "";
    document.getElementById("announcementMessage").value = "";

    loadAnnouncementsList();
    loadAnnouncements();
}
async function loadAnnouncementsList() {

    const { data, error } = await db
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

    const box = document.getElementById("announcementsList");

    if (!box) return;

    if (error) {
        box.innerHTML = error.message;
        return;
    }

    if (data.length === 0) {
        box.innerHTML = "<p>No announcements found.</p>";
        return;
    }

    box.innerHTML = "";

    data.forEach(item => {

        box.innerHTML += `
        <div class="announcement-card">

            <h3>${item.title}</h3>

            <p>${item.message}</p>

            <br>

            <button onclick="editAnnouncement('${item.id}')">
                ✏ Edit
            </button>

            <button onclick="deleteAnnouncement('${item.id}')">
                🗑 Delete
            </button>

            <button onclick="pushAnnouncement('${item.title}','${item.message}')">
                🔔 Send Push
            </button>

        </div>
        `;
    });

}
async function deleteAnnouncement(id) {

    const confirmDelete =
        confirm("Delete this announcement?");

    if (!confirmDelete) return;

    const { error } = await db
        .from("announcements")
        .delete()
        .eq("id", id);

    if (error) {
        alert("Delete Error: " + error.message);
    } else {
        alert("Announcement Deleted");
        loadAnnouncementsList();
    }
}
async function editAnnouncement(id){

    const title = prompt("New title:");

    if(title == null) return;

    const message = prompt("New message:");

    if(message == null) return;

    const { error } = await db
        .from("announcements")
        .update({
            title:title,
            message:message
        })
        .eq("id",id);

    if(error){
        alert(error.message);
        return;
    }

    alert("Announcement updated.");

    loadAnnouncementsList();

} 

async function pushAnnouncement(title,message){

    const res = await fetch(
    "https://ubyuscrigxgvchfofeyx.supabase.co/functions/v1/smart-function",
    {
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            title:title,
            message:message
        })
    });

    const data = await res.json();

    alert("Push notification sent.");
}

async function loadLeadership() {

    const { data, error } = await db
        .from("leadership")
        .select("*");

    if (error) {
        alert(error.message);
        return;
    }

    data.forEach(item => {

        const position = item.position.toLowerCase().trim();

        if (position === "chairman") {

            const chairmanPhoto = document.getElementById("chairmanPhoto");
            const chairmanName = document.getElementById("chairmanName");

            if (chairmanPhoto && item.photo_url) {
                chairmanPhoto.src = item.photo_url;
            }

            if (chairmanName) {
                chairmanName.innerText = item.name;
            }
        }

        if (position === "secretary") {

            const secretaryPhoto = document.getElementById("secretaryPhoto");
            const secretaryName = document.getElementById("secretaryName");

            if (secretaryPhoto && item.photo_url) {
                secretaryPhoto.src = item.photo_url;
            }

            if (secretaryName) {
                secretaryName.innerText = item.name;
            }
        }

        if (position === "treasurer") {

            const treasurerPhoto = document.getElementById("treasurerPhoto");
            const treasurerName = document.getElementById("treasurerName");

            if (treasurerPhoto && item.photo_url) {
                treasurerPhoto.src = item.photo_url;
            }

            if (treasurerName) {
                treasurerName.innerText = item.name;
            }
        }

        if (position === "organiser") {

            const organiserPhoto = document.getElementById("organiserPhoto");
            const organiserName = document.getElementById("organiserName");

            if (organiserPhoto && item.photo_url) {
                organiserPhoto.src = item.photo_url;
            }

            if (organiserName) {
                organiserName.innerText = item.name;
            }
        }

    });

}
async function loadDashboardStats() {

    // Total Members
    const { data: members } = await db
        .from("members")
        .select("*");

    const totalMembers =
document.getElementById("totalMembers");

if (totalMembers) {
    totalMembers.innerText =
        members ? members.length : 0;
}

    // Pending Members
    const { data: pending } = await db
        .from("members")
        .select("*")
        .eq("status", "pending");

     
    // Total Savings
    const { data: contributions } = await db
        .from("contributions")
        .select("amount");

    let totalSavings = 0;

    (contributions || []).forEach(item => {
        totalSavings += Number(item.amount || 0);
    });

    const totalSavingsElement = document.getElementById("totalSavings");

if (totalSavingsElement) {
    totalSavingsElement.innerText =
        "KSh " + totalSavings.toLocaleString();
}
}
loadDashboardStats();
async function viewHistory(phone, name) {

    const { data, error } = await db
        .from("contributions")
        .select("*")
        .eq("member_phone", phone)
        .order("created_at", { ascending: false });

    if (error) {
        alert(error.message);
        return;
    }

    let historyText =
        "Contribution History for " + name + "\n\n";

    if (!data || data.length === 0) {

        historyText += "No contributions found.";

    } else {

        data.forEach(item => {

            historyText +=
                "KSh " + item.amount +
                " - " +
                new Date(item.created_at)
                    .toLocaleDateString()
                + "\n";
        });
    }

    alert(historyText);
}
function searchMembers() {

    const search =
        document.getElementById("memberSearch")
        .value
        .toLowerCase();

    const cards =
        document.querySelectorAll(".member-card");

    cards.forEach(card => {

        const text =
            card.innerText.toLowerCase();

        if (text.includes(search)) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }

    });
}
async function addActivity(action) {

    const { error } = await db
        .from("activity_logs")
        .insert([
            {
                admin_name: "Admin",
                action: action
            }
        ]);

    if (error) {
        console.log(error.message);
    }
}
async function loadOnlineCount() {

    const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();

const { data, error } = await db
    .from("members")
    .select("*")
    .eq("online", true)
    .gte("last_seen", thirtySecondsAgo);
    
    if (error) return;

    // Dashboard counter
    const onlineCount =
        document.getElementById("onlineMembers");

    if (onlineCount) {
        onlineCount.innerText = data.length;
    }

    // Online Members page
    const list =
        document.getElementById("onlineMembersList");

    if (!list) return;

    list.innerHTML = "";

    if (data.length === 0) {

        list.innerHTML = `
        <div class="member-card">
            <h3>No members online</h3>
        </div>
        `;
        return;
    }

    data.forEach(member => {

        list.innerHTML += `
        <div class="member-card">
            <h3>${member.name}</h3>
            <p>${member.phone}</p>
            <p>🟢 Online</p>
        </div>
        `;

    });

}

async function loadLeaderboard() {

    console.log("Leaderboard function running");

    const container =
        document.getElementById("leaderboardContainer");

    if (!container) {
        console.log("Container not found");
        return;
    }

    console.log("Container found");

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
            name: member.name,
            total: total
        });
    }

    rankings.sort((a, b) => b.total - a.total);

    container.innerHTML = "";

    rankings.forEach((member, index) => {

        let medal = "";

        if (index === 0) medal = "🥇";
        else if (index === 1) medal = "🥈";
        else if (index === 2) medal = "🥉";
        else medal = "#" + (index + 1);

        container.innerHTML += `
        <div class="leaderboard-card">
            <h3>${medal} ${member.name}</h3>
            <p>KSh ${member.total.toLocaleString()}</p>
        </div>
        `;
    });
}
async function loadHomeStats() {

    const memberCountElement = document.getElementById("memberCount");
    const totalContributionsElement = document.getElementById("totalContributions");

    // If we're not on the home page, stop.
    if (!memberCountElement || !totalContributionsElement) {
        return;
    }

    const { count: memberCount } = await db
        .from("members")
        .select("*", { count: "exact", head: true });

    memberCountElement.innerText = memberCount || 0;

    const { data } = await db
        .from("contributions")
        .select("amount");

    let total = 0;

    (data || []).forEach(item => {
        total += Number(item.amount || 0);
    });

    totalContributionsElement.innerText =
        "KSh " + total.toLocaleString();
}
if (
    document.getElementById("memberCount") &&
    document.getElementById("totalContributions")
) {
    loadHomeStats();
}
function logout() {

    const user = JSON.parse(localStorage.getItem("loggedUser"));

    if (user) {
        db.from("members")
          .update({
              online: false,
              last_seen: new Date().toISOString()
          })
          .eq("phone", user.phone);
    }

    localStorage.removeItem("loggedUser");
    sessionStorage.removeItem("adminVerified");

    window.location.href = "login.html";
}async function loadPendingContributions() {

    const container = document.getElementById("pendingContributions");

    if (!container) return;

    container.innerHTML = "Loading...";

    const { data, error } = await db
        .from("pending_contributions")
        .select("*")
        .eq("status", "Pending")
        .order("created_at", { ascending: false });

    if (error) {
        container.innerHTML = "Failed to load requests.";
        return;
    }

    if (!data.length) {
        container.innerHTML = "<p>No pending contributions.</p>";
        return;
    }

    container.innerHTML = "";

    data.forEach(item => {

        container.innerHTML += `

        <div class="card">

            <h3>${item.member_name}</h3>

            <p><strong>Phone:</strong> ${item.phone}</p>

            <p><strong>Amount:</strong> KSh ${item.amount}</p>

            <button class="btn"
                onclick="approveContribution(${item.id})">
                ✅ Approve
            </button>

            <button class="btn"
                onclick="rejectContribution(${item.id})">
                ❌ Reject
            </button>

        </div>

        `;
    });

}

document.addEventListener("DOMContentLoaded", () => {
    loadPendingContributions();
});