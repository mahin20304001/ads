const form = document.getElementById("loveForm");
const scoreEl = document.getElementById("loveScore");
const msgEl = document.getElementById("loveMsg");

function setMsg(text, type = "") {
  if (!msgEl) return;
  msgEl.textContent = text || "";
  msgEl.className = "message";
  if (type) msgEl.classList.add(type);
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function computeLove(a, b) {
  const key = `${String(a).trim().toLowerCase()}|${String(b).trim().toLowerCase()}`;
  const h = hashString(key);
  const base = (h % 101); // 0-100
  // keep it in a nicer range
  return clamp(base, 10, 99);
}

function messageFor(score) {
  if (score >= 90) return "Perfect match!";
  if (score >= 75) return "Strong connection!";
  if (score >= 55) return "Good vibe!";
  if (score >= 35) return "Could work!";
  return "Needs more love!";
}

function onSubmit(e) {
  e.preventDefault();
  setMsg("");

  const a = form.a.value;
  const b = form.b.value;

  if (!String(a).trim() || !String(b).trim()) {
    setMsg("Please enter both names.", "error");
    return;
  }

  const score = computeLove(a, b);
  if (scoreEl) scoreEl.textContent = `${score}%`;
  setMsg(messageFor(score), "success");
}

if (form) form.addEventListener("submit", onSubmit);

