/**
 * ============================================================================
 * MUKHLIS FARHAN — DIGITAL BUSINESS CARD & PORTFOLIO CONFIGURATION
 * ============================================================================
 * Update `PORTFOLIO_DATA` below anytime to change contact details, live links,
 * or operations snapshot photos.
 */

const PORTFOLIO_DATA = {
  profile: {
    fullName: "Mukhlis Farhan",
    title: "Founder & Managing Director",
    company: "Farhan Gold & Mining Trading Group",
    phoneDisplay: "+233 24 000 0000",
    phoneDial: "+233240000000",
    whatsappNumber: "233240000000", // Digits only with country code
    email: "mukhlis@mukhlisfarhantrading.com",
    location: "Accra, Ghana"
  },

  goldMarket: {
    defaultSpotUsdPerOz: 2684.50,
    purities: {
      "24K": { label: "24K (99.9%)", factor: 1.0 },
      "23K": { label: "23K (95.8%)", factor: 0.958 },
      "22K": { label: "22K (91.6%)", factor: 0.916 },
      "18K": { label: "18K (75.0%)", factor: 0.750 }
    }
  },

  // Horizontal Swipeable Operations Reel (Gold Trading & Mining Equipment)
  highlights: [
    {
      tag: "QWIK-GOLD",
      title: "Refined 24K & 22K Bullion",
      subtitle: "Verified weight, XRF purity & instant payout",
      img: "https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=720&q=80"
    },
    {
      tag: "MACHINE MVP",
      title: "Heavy Mining Machinery",
      subtitle: "Crushers, excavators & turnkey wash plants",
      img: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=720&q=80"
    },
    {
      tag: "QWIK-GOLD",
      title: "Precision Assay & Smelting",
      subtitle: "Transparent digital ledgers for every trade",
      img: "https://images.unsplash.com/photo-1624365168968-f283d506c6b6?auto=format&fit=crop&w=720&q=80"
    },
    {
      tag: "MACHINE MVP",
      title: "Ore Processing & Site Tools",
      subtitle: "Pumps, concentrators, detectors & spares",
      img: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=720&q=80"
    }
  ]
};

let spotUsdPerOz = PORTFOLIO_DATA.goldMarket.defaultSpotUsdPerOz;
let selectedPurity = "22K";

document.addEventListener("DOMContentLoaded", () => {
  bindProfileEndpoints();
  renderHighlightsReel();
  initEstimator();
  fetchLiveGoldSpot();
});

/**
 * 1. Binds Phone, Email & WhatsApp actions from PORTFOLIO_DATA
 */
function bindProfileEndpoints() {
  const { profile } = PORTFOLIO_DATA;

  document.querySelectorAll("[data-bind='phone-link']").forEach(el => {
    el.href = `tel:${profile.phoneDial}`;
  });
  document.querySelectorAll("[data-bind='email-link']").forEach(el => {
    el.href = `mailto:${profile.email}?subject=${encodeURIComponent("Business Inquiry — Mukhlis Farhan")}`;
  });
  document.querySelectorAll("[data-bind='whatsapp-direct']").forEach(el => {
    const msg = `Hello Mr. Mukhlis Farhan, I scanned your digital business card and would like to discuss a business transaction.`;
    el.href = `https://wa.me/${profile.whatsappNumber}?text=${encodeURIComponent(msg)}`;
  });
}

/**
 * 2. Switches between the Qwik-Gold & Machine MVP Venture Spotlight views
 */
function selectVenture(division) {
  const tabGold = document.getElementById("vtab-gold");
  const tabMining = document.getElementById("vtab-mining");
  const panelGold = document.getElementById("venture-panel-gold");
  const panelMining = document.getElementById("venture-panel-mining");

  if (division === "gold") {
    tabGold.classList.add("active");
    tabGold.setAttribute("aria-selected", "true");
    tabMining.classList.remove("active");
    tabMining.setAttribute("aria-selected", "false");
    panelGold.classList.remove("hidden");
    panelMining.classList.add("hidden");
  } else {
    tabMining.classList.add("active");
    tabMining.setAttribute("aria-selected", "true");
    tabGold.classList.remove("active");
    tabGold.setAttribute("aria-selected", "false");
    panelMining.classList.remove("hidden");
    panelGold.classList.add("hidden");
  }
}

/**
 * 3. Renders the horizontal swipeable Operations Reel
 */
function renderHighlightsReel() {
  const container = document.getElementById("highlights-reel");
  if (!container) return;

  container.innerHTML = PORTFOLIO_DATA.highlights.map((item, index) => `
    <div class="reel-card" onclick="openPhotoPreview(${index})">
      <img src="${item.img}" alt="${item.title}" loading="lazy" class="reel-img" />
      <div class="p-3.5">
        <span class="eyebrow !text-[9.5px]">${item.tag}</span>
        <h3 class="text-[14px] font-bold text-[#141917] mt-1 leading-snug">${item.title}</h3>
        <p class="text-[11.5px] text-[#525B56] mt-1 leading-relaxed">${item.subtitle}</p>
      </div>
    </div>
  `).join("");
}

function openPhotoPreview(index) {
  const item = PORTFOLIO_DATA.highlights[index];
  if (!item) return;

  const img = document.getElementById("photo-sheet-img");
  const tag = document.getElementById("photo-sheet-tag");
  const title = document.getElementById("photo-sheet-title");

  if (img) img.src = item.img;
  if (tag) tag.textContent = item.tag;
  if (title) title.textContent = item.title;

  openSheet("photo-sheet");
}

/**
 * 4. Interactive Gold Desk Estimator
 */
