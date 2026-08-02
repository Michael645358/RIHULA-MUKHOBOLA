const db = window.db;

console.log("Chat JS Loaded");
// Load current user
const user = JSON.parse(localStorage.getItem("loggedUser"));

if (!user) {
    window.location.href = "login.html";
}

// Load chat messages
async function loadMessages() {

    const { data, error } = await db
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {
        alert(error.message);
        return;
    }

    const container = document.getElementById("chatMessages");

    container.innerHTML = "";

    data.forEach(msg => {

        const mine = msg.name === user.name;

        container.innerHTML += `
        <div style="
            margin:10px 0;
            text-align:${mine ? "right" : "left"};
        ">
            <div style="
                display:inline-block;
                background:${mine ? "#DCF8C6" : "#fff"};
                padding:10px;
                border-radius:12px;
                max-width:80%;
            ">
                <b>${msg.name}</b><br>
                ${msg.message}
            </div>
        </div>
        `;
    });

    container.scrollTop = container.scrollHeight;
}

// Send message
async function sendMessage() {

    const input = document.getElementById("chatMessage");

    if (!input.value.trim()) return;

    const { error } = await db
        .from("messages")
        .insert([{
            name: user.name,
            message: input.value,
            photo_url: user.photo_url || "",
            status: "✓"
        }]);

    if (error) {
        alert(error.message);
        return;
    }

    input.value = "";

    loadMessages();
}

// Auto refresh
setInterval(loadMessages, 3000);

// First load
loadMessages();
// Show online members
async function loadOnlineMembers() {

    const { data, error } = await db
        .from("members")
        .select("name")
        .eq("online", true);

    if (error) return;

    const box = document.getElementById("onlineMembers");

    if (!box) return;

    box.innerHTML = "<b>🟢 Online Members</b><br>";

    if (!data || data.length === 0) {
        box.innerHTML += "No members online";
        return;
    }

    data.forEach(member => {
        box.innerHTML += `🟢 ${member.name}<br>`;
    });
}

// Refresh every 10 seconds
loadOnlineMembers();
setInterval(loadOnlineMembers, 10000);