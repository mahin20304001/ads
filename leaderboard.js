const USERS_KEY = "authflow_users";

const FAKE_COUNT = 50;
const TOTAL_LIMIT = 100;
const FAKE_INCREMENT = 500;
const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const listEl = document.getElementById("lbList");
const timerEl = document.getElementById("lbTimer");

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function choice(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function makeFakeName() {
  const first = [
    "Ayaan",
    "Rafi",
    "Sami",
    "Nafis",
    "Fahim",
    "Tahsin",
    "Arif",
    "Sakib",
    "Riyad",
    "Hasan",
    "Nayeem",
    "Sohan",
    "Imran",
    "Shanto",
    "Ridoy",
    "Nabil",
    "Shafin",
    "Asif",
    "Mehedi",
    "Tanvir",
  ];
  const last = [
    "Khan",
    "Hossain",
    "Ahmed",
    "Rahman",
    "Islam",
    "Chowdhury",
    "Sarker",
    "Miah",
    "Nayem",
    "Mahmud",
    "Roy",
    "Das",
    "Saha",
  ];
  return `${choice(first)} ${choice(last)}`;
}

function fakeStorageKey() {
  return "authflow_leaderboard_fake_users";
}

function fakeLastTickKey() {
  return "authflow_leaderboard_fake_last_tick";
}

function loadFakeUsers() {
  try {
    const data = JSON.parse(localStorage.getItem(fakeStorageKey()) || "null");
    if (Array.isArray(data) && data.length >= FAKE_COUNT) return data.slice(0, FAKE_COUNT);
  } catch {
    // ignore
  }

  const users = Array.from({ length: FAKE_COUNT }).map((_, i) => {
    const base = randInt(1100, 9000);
    const boost = (FAKE_COUNT - i) * randInt(10, 45);
    return {
      id: `fake-${Date.now()}-${i}-${Math.random().toString(16).slice(2)}`,
      name: makeFakeName(),
      points: base + boost,
    };
  });

  localStorage.setItem(fakeStorageKey(), JSON.stringify(users));
  localStorage.setItem(fakeLastTickKey(), String(Date.now()));
  return users;
}

function applyFakeTicks(fakeUsers) {
  const now = Date.now();
  const last = Number(localStorage.getItem(fakeLastTickKey()) || 0);
  const safeLast = Number.isFinite(last) && last > 0 ? last : now;
  const elapsed = Math.max(0, now - safeLast);
  const ticks = Math.floor(elapsed / INTERVAL_MS);

  if (ticks <= 0) return fakeUsers;

  const updated = fakeUsers.map((u) => ({ ...u, points: u.points + ticks * FAKE_INCREMENT }));
  localStorage.setItem(fakeStorageKey(), JSON.stringify(updated));
  localStorage.setItem(fakeLastTickKey(), String(safeLast + ticks * INTERVAL_MS));
  return updated;
}

function getAllRegisteredUsers() {
  try {
    const data = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function pointsKey(email) {
  return `authflow_wallet_points:${String(email || "").toLowerCase()}`;
}

function getUserPointsByEmail(email) {
  const raw = localStorage.getItem(pointsKey(email));
  const num = Number(raw);
  return Number.isFinite(num) && num >= 0 ? num : 0;
}

function getRealUsers() {
  const registered = getAllRegisteredUsers();
  const uniqueByEmail = new Map();
  for (const u of registered) {
    const email = String(u?.email || "").toLowerCase();
    if (!email) continue;
    if (!uniqueByEmail.has(email)) {
      uniqueByEmail.set(email, {
        id: `real-${email}`,
        name: u?.name ? String(u.name) : email,
        email,
        points: getUserPointsByEmail(email),
      });
    }
  }
  return Array.from(uniqueByEmail.values()).sort((a, b) => b.points - a.points);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderLeaderboard() {
  if (!listEl) return;

  let fake = loadFakeUsers();
  fake = applyFakeTicks(fake);
  fake.sort((a, b) => b.points - a.points);

  const real = getRealUsers();
  const combined = [
    ...fake.map((u) => ({ ...u, type: "fake" })),
    ...real.map((u) => ({ ...u, type: "real" })),
  ].slice(0, TOTAL_LIMIT);

  listEl.innerHTML = combined
    .map((u, idx) => {
      const rank = idx + 1;
      return `
        <div class="wallet-card lb-row">
          <div class="lb-left">
            <div class="lb-rank">#${rank}</div>
            <div class="lb-name">${escapeHtml(u.name)}</div>
          </div>
          <div class="lb-right">
            <div class="lb-points">${Number(u.points).toLocaleString()} pts</div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderTimer() {
  if (!timerEl) return;
  const now = Date.now();
  const last = Number(localStorage.getItem(fakeLastTickKey()) || now);
  const safeLast = Number.isFinite(last) && last > 0 ? last : now;
  const next = safeLast + INTERVAL_MS;
  const msLeft = Math.max(0, next - now);
  const totalSeconds = Math.ceil(msLeft / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  timerEl.textContent = `${m}m ${String(s).padStart(2, "0")}s`;
}

renderLeaderboard();
renderTimer();

setInterval(() => {
  renderTimer();
}, 1000);

setInterval(() => {
  renderLeaderboard();
}, 5000);

