/**
 * ============================================================================
 * MUKHLIS FARHAN — DIGITAL BUSINESS CARD & PORTFOLIO CONFIGURATION
 * ============================================================================
 * Update `PORTFOLIO_DATA` below anytime to change contact details, default
 * GHS Goldbod / Blade rates, or operations snapshot photos.
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

  // Exact Qwik-Gold Calculator Defaults (GHS)
  qwikGoldSettings: {
    formula: "mayrocy",          // 'mayrocy' (Default in Qwik-Gold) or 'nwdgc'
    purityDiscountPercent: 0.70, // Standard Qwik-Gold 0.70% purity discount
    defaultGoldbodPriceGhs: 12500,
    defaultPricePerBladeGhs: 1100
  },

  // Horizontal Swipeable Operations Reel (Gold Trading & Mining Equipment)
  highlights: [
    {
      tag: "QWIK-GOLD",
      title: "Refined 24K & 22K Bullion",
      subtitle: "Verified weight, water-density assay & instant GHS payout",
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

/**
 * ============================================================================
 * QWIK-GOLD EXACT MATH ENGINE (Ported directly from qwik-gold/assets/js/modules/calculator.js
 * and qwik-gold/api/helpers/settings.php + api/sales/calculate.php)
 * ============================================================================
 */
const QwikGoldMath = {
  truncate2(num) {
    return Math.floor((Number(num) + 0.00000001) * 100) / 100;
  },

  round2(num) {
    return Math.round((Number(num) + 1e-12 + Number.EPSILON) * 100) / 100;
  },

  calculateRefined({ grams = 0, volume = 0, pricePerPound = 0, discountPercent = 0.70, formula = "mayrocy" }) {
    const g = parseFloat(grams) || 0;
    const v = parseFloat(volume) || 0;
    const p = parseFloat(pricePerPound) || 0;
    const disc = Math.max(0, parseFloat(discountPercent) || 0);
    const activeFormula = formula === "nwdgc" ? "nwdgc" : "mayrocy";

    // 1 Pound = 7.75g (truncated to 2 decimal places)
    const pounds = g > 0 ? this.truncate2(g / 7.75) : 0;
    const rawDensity = (g > 0 && v > 0) ? (g / v) : 0;

    let density = 0;
    let rawKarat = 0;
    let rawPurity = 0;
    let payableKarat = 0;
    let purityPercent = 0;

    if (activeFormula === "nwdgc") {
      density = rawDensity > 0 ? this.truncate2(rawDensity) : 0;
      if (density > 0) {
        rawKarat = this.truncate2(((density - 10.51) * 52.838) / density);
        rawKarat = Math.max(0, Math.min(24, rawKarat));
      }
      rawPurity = rawKarat > 0 ? Math.min(100, this.round2((rawKarat / 24) * 100)) : 0;

      const discountFactor = (100 - disc) / 100;
      if (rawKarat > 0) {
        payableKarat = disc > 0 ? this.truncate2(rawKarat * discountFactor) : rawKarat;
        payableKarat = Math.max(0, Math.min(24, payableKarat));
      }
      purityPercent = payableKarat > 0 ? Math.min(100, this.round2((payableKarat / 24) * 100)) : 0;
    } else {
      // Mayrocy Standard (Qwik-Gold Default)
      density = rawDensity > 0 ? this.round2(rawDensity) : 0;
      if (rawDensity > 0) {
        rawKarat = this.truncate2(((rawDensity - 10.51) * 52.838) / rawDensity);
        rawKarat = Math.max(0, Math.min(24, rawKarat));
      }
      rawPurity = rawKarat > 0 ? Math.min(100, this.round2((rawKarat / 24) * 100)) : 0;

      purityPercent = rawPurity > 0
        ? Math.max(0, Math.min(100, this.round2(rawPurity - disc)))
        : 0;

      payableKarat = purityPercent > 0
        ? Math.max(0, Math.min(24, this.round2((purityPercent / 100) * 24)))
        : 0;
    }

    const adjustedPricePerPound = (payableKarat > 0 && p > 0) ? this.round2((payableKarat * p) / 23) : 0;
    const totalPayout = (payableKarat > 0 && p > 0 && pounds > 0) ? Math.floor((payableKarat * p / 23) * pounds) : 0;
    const grossPayout = (rawKarat > 0 && p > 0 && pounds > 0) ? Math.floor((rawKarat * p / 23) * pounds) : 0;
    const discountSaved = Math.max(0, grossPayout - totalPayout);

    return {
      formula: activeFormula,
      grams: g,
      volume: v,
      pricePerPound: p,
      adjustedPricePerPound,
      discountPercent: disc,
      pounds,
      density,
      rawKarat,
      rawPurity,
      payableKarat,
      purityPercent,
      totalPayout,
      grossPayout,
      discountSaved
    };
  },

  calculateBalls({ grams = 0, pricePerBlade = 0 }) {
    const g = parseFloat(grams) || 0;
    const priceBlade = parseFloat(pricePerBlade) || 0;

    // 1 blade = 0.8g, 1 match = 0.08g, 1 pound = 8g (10 blades)
    const totalBlades = g > 0 ? (g / 0.8) : 0;
    const totalPayout = Math.floor(totalBlades * priceBlade);

    const pounds = Math.floor(totalBlades / 10);
    const remainingBladesAfterPounds = totalBlades - (pounds * 10);
    const blades = Math.floor(remainingBladesAfterPounds);

    const accountedGrams = (pounds * 8) + (blades * 0.8);
    const remainingGrams = Math.max(0, g - accountedGrams);
    const matches = Math.round(remainingGrams / 0.08);

    return {
      grams: g,
      pricePerBlade: priceBlade,
      totalBlades,
      pounds,
      blades,
      matches,
      totalPayout
    };
  }
};

