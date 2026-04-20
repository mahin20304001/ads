const SESSION_KEY = "authflow_current_user";
const CHAT_MESSAGES_KEY = "authflow_room_messages";
const USERS_KEY = "authflow_users";
const FRIENDS_KEY = "authflow_friends_map";

const chatList = document.getElementById("chatList");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessage = document.getElementById("chatMessage");
const chatPhotoInput = document.getElementById("chatPhotoInput");
const chatPhotoPreview = document.getElementById("chatPhotoPreview");
const chatPhotoPreviewImg = document.getElementById("chatPhotoPreviewImg");
const chatRemovePhotoBtn = document.getElementById("chatRemovePhotoBtn");
const chatUserSelect = document.getElementById("chatUserSelect");

let selectedPhotoData = "";
let selectedTargetEmail = "";
let liveConversationMessages = [];
let unsubscribeConversation = null;

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function setMessage(text, type = "") {
  if (!chatMessage) return;
  chatMessage.textContent = text;
  chatMessage.className = "message";
  if (type) chatMessage.classList.add(type);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function loadMessages() {
  try {
    const list = JSON.parse(localStorage.getItem(CHAT_MESSAGES_KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function loadUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

function loadFriendsMap() {
  try {
    const map = JSON.parse(localStorage.getItem(FRIENDS_KEY) || "{}");
    return typeof map === "object" && map ? map : {};
  } catch {
    return {};
  }
}

function saveMessages(list) {
  localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(list));
}

function formatTime(iso) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "Now";
  return new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function setPhotoPreview(dataUrl) {
  selectedPhotoData = dataUrl || "";
  if (!chatPhotoPreview || !chatPhotoPreviewImg) return;
  if (!selectedPhotoData) {
    chatPhotoPreview.classList.add("hidden");
    chatPhotoPreviewImg.removeAttribute("src");
    return;
  }
  chatPhotoPreviewImg.src = selectedPhotoData;
  chatPhotoPreview.classList.remove("hidden");
}

function isConversationMessage(item, myEmail, targetEmail) {
  const from = String(item?.authorEmail || "").toLowerCase();
  const to = String(item?.targetEmail || "").toLowerCase();
  if (!from || !to || !myEmail || !targetEmail) return false;
  return (from === myEmail && to === targetEmail) || (from === targetEmail && to === myEmail);
}

function renderUserSelector() {
  if (!chatUserSelect) return;
  const currentUser = getCurrentUser();
  const myEmail = String(currentUser?.email || "").toLowerCase();
  const users = loadUsers()
    .map((u) => ({
      name: String(u?.name || "").trim(),
      email: String(u?.email || "").trim().toLowerCase(),
    }))
    .filter((u) => u.email && u.email !== myEmail);
  const friendsMap = loadFriendsMap();
  const friendEmails = Array.isArray(friendsMap[myEmail]) ? friendsMap[myEmail] : [];

  const unique = new Map();
  for (const user of users) {
    if (friendEmails.includes(user.email) && !unique.has(user.email)) {
      unique.set(user.email, user);
    }
  }
  const list = Array.from(unique.values()).sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));

  if (list.length === 0) {
    selectedTargetEmail = "";
    chatUserSelect.innerHTML = `<option value="">No friends available</option>`;
    chatUserSelect.disabled = true;
    return;
  }

  chatUserSelect.disabled = false;
  if (!selectedTargetEmail || !list.some((u) => u.email === selectedTargetEmail)) {
    selectedTargetEmail = list[0].email;
  }

  chatUserSelect.innerHTML = list
    .map((u) => {
      const selected = u.email === selectedTargetEmail ? "selected" : "";
      const label = escapeHtml(u.name || u.email);
      return `<option value="${escapeHtml(u.email)}" ${selected}>${label}</option>`;
    })
    .join("");
}

function renderMessages() {
  if (!chatList) return;
  const currentUser = getCurrentUser();
  const currentEmail = String(currentUser?.email || "").toLowerCase();
  const targetEmail = String(selectedTargetEmail || "").toLowerCase();
  const localMessages = loadMessages();
  const conversation =
    window.RealtimeAPI?.enabled
      ? liveConversationMessages
      : localMessages.filter((item) => isConversationMessage(item, currentEmail, targetEmail));

  if (!targetEmail) {
    chatList.innerHTML = `
      <div class="chat-empty">
        <p>No user selected for chat.</p>
      </div>
    `;
    return;
  }

  if (conversation.length === 0) {
    chatList.innerHTML = `
      <div class="chat-empty">
        <p>No private messages yet. Start the conversation.</p>
      </div>
    `;
    return;
  }

  chatList.innerHTML = conversation
    .slice(-250)
    .map((item) => {
      const mine = String(item.authorEmail || "").toLowerCase() === currentEmail;
      const klass = mine ? "chat-item mine" : "chat-item";
      const name = escapeHtml(item.authorName || "User");
      const text = item.text ? `<p class="chat-text">${escapeHtml(item.text)}</p>` : "";
      const photo = item.photoData
        ? `<img class="chat-photo" src="${item.photoData}" alt="Chat image from ${name}" loading="lazy" decoding="async">`
        : "";

      return `
        <article class="${klass}">
          <div class="chat-bubble">
            <div class="chat-meta">
              <strong>${name}</strong>
              <span>${formatTime(item.createdAt)}</span>
            </div>
            ${text}
            ${photo}
          </div>
        </article>
      `;
    })
    .join("");

  chatList.scrollTop = chatList.scrollHeight;
}

function subscribeRealtimeConversation() {
  if (!window.RealtimeAPI?.enabled) return;
  const me = String(getCurrentUser()?.email || "").toLowerCase();
  const target = String(selectedTargetEmail || "").toLowerCase();
  if (unsubscribeConversation) {
    unsubscribeConversation();
    unsubscribeConversation = null;
  }
  if (!me || !target) {
    liveConversationMessages = [];
    renderMessages();
    return;
  }
  unsubscribeConversation = window.RealtimeAPI.subscribePrivateConversation(me, target, (rows) => {
    liveConversationMessages = Array.isArray(rows) ? rows : [];
    renderMessages();
  });
}

function handlePhotoChange() {
  const file = chatPhotoInput?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => setPhotoPreview(String(reader.result || ""));
  reader.readAsDataURL(file);
  chatPhotoInput.value = "";
}

async function handleSend(event) {
  event.preventDefault();
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "./index.html";
    return;
  }

  const text = String(chatInput?.value || "").trim();
  const photoData = selectedPhotoData;
  const targetEmail = String(selectedTargetEmail || "").toLowerCase();
  if (!targetEmail) {
    setMessage("Select a user first.", "error");
    return;
  }

  if (!text && !photoData) {
    setMessage("Write a message or add a photo.", "error");
    return;
  }

  const list = loadMessages();
  const messageItem = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    authorName: user.name || "User",
    authorEmail: String(user.email || "").toLowerCase(),
    targetEmail,
    text: text.slice(0, 1000),
    photoData,
    createdAt: new Date().toISOString(),
  };
  list.push(messageItem);
  saveMessages(list.slice(-1000));

  if (window.RealtimeAPI?.enabled) {
    await window.RealtimeAPI.sendPrivateMessage(messageItem);
  }

  if (chatInput) chatInput.value = "";
  setPhotoPreview("");
  setMessage("Message sent.", "success");
  renderMessages();
}

const currentUser = getCurrentUser();
if (!currentUser) {
  window.location.href = "./index.html";
}

if (chatPhotoInput) {
  chatPhotoInput.addEventListener("change", handlePhotoChange);
}

if (chatRemovePhotoBtn) {
  chatRemovePhotoBtn.addEventListener("click", () => setPhotoPreview(""));
}

if (chatForm) {
  chatForm.addEventListener("submit", handleSend);
}

if (chatUserSelect) {
  chatUserSelect.addEventListener("change", (event) => {
    selectedTargetEmail = String(event.target.value || "").toLowerCase();
    subscribeRealtimeConversation();
    renderMessages();
  });
}

window.addEventListener("storage", (event) => {
  if (event.key === CHAT_MESSAGES_KEY || event.key === USERS_KEY || event.key === FRIENDS_KEY) {
    renderUserSelector();
    renderMessages();
  }
});

renderUserSelector();
subscribeRealtimeConversation();
renderMessages();
