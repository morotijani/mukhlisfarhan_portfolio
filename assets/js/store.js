/**
 * ============================================================================
 * MACHINE MVP ONLINE STORE — LIVE API CLIENT & WHATSAPP ORDER BAG
 * ============================================================================
 * Fetches live items, prices, categories, stock levels & images directly from
 * the walk-in POS project (`../machine_mvp/api/store/items`).
 *
 * When deployed on a separate domain later, simply set `API_URL` below to your
 * live machine_mvp domain, e.g. "https://pos.mukhlisfarhantrading.com/api/store/items"
 */

const STORE_CONFIG = {
  // Primary live endpoint (works both locally on XAMPP & on the same server)
  API_URL: "../machine_mvp/api/store/items",
  // Fallback relative path in case Apache rewrite hits public/ directly
  API_FALLBACK_URL: "../machine_mvp/public/api/store/items",

  whatsappNumber: "233554001608",
  currency: "GHS",
  defaultStoreName: "Machine MVP Shop",
  defaultAddress: "Odumase-Konongo, Ghana",

  // Graceful fallback items shown ONLY if the POS API server is completely unreachable
  offlineFallbackItems: [
    {
      id: 1001,
      name: "Changfa Diesel Engine",
      type: "single",
      category: "Diesel Engines",
      sku: "SHOP-ENG-01",
      unit: "unit",
      price: 0,
      quantity: 5,
      stock_status: "in_stock",
      image_url: "assets/img/products/changfa-diesel-engine.jpg",
      bundle_components: []
    },
    {
      id: 1002,
      name: "DreamTurf Gold Mining Carpet",
      type: "single",
      category: "Gold Recovery",
      sku: "SHOP-CRP-02",
      unit: "roll",
      price: 0,
      quantity: 12,
      stock_status: "in_stock",
      image_url: "assets/img/products/gold-mining-carpet.jpg",
      bundle_components: []
    },
    {
      id: 1003,
      name: "Vertical Sand & Gravel Suction Pump",
      type: "single",
      category: "Pumps",
      sku: "SHOP-PMP-03",
      unit: "unit",
      price: 0,
      quantity: 8,
      stock_status: "in_stock",
      image_url: "assets/img/products/vertical-sand-pumps.jpg",
      bundle_components: []
    },
    {
      id: 1004,
      name: "Heavy Reinforced Mining Suction Hose",
      type: "single",
      category: "Hoses & Piping",
      sku: "SHOP-HSE-04",
      unit: "length",
      price: 0,
      quantity: 20,
      stock_status: "in_stock",
      image_url: "assets/img/products/suction-hoses.jpg",
      bundle_components: []
    },
    {
      id: 1005,
      name: "Cast-Iron Slurry Pump Volute Casing",
      type: "single",
      category: "Pump Parts",
      sku: "SHOP-VOL-05",
      unit: "pcs",
      price: 0,
      quantity: 14,
      stock_status: "in_stock",
      image_url: "assets/img/products/pump-casings.jpg",
      bundle_components: []
    },
    {
      id: 1006,
      name: "Steel Flange Hose Adapter Coupling",
      type: "single",
      category: "Fittings",
      sku: "SHOP-FLG-06",
      unit: "pcs",
      price: 0,
      quantity: 40,
      stock_status: "in_stock",
      image_url: "assets/img/products/flange-adapters.jpg",
      bundle_components: []
    }
  ]
};

// Local visual smart-matching for POS items that don't yet have an uploaded photo
const SMART_PRODUCT_IMAGES = [
  { keywords: ["changfa", "diesel", "engine", "r180", "r185", "s195", "s1100", "s1115"], img: "assets/img/products/changfa-diesel-engine.jpg" },
  { keywords: ["carpet", "dreamturf", "turf", "mat", "blanket", "sluice"], img: "assets/img/products/gold-mining-carpet.jpg" },
  { keywords: ["vertical", "sand pump", "gravel pump", "inhale sand", "suction pump"], img: "assets/img/products/vertical-sand-pumps.jpg" },
  { keywords: ["hose", "pipe", "suction hose", "discharge"], img: "assets/img/products/suction-hoses.jpg" },
  { keywords: ["casing", "volute", "shell", "impeller", "pump head"], img: "assets/img/products/pump-casings.jpg" },
  { keywords: ["flange", "adapter", "coupling", "connector", "joint"], img: "assets/img/products/flange-adapters.jpg" }
];

