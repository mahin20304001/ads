const LINKS = [
  "https://omg10.com/4/9919097",
  "https://omg10.com/4/9910698",
  "https://omg10.com/4/9919093",
  "https://omg10.com/4/9887192",
  "https://omg10.com/4/9919106",
  "https://omg10.com/4/9919096",
  "https://omg10.com/4/9904168",
  "https://omg10.com/4/9910699",
  "https://omg10.com/4/9919095",
  "https://omg10.com/4/9879421",
  "https://omg10.com/4/9919104",
  "https://omg10.com/4/9910700",
  "https://omg10.com/4/9910707",
  "https://omg10.com/4/9919094",
  "https://omg10.com/4/9919108",
  "https://omg10.com/4/9910708",
  "https://omg10.com/4/9910708",
  "https://omg10.com/4/9910706",
  "https://omg10.com/4/9919088",
  "https://omg10.com/4/9910697",
];

const earnBtn = document.getElementById("earnBtn");
const earnPoints = document.getElementById("earnPoints");
const earnNext = document.getElementById("earnNext");

function getWallet() {
  return window.Wallet;
}

function safeIndex(idx) {
  const n = LINKS.length;
  if (n === 0) return 0;
  return ((idx % n) + n) % n;
}

function renderEarnUi() {
  const wallet = getWallet();
  const points = wallet?.getPoints ? wallet.getPoints() : 0;
  const idx = wallet?.getEarnIndex ? safeIndex(wallet.getEarnIndex()) : 0;

  if (earnPoints) {
    earnPoints.textContent = String(points);
  }
  if (earnNext) {
    earnNext.textContent = `${idx + 1}/${LINKS.length}`;
  }
}

function handleEarnClick() {
  const wallet = getWallet();
  const currentIdx = wallet?.getEarnIndex ? safeIndex(wallet.getEarnIndex()) : 0;
  const url = LINKS[currentIdx];

  if (wallet?.addPoints) {
    wallet.addPoints(1);
  }

  if (wallet?.setEarnIndex) {
    wallet.setEarnIndex(currentIdx + 1);
  }

  renderEarnUi();

  if (url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

if (earnBtn) {
  earnBtn.addEventListener("click", handleEarnClick);
}

renderEarnUi();

