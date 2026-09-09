/* RIHULA Community Chat — standalone page */
(function () {
  "use strict";
  const user = JSON.parse(localStorage.getItem("loggedUser") || "null");
  if (!user) { window.location.href = "login.html"; return; }

  function escapeHtml(value) {
    return String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  }
  function time(value) { const d=new Date(value); return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}); }
  function day(value) { const d=new Date(value), n=new Date(); if(Number.isNaN(d.getTime())) return ""; if(d.toDateString()===n.toDateString()) return "Today"; const y=new Date(n); y.setDate(n.getDate()-1); if(d.toDateString()===y.toDateString()) return "Yesterday"; return d.toLocaleDateString([], {day:"numeric",month:"short",year:d.getFullYear()===n.getFullYear()?undefined:"numeric"}); }
  function mine(item) { return String(item.name||"").trim().toLowerCase()===String(user.name||"").trim().toLowerCase(); }
  function notify(message) { if(typeof showPopup==="function") showPopup(message); else console.info(message); }

  async function ready(){ try { await window.waitForRihulaDb(); return true; } catch(e){ notify("RIHULA database is still connecting. Please try again."); return false; } }

  async function loadMessages(forceBottom=false){
    if(!await ready()) return;
    const box=document.getElementById("chatMessages"); if(!box) return;
    const near=box.scrollHeight-box.scrollTop-box.clientHeight<90;
    const {data,error}=await db.from("messages").select("*").order("created_at",{ascending:true});
    if(error){console.error(error);notify(error.message);return;}
    box.innerHTML=""; let last="";
    (data||[]).forEach(item=>{
      const d=day(item.created_at); if(d&&d!==last){box.insertAdjacentHTML("beforeend",`<div class="chat-date-divider">${escapeHtml(d)}</div>`);last=d;}
      const isMine=mine(item), audio=item.audio_url?`<audio class="chat-audio" controls preload="metadata"><source src="${escapeHtml(item.audio_url)}"></audio>`:`<p>${escapeHtml(item.message||"")||"🎤 Voice message"}</p>`;
      const actions=isMine&&item.id!=null?`<div class="message-actions"><button type="button" onclick="copyMessage(${JSON.stringify(String(item.message||""))})">📋 Copy</button><button type="button" class="danger" onclick="deleteMessage(${JSON.stringify(String(item.id))})">🗑 Delete</button></div>`:"";
      box.insertAdjacentHTML("beforeend",`<div class="chat-message ${isMine?"my-msg":"other-msg"}"><div class="chat-header"><img src="${escapeHtml(item.photo_url||"images/logo.jpg")}" class="chat-avatar" alt=""><h4>${escapeHtml(item.name||"Member")}</h4></div>${audio}<div class="chat-footer"><span class="chat-time">${escapeHtml(time(item.created_at))}</span>${isMine?`<span class="chat-status">${item.status==="read"?"✓✓":"✓"}</span>`:""}</div>${actions}</div>`);
    });
    if(forceBottom||near) requestAnimationFrame(()=>box.scrollTop=box.scrollHeight);
  }

  async function loadOnlineMembers(){
    if(!await ready()) return;
    const box=document.getElementById("onlineMembers"); if(!box)return;
    const {data,error}=await db.from("members").select("name,photo_url,last_seen,online"); if(error)return;
    const rows=(data||[]).sort((a,b)=>(a.online?0:1)-(b.online?0:1)||String(a.name||"").localeCompare(String(b.name||"")));
    box.innerHTML=rows.map(m=>{const last=m.last_seen?new Date(m.last_seen):null;const on=m.online===true&&last&&!Number.isNaN(last.getTime())&&Date.now()-last.getTime()<300000;const first=escapeHtml(String(m.name||"Member").split(/\s+/)[0]);return `<button type="button" class="online-user" title="${escapeHtml(m.name||"Member")}"><div><img src="${escapeHtml(m.photo_url||"images/logo.jpg")}" class="online-avatar" alt="">${on?'<span class="online-dot"></span>':''}</div><small>${first}</small></button>`;}).join("");
    const summary=document.getElementById("chatOnlineSummary"); if(summary){const c=rows.filter(m=>m.online===true&&m.last_seen&&Date.now()-new Date(m.last_seen).getTime()<300000).length;summary.textContent=`${rows.length} member${rows.length===1?"":"s"} • ${c} online`;}
  }

  async function sendMessage(){
    if(!await ready())return;const input=document.getElementById("chatMessage"),btn=document.querySelector(".chatInput button"),message=input?.value.trim();if(!message)return;if(message.length>2000){notify("Message is too long. Maximum 2000 characters.");return;}
    btn.disabled=true;btn.textContent="…";const {error}=await db.from("messages").insert([{name:user.name,message,status:"✓",photo_url:user.photo_url||""}]);
    if(error)notify(error.message);else{input.value="";await loadMessages(true);}btn.disabled=false;btn.textContent="Send";
  }
  async function copyMessage(text){try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(text);else{const a=document.createElement("textarea");a.value=text;a.style.position="fixed";a.style.opacity="0";document.body.appendChild(a);a.select();document.execCommand("copy");a.remove();}notify("Message copied");}catch(e){notify("Could not copy the message");}}
  async function deleteMessage(id){if(typeof showConfirm==="function"&&!await showConfirm("Delete this message? This cannot be undone.",{title:"Delete message",confirmText:"Delete",danger:true}))return;const {error}=await db.from("messages").delete().eq("id",id);if(error)notify(error.message);else loadMessages(true);}
  window.loadMessages=loadMessages;window.loadOnlineMembers=loadOnlineMembers;window.sendMessage=sendMessage;window.copyMessage=copyMessage;window.deleteMessage=deleteMessage;
  document.getElementById("chatMessage")?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();sendMessage();}});
  loadMessages(true);loadOnlineMembers();setInterval(()=>{loadMessages(false);loadOnlineMembers();},5000);
})();