// Store State
let allItems = [];
let allCategories = [];
let activeCategory = "all";
let searchQuery = "";
let inStockOnly = false;
let sortBy = "newest";
let cart = [];
let storeMeta = {
  company_name: STORE_CONFIG.defaultStoreName,
  company_phone: STORE_CONFIG.whatsappNumber,
  company_address: STORE_CONFIG.defaultAddress,
  currency: STORE_CONFIG.currency
};

document.addEventListener("DOMContentLoaded", () => {
  loadCartFromStorage();
  initSearchListener();
  fetchCatalogFromApi();
});

/**
 * 1. Fetch Live Inventory from machine_mvp API
 */
async function fetchCatalogFromApi() {
  renderSkeletonGrid();
  setSyncStatus("Syncing live shop inventory...", false);

  const queryParams = "?limit=200&sort=newest";
  let payload = null;

  for (const baseUrl of [STORE_CONFIG.API_URL, STORE_CONFIG.API_FALLBACK_URL]) {
    try {
      const res = await fetch(baseUrl + queryParams, {
        headers: { Accept: "application/json" },
        cache: "no-store"
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.status === "success" && Array.isArray(json.items)) {
          payload = json;
          break;
        }
      }
    } catch (e) {
      // Try next URL
    }
  }

  if (payload) {
    allItems = payload.items;
    allCategories = payload.categories || [];
    if (payload.store) {
      storeMeta = { ...storeMeta, ...payload.store };
    }

    document.getElementById("offline-banner")?.classList.add("hidden");
    updateStoreHeaderMeta(payload.summary);
    setSyncStatus("Live Stock Connected • POS Synced", true);
  } else {
    // Graceful offline fallback
    allItems = STORE_CONFIG.offlineFallbackItems;
    allCategories = deriveCategoriesLocally(allItems);
    document.getElementById("offline-banner")?.classList.remove("hidden");
    updateStoreHeaderMeta({
      total_items: allItems.length,
      in_stock_items: allItems.filter(i => i.quantity > 0).length
    });
    setSyncStatus("Offline Catalog Mode", false);
  }

  renderCategoryPills();
  renderFilteredProducts();
  updateCartUI();
}

function refreshCatalog() {
  const icon = document.getElementById("refresh-icon");
  if (icon) {
    icon.style.transition = "transform 0.6s ease";
    icon.style.transform = "rotate(360deg)";
    setTimeout(() => { icon.style.transform = "rotate(0deg)"; }, 650);
  }
  fetchCatalogFromApi();
}

function deriveCategoriesLocally(items) {
  const map = {};
  items.forEach(item => {
    const c = item.category || "General Mining";
    if (!map[c]) map[c] = { name: c, count: 0, in_stock_count: 0 };
    map[c].count++;
    if (item.quantity > 0) map[c].in_stock_count++;
  });
  return Object.values(map);
}

function setSyncStatus(text, isOnline) {
  const txt = document.getElementById("sync-status-text");
  const dot = document.getElementById("sync-dot");
  if (txt) txt.textContent = text;
  if (dot) {
    dot.className = isOnline
      ? "w-2 h-2 rounded-full bg-emerald-400"
      : "w-2 h-2 rounded-full bg-amber-400";
  }
}

function updateStoreHeaderMeta(summary = {}) {
  const brandEl = document.getElementById("store-brand-name");
  const locEl = document.getElementById("store-location-text");
  const statTotal = document.getElementById("stat-total-items");
  const statInStock = document.getElementById("stat-instock-items");

  if (brandEl && storeMeta.company_name) brandEl.textContent = storeMeta.company_name;
  if (locEl && storeMeta.company_address) {
    locEl.textContent = `${storeMeta.company_address} • Live Stock & ${storeMeta.currency} Pricing`;
  }
  if (statTotal) statTotal.textContent = summary.total_items ?? allItems.length;
  if (statInStock) {
    statInStock.textContent = summary.in_stock_items ?? allItems.filter(i => i.quantity > 0).length;
  }
}