function initEstimator() {
  const input = document.getElementById("gold-grams-input");
  const pills = document.querySelectorAll("#purity-pills .purity-pill");

  pills.forEach(btn => {
    btn.addEventListener("click", () => {
      pills.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedPurity = btn.dataset.purity;
      updateEstimatorUI();
    });
  });

  if (input) {
    input.addEventListener("input", updateEstimatorUI);
  }
  updateEstimatorUI();
}

function updateEstimatorUI() {
  const input = document.getElementById("gold-grams-input");
  const grams = parseFloat(input?.value) || 0;
  const purityObj = PORTFOLIO_DATA.goldMarket.purities[selectedPurity] || PORTFOLIO_DATA.goldMarket.purities["22K"];

  const perGram24K = spotUsdPerOz / 31.1034768;
  const perGramSelected = perGram24K * purityObj.factor;
  const totalUsd = grams * perGramSelected;

  const heroSpot = document.getElementById("hero-spot-price");
  const gramBadge = document.getElementById("calc-gram-badge");
  const rateLine = document.getElementById("calc-selected-rate");
  const totalOut = document.getElementById("calc-output-usd");

  if (heroSpot) {
    heroSpot.textContent = `$${spotUsdPerOz.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (gramBadge) {
    gramBadge.textContent = `$${perGram24K.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / g`;
  }
  if (rateLine) {
    rateLine.textContent = `${purityObj.label} • $${perGramSelected.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/g`;
  }
  if (totalOut) {
    totalOut.textContent = `$${totalUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

async function fetchLiveGoldSpot() {
  try {
    const res = await fetch("https://api.gold-api.com/price/XAU", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.price === "number" && data.price > 1000) {
        spotUsdPerOz = data.price;
        updateEstimatorUI();
      }
    }
  } catch (err) {
    // Graceful fallback to configured spot rate
  }
}

/**
 * 5. Downloads .vcf Contact Card for 1-Tap Phone Save
 */
function downloadVCard() {
  const { profile } = PORTFOLIO_DATA;
  const vcard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${profile.fullName}`,
    "N:Farhan;Mukhlis;;;",
    `ORG:${profile.company}`,
    `TITLE:${profile.title}`,
    `TEL;TYPE=CELL,VOICE,MSG:${profile.phoneDial}`,
    `EMAIL;TYPE=WORK,INTERNET:${profile.email}`,
    `ADR;TYPE=WORK:;;${profile.location};;;;`,
    `URL:${window.location.href}`,
    "NOTE:Gold Buying & Selling (Qwik-Gold) and Mining Materials, Tools & Machinery (Machine MVP).",
    "END:VCARD"
  ].join("\r\n");

  const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Mukhlis_Farhan.vcf";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast("Contact card saved (.vcf)!");
}

/**
 * 6. Direct WhatsApp & Estimator Actions
 */
function openWhatsAppWithContext(topic) {
  closeSheet("inquiry-sheet");
  const { profile } = PORTFOLIO_DATA;
  const msg = `Hello Mr. Mukhlis Farhan,\n\nI scanned your digital portfolio card and would like to inquire about:\n*${topic}*\n\nPlease let me know how we can proceed.`;
  window.open(`https://wa.me/${profile.whatsappNumber}?text=${encodeURIComponent(msg)}`, "_blank");
}

function sendEstimatorToWhatsApp() {
  const grams = document.getElementById("gold-grams-input")?.value || "100";
  const purityObj = PORTFOLIO_DATA.goldMarket.purities[selectedPurity];
  const totalOut = document.getElementById("calc-output-usd")?.textContent || "";

  const { profile } = PORTFOLIO_DATA;
  const msg = `Hello Mr. Mukhlis Farhan,\n\nI used the Qwik-Gold Estimator on your digital card:\n• Weight: *${grams} grams*\n• Purity: *${purityObj?.label || selectedPurity}*\n• Benchmark Value: *${totalOut}*\n\nPlease share your current desk rate.`;
  window.open(`https://wa.me/${profile.whatsappNumber}?text=${encodeURIComponent(msg)}`, "_blank");
}

/**
 * 7. Bottom Sheet Modals (QR Pass, Deal Drawer, Photo Preview) & Share
 */
function openSheet(id) {
  const sheet = document.getElementById(id);
  if (!sheet) return;

  if (id === "qr-sheet") {
    const qrImg = document.getElementById("qr-pass-img");
    if (qrImg) {
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&color=141917&bgcolor=FAF8F4&data=${encodeURIComponent(window.location.href)}`;
    }
  }
  sheet.classList.add("open");
}

function closeSheet(id) {
  const sheet = document.getElementById(id);
  if (sheet) sheet.classList.remove("open");
}

async function shareCard() {
  const { profile } = PORTFOLIO_DATA;
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${profile.fullName} — Digital Portfolio`,
        text: `${profile.fullName} | Gold Trading (Qwik-Gold) & Mining Equipment (Machine MVP)`,
        url: window.location.href
      });
      return;
    } catch (e) {}
  }

  try {
    await navigator.clipboard.writeText(window.location.href);
    showToast("Portfolio link copied!");
  } catch (e) {
    openSheet("qr-sheet");
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  const msg = document.getElementById("toast-msg");
  if (!toast || !msg) return;

  msg.textContent = message;
  toast.classList.remove("opacity-0", "pointer-events-none", "translate-y-3");
  toast.classList.add("opacity-100", "translate-y-0");

  setTimeout(() => {
    toast.classList.add("opacity-0", "pointer-events-none", "translate-y-3");
    toast.classList.remove("opacity-100", "translate-y-0");
  }, 2800);
}
