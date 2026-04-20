const GAME_SECONDS = 20;
const BEST_KEY = "authflow_game_best_tapdot";

const arena = document.getElementById("gameArena");
const dot = document.getElementById("dot");
const timeEl = document.getElementById("gameTime");
const scoreEl = document.getElementById("gameScore");
const bestEl = document.getElementById("gameBest");
const msgEl = document.getElementById("gameMsg");
const startBtn = document.getElementById("startGameBtn");
const resetBtn = document.getElementById("resetGameBtn");

let playing = false;
let score = 0;
let remaining = GAME_SECONDS;
let tickTimer = null;

function setMsg(text, type = "") {
  if (!msgEl) return;
  msgEl.textContent = text || "";
  msgEl.className = "message";
  if (type) msgEl.classList.add(type);
}

function getBest() {
  const n = Number(localStorage.getItem(BEST_KEY) || 0);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function setBest(n) {
  const safe = Math.max(0, Math.floor(Number(n) || 0));
  localStorage.setItem(BEST_KEY, String(safe));
  return safe;
}

function renderHud() {
  if (timeEl) timeEl.textContent = `${remaining}s`;
  if (scoreEl) scoreEl.textContent = String(score);
  if (bestEl) bestEl.textContent = String(getBest());
}

function arenaBounds() {
  const rect = arena.getBoundingClientRect();
  const padding = 8;
  const dotSize = 44;
  return {
    minX: padding,
    minY: padding,
    maxX: Math.max(padding, rect.width - dotSize - padding),
    maxY: Math.max(padding, rect.height - dotSize - padding),
  };
}

function moveDotRandom() {
  if (!arena || !dot) return;
  const b = arenaBounds();
  const x = b.minX + Math.random() * (b.maxX - b.minX);
  const y = b.minY + Math.random() * (b.maxY - b.minY);
  dot.style.left = `${x}px`;
  dot.style.top = `${y}px`;
}

function stopGame() {
  playing = false;
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }

  const best = getBest();
  if (score > best) {
    setBest(score);
    setMsg("New best score!", "success");
  } else {
    setMsg("Game over. Try again!", "success");
  }
  renderHud();
}

function startGame() {
  if (playing) return;
  playing = true;
  score = 0;
  remaining = GAME_SECONDS;
  setMsg("Go!", "success");
  renderHud();
  moveDotRandom();

  tickTimer = setInterval(() => {
    remaining -= 1;
    renderHud();
    if (remaining <= 0) {
      stopGame();
    }
  }, 1000);
}

function handleDotClick() {
  if (!playing) {
    setMsg("Press Start first.", "error");
    return;
  }
  score += 1;
  renderHud();
  moveDotRandom();
}

function resetBest() {
  setBest(0);
  renderHud();
  setMsg("Best score reset.", "success");
}

if (dot) dot.addEventListener("click", handleDotClick);
if (startBtn) startBtn.addEventListener("click", startGame);
if (resetBtn) resetBtn.addEventListener("click", resetBest);

window.addEventListener("resize", () => moveDotRandom());

renderHud();
moveDotRandom();