/**
 * 2. Smart Image Resolver (Uses POS image_url first, then smart local fallback, then clean icon tile)
 */
function resolveItemImage(item) {
  if (item.image_url) return item.image_url;
  const hay = `${item.name} ${item.category}`.toLowerCase();
  for (const entry of SMART_PRODUCT_IMAGES) {
    if (entry.keywords.some(k => hay.includes(k))) {
      return entry.img;
    }
  }
  return null;
}

function formatPrice(price) {
  const num = Number(price || 0);
  if (num <= 0) return "Ask Price";
  return `${storeMeta.currency} ${num.toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * 3. Category Pills & Filter Controls
 */
function renderCategoryPills() {
  const strip = document.getElementById("category-strip");
  if (!strip) return;

  const totalCount = allItems.length;
  const pills = [
    `<button onclick="selectCategory('all')" class="cat-pill ${activeCategory === "all" ? "active" : ""}">
      All Items <span class="cat-count">${totalCount}</span>
    </button>`
  ];

  allCategories.forEach(cat => {
    const isActive = activeCategory.toLowerCase() === cat.name.toLowerCase();
    pills.push(`
      <button onclick="selectCategory('${escapeQuotes(cat.name)}')" class="cat-pill ${isActive ? "active" : ""}">
        ${escapeHtml(cat.name)} <span class="cat-count">${cat.count}</span>
      </button>
    `);
  });

  strip.innerHTML = pills.join("");
}

function selectCategory(cat) {
  activeCategory = cat;
  renderCategoryPills();
  renderFilteredProducts();
}

function initSearchListener() {
  const input = document.getElementById("store-search-input");
  const clearBtn = document.getElementById("store-search-clear");
  if (!input) return;

  input.addEventListener("input", () => {
    searchQuery = input.value.trim();
    if (clearBtn) clearBtn.classList.toggle("hidden", searchQuery === "");
    renderFilteredProducts();
  });
}

function clearSearch() {
  const input = document.getElementById("store-search-input");
  const clearBtn = document.getElementById("store-search-clear");
  if (input) input.value = "";
  if (clearBtn) clearBtn.classList.add("hidden");
  searchQuery = "";
  renderFilteredProducts();
}

function toggleInStockOnly() {
  inStockOnly = !inStockOnly;
  const btn = document.getElementById("toggle-instock-btn");
  if (btn) btn.classList.toggle("active", inStockOnly);
  renderFilteredProducts();
}

function changeSort(val) {
  sortBy = val;
  renderFilteredProducts();
}

function resetFilters() {
  activeCategory = "all";
  inStockOnly = false;
  sortBy = "newest";
  const btn = document.getElementById("toggle-instock-btn");
  const sel = document.getElementById("store-sort-select");
  if (btn) btn.classList.remove("active");
  if (sel) sel.value = "newest";
  clearSearch();
  renderCategoryPills();
  renderFilteredProducts();
}

/**
 * 4. Render Filtered & Sorted Catalog Cards
 */
function getFilteredItems() {
  let list = allItems.filter(item => {
    if (inStockOnly && item.quantity <= 0) return false;
    if (activeCategory !== "all") {
      const cat = (item.category || "General Mining").toLowerCase();
      if (cat !== activeCategory.toLowerCase()) return false;
    }
    if (searchQuery !== "") {
      const q = searchQuery.toLowerCase();
      const hay = `${item.name} ${item.sku} ${item.category} ${item.unit}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  if (sortBy === "name") {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === "price_asc") {
    list.sort((a, b) => a.price - b.price);
  } else if (sortBy === "price_desc") {
    list.sort((a, b) => b.price - a.price);
  } else if (sortBy === "stock") {
    list.sort((a, b) => b.quantity - a.quantity);
  } else {
    // Featured: in-stock first
    list.sort((a, b) => (b.quantity > 0 ? 1 : 0) - (a.quantity > 0 ? 1 : 0));
  }

  return list;
}

function renderSkeletonGrid() {
  const grid = document.getElementById("catalog-grid");
  if (!grid) return;
  grid.innerHTML = Array.from({ length: 6 }).map(() => `
    <div class="product-card p-2.5 space-y-2.5">
      <div class="skeleton-box h-28 w-full"></div>
      <div class="skeleton-box h-3.5 w-3/4"></div>
      <div class="skeleton-box h-3 w-1/2"></div>
      <div class="skeleton-box h-8 w-full"></div>
    </div>
  `).join("");
}