let estimatorMode = "refined"; // 'refined' | 'balls'
let activeFormula = PORTFOLIO_DATA.qwikGoldSettings.formula;
let activeDiscount = PORTFOLIO_DATA.qwikGoldSettings.purityDiscountPercent;

document.addEventListener("DOMContentLoaded", () => {
  bindProfileEndpoints();
  renderHighlightsReel();
  initEstimator();
  syncQwikGoldSettings();
});

/**
 * Silently syncs active formula & purity discount from ../qwik-gold/ if accessible
 */
async function syncQwikGoldSettings() {
  try {
    const res = await fetch("../qwik-gold/api/settings/get.php", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      const s = (json && json.data) ? json.data : json;
      if (s) {
        if (s.calculation_formula === "mayrocy" || s.calculation_formula === "nwdgc") {
          activeFormula = s.calculation_formula;
        }
        if (s.purity_discount_percent !== undefined && !isNaN(parseFloat(s.purity_discount_percent))) {
          activeDiscount = Math.max(0, parseFloat(s.purity_discount_percent));
        }
        updateFormulaBadge();
        runEstimatorCalculation();
      }
    }
  } catch (e) {
    // Gracefully uses configured Mayrocy + 0.70% defaults
  }
}

function updateFormulaBadge() {
  const badge = document.getElementById("calc-formula-badge");
  if (!badge) return;
  const label = activeFormula === "nwdgc" ? "NWDGC" : "Mayrocy";
  badge.textContent = `${label} • ${activeDiscount.toFixed(2)}%`;
}

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
 * 4. Interactive Qwik-Gold GHS Estimator (Refined Gold & Gold Balls)
 */
function initEstimator() {
  const ids = [
    "est-top-weight",
    "est-down-weight",
    "est-goldbod-price",
    "est-balls-weight",
    "est-price-blade"
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", runEstimatorCalculation);
  });

  updateFormulaBadge();
  runEstimatorCalculation();
}

function setEstimatorMode(mode) {
  estimatorMode = mode === "balls" ? "balls" : "refined";

  const btnRefined = document.getElementById("est-mode-refined");
  const btnBalls = document.getElementById("est-mode-balls");
  const boxRefined = document.getElementById("est-inputs-refined");
  const boxBalls = document.getElementById("est-inputs-balls");

  if (estimatorMode === "refined") {
    btnRefined?.classList.add("active");
    btnBalls?.classList.remove("active");
    boxRefined?.classList.remove("hidden");
    boxBalls?.classList.add("hidden");
  } else {
    btnBalls?.classList.add("active");
    btnRefined?.classList.remove("active");
    boxBalls?.classList.remove("hidden");
    boxRefined?.classList.add("hidden");
  }

  runEstimatorCalculation();
}

