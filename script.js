
console.log("DB:", db);
async function addMember() {

    const name = document.getElementById("memberName").value;
    const phone = document.getElementById("memberPhone").value;
const password =
    document.getElementById("memberPassword").value;


    console.log("Supabase object:", supabase);

    try {

        const { error } = await db
            .from("members")
            .insert([
                {
    name: name,
    phone: phone,
    password: password,
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
    }
}
async function loadStats() {

    const { count: memberCount } = await db
        .from("members")
        .select("*", { count: "exact", head: true });

    document.getElementById("memberCount").innerText =
        memberCount || 0;

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

    document.getElementById("totalContributions").innerText =
        "KSh " + total.toLocaleString();
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
loadGroupSavings();
loadPendingMembers();
loadAnnouncements();
loadAnnouncementsList();
loadLeadership();
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
    }
}async function loadPendingMembers() {

    const { data, error } = await db
        .from("members")
        .select("*")
        .eq("status", "pending");

    if (error) {
        alert(error.message);
        return;
    }

    const body =
        document.getElementById("pendingMembersBody");

    if (!body) return;

    body.innerHTML = "";
if (!data || data.length === 0) {

    body.innerHTML = `
        <div class="member-card">
            <h3>No Pending Members</h3>
            <p>All members have been approved.</p>
        </div>
    `;

    return;
}
data.forEach(member => {
        
    body.innerHTML += `
    <div class="member-card">
        <h3>${member.name}</h3>
        <p>${member.phone}</p>
        <p>Status: ${member.status}</p>

        <button onclick="approveMember('${member.phone}')"
                class="btn">
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
function logout() {

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
            <h3>${item.title}</h3>
            <p>${item.message}</p>
        </div>
        `;
    });

}
async function addAnnouncement() {

    const title =
        document.getElementById("announcementTitle").value;

    const message =
        document.getElementById("announcementMessage").value;

    if (!title || !message) {
        alert("Fill all fields");
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
        alert(error.message);
    } else {

        alert("Announcement Posted");

        document.getElementById(
            "announcementTitle"
        ).value = "";

        document.getElementById(
            "announcementMessage"
        ).value = "";
    }
}
async function loadAnnouncementsList() {

    const { data, error } = await db
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        alert(error.message);
        return;
    }

    const container =
        document.getElementById("announcementsList");

    if (!container) return;

    container.innerHTML = "";

    data.forEach(item => {

        container.innerHTML += `
        <div class="card">

            <h3>${item.title}</h3>

            <p>${item.message}</p>

            <button onclick="deleteAnnouncement('${item.title}')">
    Delete
</button>

        </div>
        `;
    });
}
async function deleteAnnouncement(title) {

    const confirmDelete =
        confirm("Delete this announcement?");

    if (!confirmDelete) return;

    const { error } = await db
        .from("announcements")
        .delete()
        .eq("title", title);

    if (error) {
        alert(error.message);
    } else {
        alert("Announcement Deleted");

        loadAnnouncementsList();
    }
}
async function loadLeadership() {

    const { data, error } = await db
        .from("leadership")
        .select("*");

    console.log("Rows found:", data?.length);

    if (error) {
        alert(error.message);
        return;
    }
    if (error) {
        alert(error.message);
        return;
    }

    data.forEach(item => {

    const position =
        item.position.toLowerCase().trim();

    if (position === "chairman") {

    document.getElementById("chairmanName").innerText =
        item.name;

    if (item.photo_url) {
        document.getElementById("chairmanPhoto").src =
            item.photo_url;
    }

}

    if (position === "secretary") {

    document.getElementById("secretaryName").innerText =
        item.name;

    if (item.photo_url) {
        document.getElementById("secretaryPhoto").src =
            item.photo_url;
    }

}

    if (position === "treasurer") {

    document.getElementById("treasurerName").innerText =
        item.name;

    if (item.photo_url) {
        document.getElementById("treasurerPhoto").src =
            item.photo_url;
    }

}

    if (position === "organiser") {

    document.getElementById("organiserName").innerText =
        item.name;

    if (item.photo_url) {
        document.getElementById("organiserPhoto").src =
            item.photo_url;
    }

}
});
}
async function loadDashboardStats() {

    // Total Members
    const { data: members } = await db
        .from("members")
        .select("*");

    document.getElementById("totalMembers").innerText =
        members ? members.length : 0;

    // Pending Members
    const { data: pending } = await db
        .from("members")
        .select("*")
        .eq("status", "pending");

    document.getElementById("pendingMembers").innerText =
        pending ? pending.length : 0;

    // Total Savings
    const { data: contributions } = await db
        .from("contributions")
        .select("amount");

    let totalSavings = 0;

    (contributions || []).forEach(item => {
        totalSavings += Number(item.amount || 0);
    });

    document.getElementById("totalSavings").innerText =
        "KSh " + totalSavings.toLocaleString();
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