function renderFilteredProducts() {
  const grid = document.getElementById("catalog-grid");
  const empty = document.getElementById("empty-state");
  const countLabel = document.getElementById("results-count-label");
  if (!grid) return;

  const items = getFilteredItems();
  if (countLabel) countLabel.textContent = `${items.length} item${items.length === 1 ? "" : "s"}`;

  if (items.length === 0) {
    grid.innerHTML = "";
    empty?.classList.remove("hidden");
    return;
  }

  empty?.classList.add("hidden");

  grid.innerHTML = items.map(item => {
    const imgUrl = resolveItemImage(item);
    const out = item.quantity <= 0;
    const low = item.quantity > 0 && item.quantity <= 5;
    const stockBadgeClass = out ? "out-stock" : (low ? "low-stock" : "in-stock");
    const stockBadgeText = out ? "Out of Stock" : (low ? `Only ${item.quantity} left` : `${item.quantity} in stock`);

    const cartEntry = cart.find(c => c.id === item.id);
    const inBag = Boolean(cartEntry);

    return `
      <article class="product-card ${out ? "out-of-stock" : ""}">
        <div class="product-media" onclick="openProductDetail(${item.id})">
          ${imgUrl ? `
            <img src="${imgUrl}" alt="${escapeHtml(item.name)}" loading="lazy"
              onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
            <div class="product-placeholder" style="display:none;">
              <svg class="w-7 h-7 opacity-75" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              <span class="text-[10px] font-bold uppercase tracking-wider">${escapeHtml(item.category)}</span>
            </div>
          ` : `
            <div class="product-placeholder">
              <svg class="w-7 h-7 opacity-75" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              <span class="text-[10px] font-bold uppercase tracking-wider">${escapeHtml(item.category)}</span>
            </div>
          `}

          <span class="stock-badge ${stockBadgeClass}">${stockBadgeText}</span>
          ${item.type === "bundle" ? `<span class="bundle-badge">Bundle</span>` : ""}
        </div>

        <div class="p-3 flex-1 flex flex-col justify-between">
          <div onclick="openProductDetail(${item.id})" class="cursor-pointer">
            <div class="text-[10px] font-bold uppercase tracking-wider text-[#B4832C] truncate">
              ${escapeHtml(item.category)}
            </div>
            <h3 class="text-[13px] font-bold text-[#141917] leading-snug mt-0.5 line-clamp-2">
              ${escapeHtml(item.name)}
            </h3>
          </div>

          <div class="mt-2.5">
            <div class="flex items-baseline justify-between gap-1 mb-2">
              <span class="font-mono-num text-[13.5px] font-bold text-[#141917]">
                ${formatPrice(item.price)}
              </span>
              <span class="text-[10px] text-[#848E88]">/${escapeHtml(item.unit)}</span>
            </div>

            <button
              onclick="addToCart(${item.id})"
              class="add-bag-btn ${inBag ? "in-bag" : ""}"
              ${out ? "disabled" : ""}
            >
              ${out ? "Restocking Soon" : (inBag ? `✓ In Bag (${cartEntry.qty}) +` : "+ Add to Bag")}
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

/**
 * 5. Product Detail Bottom Sheet
 */
function openProductDetail(itemId) {
  const item = allItems.find(i => i.id === itemId);
  if (!item) return;

  const mediaBox = document.getElementById("detail-media-box");
  const imgUrl = resolveItemImage(item);
  if (mediaBox) {
    mediaBox.innerHTML = imgUrl
      ? `<img src="${imgUrl}" alt="${escapeHtml(item.name)}" class="w-full h-full object-cover" />`
      : `<div class="product-placeholder h-full"><svg class="w-10 h-10 opacity-70" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg><span class="text-xs font-bold uppercase tracking-widest">${escapeHtml(item.category)}</span></div>`;
  }

  document.getElementById("detail-category").textContent = item.category;
  document.getElementById("detail-name").textContent = item.name;
  document.getElementById("detail-sku").textContent = item.sku ? `SKU: ${item.sku}` : "In-Shop Equipment";
  document.getElementById("detail-price").textContent = formatPrice(item.price);
  document.getElementById("detail-unit").textContent = `per ${item.unit}`;

  const stockPill = document.getElementById("detail-stock-pill");
  if (item.quantity <= 0) {
    stockPill.className = "text-xs font-bold px-3 py-1 rounded-full bg-gray-200 text-gray-700";
    stockPill.textContent = "Currently Out of Stock";
  } else if (item.quantity <= 5) {
    stockPill.className = "text-xs font-bold px-3 py-1 rounded-full bg-[#FBF4E4] text-[#8C6119]";
    stockPill.textContent = `Low Stock • ${item.quantity} ${item.unit} available`;
  } else {
    stockPill.className = "text-xs font-bold px-3 py-1 rounded-full bg-[#E7F5F0] text-[#0E7C5B]";
    stockPill.textContent = `In Stock • ${item.quantity} ${item.unit} available`;
  }

  const typePill = document.getElementById("detail-type-pill");
  const bundleBox = document.getElementById("detail-bundle-box");
  const bundleList = document.getElementById("detail-bundle-list");

  if (item.type === "bundle" && Array.isArray(item.bundle_components) && item.bundle_components.length > 0) {
    typePill.classList.remove("hidden");
    typePill.textContent = "Complete Bundle";
    bundleBox.classList.remove("hidden");
    bundleList.innerHTML = item.bundle_components
      .map(c => `<li class="flex items-center justify-between"><span>• ${escapeHtml(c.name)}</span><strong class="font-mono-num">×${c.quantity}</strong></li>`)
      .join("");
  } else {
    typePill.classList.add("hidden");
    bundleBox.classList.add("hidden");
  }

  const addBtn = document.getElementById("detail-add-btn");
  if (item.quantity <= 0) {
    addBtn.disabled = true;
    addBtn.textContent = "Out of Stock";
    addBtn.style.opacity = "0.5";
  } else {
    addBtn.disabled = false;
    addBtn.style.opacity = "1";
    addBtn.textContent = "+ Add to Order Bag";
    addBtn.onclick = () => {
      addToCart(item.id);
      closeSheet("detail-sheet");
    };
  }

  const waBtn = document.getElementById("detail-whatsapp-btn");
  waBtn.onclick = () => {
    const priceNote = item.price > 0 ? ` (${formatPrice(item.price)} / ${item.unit})` : "";
    const msg = `Hello Mr. Mukhlis Farhan,\n\nI saw *${item.name}*${priceNote} on your Machine MVP Online Store (SKU: ${item.sku || "N/A"}).\nIs it available for pickup or delivery?`;
    window.open(`https://wa.me/${getWhatsappDigits()}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  openSheet("detail-sheet");
}

/**
 * 6. Order Bag (Cart) & Direct WhatsApp Checkout
 */
function loadCartFromStorage() {
  try {
    const raw = localStorage.getItem("mf_store_cart_v1");
    if (raw) cart = JSON.parse(raw) || [];
  } catch (e) {
    cart = [];
  }
}

function saveCartToStorage() {
  try {
    localStorage.setItem("mf_store_cart_v1", JSON.stringify(cart));
  } catch (e) {}
}

function addToCart(itemId) {
  const item = allItems.find(i => i.id === itemId);
  if (!item || item.quantity <= 0) return;

  const existing = cart.find(c => c.id === item.id);
  if (existing) {
    if (existing.qty >= item.quantity) {
      showToast(`Only ${item.quantity} ${item.unit} currently in stock`);
      return;
    }
    existing.qty += 1;
    existing.price = item.price;
    existing.maxStock = item.quantity;
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      sku: item.sku || "",
      unit: item.unit || "pcs",
      price: item.price,
      qty: 1,
      maxStock: item.quantity
    });
  }

  saveCartToStorage();
  updateCartUI();
  renderFilteredProducts();
  showToast(`Added "${item.name}" to bag`);
}