function formatGhs(amount) {
  return "GHS " + Number(amount || 0).toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function runEstimatorCalculation() {
  const outGhs = document.getElementById("calc-output-ghs");
  const subMeta = document.getElementById("est-sub-meta");
  const heroSpot = document.getElementById("hero-spot-price");

  const goldbodInputVal = parseFloat(document.getElementById("est-goldbod-price")?.value) || PORTFOLIO_DATA.qwikGoldSettings.defaultGoldbodPriceGhs;
  if (heroSpot) {
    heroSpot.textContent = "GHS " + goldbodInputVal.toLocaleString("en-GH", { maximumFractionDigits: 2 });
  }

  if (estimatorMode === "refined") {
    const grams = parseFloat(document.getElementById("est-top-weight")?.value) || 0;
    const volume = parseFloat(document.getElementById("est-down-weight")?.value) || 0;
    const pricePerPound = parseFloat(document.getElementById("est-goldbod-price")?.value) || 0;

    const res = QwikGoldMath.calculateRefined({
      grams,
      volume,
      pricePerPound,
      discountPercent: activeDiscount,
      formula: activeFormula
    });

    const elPounds = document.getElementById("est-res-pounds");
    const elDensity = document.getElementById("est-res-density");
    const elKarat = document.getElementById("est-res-karat");
    const elPurity = document.getElementById("est-res-purity");
    const warnBanner = document.getElementById("est-low-karat-warn");

    if (elPounds) elPounds.textContent = res.pounds.toFixed(2);
    if (elDensity) elDensity.textContent = res.density.toFixed(2);
    if (elKarat) elKarat.textContent = `${res.payableKarat.toFixed(2)} kt`;
    if (elPurity) elPurity.textContent = `${res.purityPercent.toFixed(2)}%`;

    if (warnBanner) {
      if (res.density > 0 && res.payableKarat > 0 && res.payableKarat < 14.0) {
        warnBanner.classList.remove("hidden");
      } else {
        warnBanner.classList.add("hidden");
      }
    }

    if (outGhs) outGhs.textContent = formatGhs(res.totalPayout);
    if (subMeta) {
      subMeta.textContent = `Adj. Price/lb: ${formatGhs(res.adjustedPricePerPound)}`;
    }
  } else {
    const grams = parseFloat(document.getElementById("est-balls-weight")?.value) || 0;
    const pricePerBlade = parseFloat(document.getElementById("est-price-blade")?.value) || 0;

    const res = QwikGoldMath.calculateBalls({ grams, pricePerBlade });

    const elBlades = document.getElementById("est-res-blades");
    const elBreakdown = document.getElementById("est-res-balls-breakdown");

    if (elBlades) elBlades.textContent = res.totalBlades.toFixed(4);
    if (elBreakdown) {
      elBreakdown.textContent = `${res.pounds} lb · ${res.blades} bld · ${res.matches} mtch`;
    }

    if (outGhs) outGhs.textContent = formatGhs(res.totalPayout);
    if (subMeta) {
      subMeta.textContent = `Rate: ${formatGhs(res.pricePerBlade)} / blade (0.8g)`;
    }
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
 * 6. Direct WhatsApp & Estimator Actions (GHS)
 */
function openWhatsAppWithContext(topic) {
  closeSheet("inquiry-sheet");
  const { profile } = PORTFOLIO_DATA;
  const msg = `Hello Mr. Mukhlis Farhan,\n\nI scanned your digital portfolio card and would like to inquire about:\n*${topic}*\n\nPlease let me know how we can proceed.`;
  window.open(`https://wa.me/${profile.whatsappNumber}?text=${encodeURIComponent(msg)}`, "_blank");
}

function sendEstimatorToWhatsApp() {
  const { profile } = PORTFOLIO_DATA;
  const totalOut = document.getElementById("calc-output-ghs")?.textContent || "GHS 0.00";
  let msg = "";

  if (estimatorMode === "refined") {
    const topW = document.getElementById("est-top-weight")?.value || "0";
    const downW = document.getElementById("est-down-weight")?.value || "0";
    const priceLb = document.getElementById("est-goldbod-price")?.value || "0";
    const pounds = document.getElementById("est-res-pounds")?.textContent || "0.00";
    const karat = document.getElementById("est-res-karat")?.textContent || "0.00 kt";
    const purity = document.getElementById("est-res-purity")?.textContent || "0.00%";

    msg = `Hello Mr. Mukhlis Farhan,\n\nI used the *Qwik-Gold Refined Estimator* on your digital card:\n• Top Weight: *${topW}g* (${pounds} lbs)\n• Down Weight: *${downW}g*\n• Payable Karat / Purity: *${karat}* (*${purity}*)\n• Goldbod Price: *GHS ${priceLb}/lb*\n• Estimated Payout: *${totalOut}*\n\nPlease confirm your current desk rate.`;
  } else {
    const weight = document.getElementById("est-balls-weight")?.value || "0";
    const priceBlade = document.getElementById("est-price-blade")?.value || "0";
    const blades = document.getElementById("est-res-blades")?.textContent || "0.0000";
    const breakdown = document.getElementById("est-res-balls-breakdown")?.textContent || "";

    msg = `Hello Mr. Mukhlis Farhan,\n\nI used the *Qwik-Gold Balls Estimator* on your digital card:\n• Gold Weight: *${weight}g* (*${blades} blades*)\n• Breakdown: *${breakdown}*\n• Price/Blade: *GHS ${priceBlade}*\n• Estimated Payout: *${totalOut}*\n\nPlease confirm your current desk rate.`;
  }

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
