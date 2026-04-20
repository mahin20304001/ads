const IQ_QUESTIONS = [
  {
    q: "Which number comes next? 2, 4, 8, 16, ?",
    options: ["18", "20", "24", "32"],
    correct: 3,
  },
  {
    q: "If ALL bloops are razzies and ALL razzies are lazzies, then ALL bloops are lazzies.",
    options: ["True", "False"],
    correct: 0,
  },
  {
    q: "Find the odd one out.",
    options: ["Apple", "Mango", "Banana", "Carrot"],
    correct: 3,
  },
  {
    q: "What is 15% of 200?",
    options: ["20", "25", "30", "35"],
    correct: 2,
  },
  {
    q: "Which word is the closest opposite of 'Expand'?",
    options: ["Grow", "Stretch", "Contract", "Extend"],
    correct: 2,
  },
];

const stepEl = document.getElementById("iqStep");
const scoreEl = document.getElementById("iqScore");
const qEl = document.getElementById("iqQ");
const optsEl = document.getElementById("iqOpts");
const msgEl = document.getElementById("iqMsg");
const restartBtn = document.getElementById("iqRestart");

let idx = 0;
let score = 0;

function setMsg(text, type = "") {
  if (!msgEl) return;
  msgEl.textContent = text || "";
  msgEl.className = "message";
  if (type) msgEl.classList.add(type);
}

function render() {
  const total = IQ_QUESTIONS.length;
  if (stepEl) stepEl.textContent = `${Math.min(idx + 1, total)}/${total}`;
  if (scoreEl) scoreEl.textContent = String(score);

  if (!qEl || !optsEl) return;

  if (idx >= total) {
    qEl.textContent = `Finished! Your score: ${score}/${total}`;
    optsEl.innerHTML = "";
    setMsg(score >= 4 ? "Excellent!" : score >= 3 ? "Good!" : "Try again!", "success");
    return;
  }

  const item = IQ_QUESTIONS[idx];
  qEl.textContent = item.q;
  optsEl.innerHTML = item.options
    .map((opt, i) => {
      return `<button class="ghost-btn" type="button" data-i="${i}" style="width: 100%;">${opt}</button>`;
    })
    .join("");
}

function handleOptionClick(e) {
  const btn = e.target.closest("button[data-i]");
  if (!btn) return;
  if (idx >= IQ_QUESTIONS.length) return;

  const choice = Number(btn.dataset.i);
  const correct = IQ_QUESTIONS[idx].correct;

  if (choice === correct) {
    score += 1;
    setMsg("Correct!", "success");
  } else {
    setMsg("Wrong!", "error");
  }

  idx += 1;
  render();
}

function restart() {
  idx = 0;
  score = 0;
  setMsg("");
  render();
}

if (optsEl) optsEl.addEventListener("click", handleOptionClick);
if (restartBtn) restartBtn.addEventListener("click", restart);

render();