function updateCartItemQty(itemId, delta) {
  const idx = cart.findIndex(c => c.id === itemId);
  if (idx === -1) return;

  const nextQty = cart[idx].qty + delta;
  if (nextQty <= 0) {
    cart.splice(idx, 1);
  } else if (nextQty > cart[idx].maxStock) {
    showToast(`Max available stock is ${cart[idx].maxStock}`);
    return;
  } else {
    cart[idx].qty = nextQty;
  }

  saveCartToStorage();
  updateCartUI();
  renderFilteredProducts();
}

function clearCart() {
  cart = [];
  saveCartToStorage();
  updateCartUI();
  renderFilteredProducts();
  closeSheet("cart-sheet");
}

function updateCartUI() {
  const totalCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const totalAmount = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

  const navCount = document.getElementById("nav-cart-count");
  const barWrap = document.getElementById("floating-cart-bar");
  const barCount = document.getElementById("bar-cart-count");
  const barTotal = document.getElementById("bar-cart-total");
  const cartTotalEl = document.getElementById("cart-total-amount");
  const cartListEl = document.getElementById("cart-items-list");
  const checkoutForm = document.getElementById("cart-checkout-form");

  if (navCount) navCount.textContent = totalCount;
  if (barCount) barCount.textContent = totalCount;
  if (barTotal) barTotal.textContent = formatPrice(totalAmount);
  if (cartTotalEl) cartTotalEl.textContent = formatPrice(totalAmount);

  if (barWrap) {
    barWrap.classList.toggle("hidden-bar", totalCount === 0);
  }

  if (!cartListEl) return;

  if (cart.length === 0) {
    cartListEl.innerHTML = `
      <div class="py-8 text-center text-xs text-[#848E88]">
        Your order bag is empty. Add mining items from the catalog to build an order.
      </div>
    `;
    checkoutForm?.classList.add("hidden");
    return;
  }

  checkoutForm?.classList.remove("hidden");
  cartListEl.innerHTML = cart.map(entry => `
    <div class="p-3 rounded-2xl bg-[#FAF8F4] border border-[#141917]/8 flex items-center justify-between gap-2">
      <div class="min-w-0 flex-1">
        <div class="text-xs font-bold text-[#141917] truncate">${escapeHtml(entry.name)}</div>
        <div class="font-mono-num text-[11px] text-[#525B56] mt-0.5">
          ${formatPrice(entry.price)} × ${entry.qty} = <strong class="text-[#141917]">${formatPrice(entry.price * entry.qty)}</strong>
        </div>
      </div>

      <div class="qty-stepper shrink-0">
        <button onclick="updateCartItemQty(${entry.id}, -1)" class="qty-step-btn" aria-label="Decrease quantity">−</button>
        <span class="font-mono-num text-xs font-bold min-w-[18px] text-center">${entry.qty}</span>
        <button onclick="updateCartItemQty(${entry.id}, 1)" class="qty-step-btn" aria-label="Increase quantity">+</button>
      </div>
    </div>
  `).join("");
}

