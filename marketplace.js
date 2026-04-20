const SESSION_KEY = "authflow_current_user";
const MARKETPLACE_KEY = "authflow_marketplace_items";
const MARKETPLACE_LICENSE_KEY = "348819";

const marketForm = document.getElementById("marketForm");
const marketTitle = document.getElementById("marketTitle");
const marketPrice = document.getElementById("marketPrice");
const marketDetails = document.getElementById("marketDetails");
const marketImageInput = document.getElementById("marketImageInput");
const marketImagePreviewWrap = document.getElementById("marketImagePreviewWrap");
const marketImagePreview = document.getElementById("marketImagePreview");
const marketLicenseKey = document.getElementById("marketLicenseKey");
const marketMsg = document.getElementById("marketMsg");
const marketList = document.getElementById("marketList");

let selectedImageData = "";

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function setMessage(text, type = "") {
  if (!marketMsg) return;
  marketMsg.textContent = text || "";
  marketMsg.className = "message";
  if (type) marketMsg.classList.add(type);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function loadItems() {
  try {
    const list = JSON.parse(localStorage.getItem(MARKETPLACE_KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveItems(items) {
  localStorage.setItem(MARKETPLACE_KEY, JSON.stringify(items));
}

function setImagePreview(dataUrl) {
  selectedImageData = dataUrl || "";
  if (!marketImagePreviewWrap || !marketImagePreview) return;
  if (!selectedImageData) {
    marketImagePreviewWrap.classList.add("hidden");
    marketImagePreview.removeAttribute("src");
    return;
  }
  marketImagePreview.src = selectedImageData;
  marketImagePreviewWrap.classList.remove("hidden");
}

function handleImagePick() {
  const file = marketImageInput?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => setImagePreview(String(reader.result || ""));
  reader.readAsDataURL(file);
}

function renderItems() {
  if (!marketList) return;
  const items = loadItems();
  if (!items.length) {
    marketList.innerHTML = `<div class="wallet-empty">No products uploaded yet.</div>`;
    return;
  }

  marketList.innerHTML = items
    .slice(0, 200)
    .map((item) => {
      const image = item.imageData
        ? `<div class="post-image post-image-real"><img class="post-photo" src="${item.imageData}" alt="${escapeHtml(item.title)}" loading="lazy" decoding="async"></div>`
        : "";
      return `
        <article class="post-card market-item-card">
          ${image}
          <h4 class="market-item-title">${escapeHtml(item.title)}</h4>
          <p class="market-item-price">${escapeHtml(item.price)}</p>
          <p class="market-item-details">${escapeHtml(item.details)}</p>
          <p class="post-meta">Seller: ${escapeHtml(item.authorName || item.authorEmail || "User")}</p>
        </article>
      `;
    })
    .join("");
}

function handleSubmit(event) {
  event.preventDefault();
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "./index.html";
    return;
  }

  const title = String(marketTitle?.value || "").trim();
  const price = String(marketPrice?.value || "").trim();
  const details = String(marketDetails?.value || "").trim();
  const license = String(marketLicenseKey?.value || "").trim();

  if (!title || !price || !details || !selectedImageData || !license) {
    setMessage("Title, price, details, image and license key are required.", "error");
    return;
  }

  if (license !== MARKETPLACE_LICENSE_KEY) {
    setMessage("Invalid license key. Product was not posted.", "error");
    return;
  }

  const items = loadItems();
  items.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    authorName: user.name || "User",
    authorEmail: user.email || "",
    title: title.slice(0, 120),
    price: price.slice(0, 60),
    details: details.slice(0, 600),
    imageData: selectedImageData,
    createdAt: new Date().toISOString(),
  });
  saveItems(items);

  marketForm.reset();
  setImagePreview("");
  setMessage("Product posted to marketplace.", "success");
  renderItems();
}

if (marketImageInput) {
  marketImageInput.addEventListener("change", handleImagePick);
}

if (marketForm) {
  marketForm.addEventListener("submit", handleSubmit);
}

window.addEventListener("storage", (event) => {
  if (event.key === MARKETPLACE_KEY) renderItems();
});

renderItems();