function checkoutOrderViaWhatsApp() {
  if (cart.length === 0) return;

  const custName = document.getElementById("checkout-name")?.value.trim() || "";
  const custLoc = document.getElementById("checkout-location")?.value.trim() || "";
  const totalAmount = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

  const lines = [
    "Hello Mr. Mukhlis Farhan,",
    "",
    "I would like to place an order from the *Machine MVP Online Store*:",
    ""
  ];

  cart.forEach((item, i) => {
    const subtotal = item.price > 0 ? formatPrice(item.price * item.qty) : "Confirm Price";
    lines.push(`${i + 1}. *${item.name}* — Qty: *${item.qty} ${item.unit}* (${subtotal})`);
  });

  lines.push("");
  if (totalAmount > 0) {
    lines.push(`*Estimated Total:* ${formatPrice(totalAmount)}`);
  }
  if (custName) lines.push(`*Customer Name:* ${custName}`);
  if (custLoc) lines.push(`*Delivery / Site Location:* ${custLoc}`);
  lines.push("");
  lines.push("Please confirm availability and payment/pickup details.");

  window.open(`https://wa.me/${getWhatsappDigits()}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
}

function getWhatsappDigits() {
  // Always prefer configured Mukhlis WhatsApp number; clean non-digits
  return String(STORE_CONFIG.whatsappNumber).replace(/\D/g, "");
}

/**
 * 7. Sheet & Utility Helpers
 */
function openSheet(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("open");
}

function closeSheet(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("open");
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
  }, 2400);
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeQuotes(str) {
  return String(str ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
