/**
 * Meridian — Product catalog + interactive shopping cart
 * FakeStoreAPI · localStorage cart persistence · tax / shipping math
 */

const API_URL = "https://fakestoreapi.com/products";
const CART_KEY = "meridian-cart-v1";
const PRODUCTS_CACHE_KEY = "meridian-products-v1";
const THEME_KEY = "meridian.theme.v1";
const TAX_RATE = 0.08;
const FREE_SHIPPING_MIN = 100;
const SHIPPING_FLAT = 5.99;
const FETCH_RETRIES = 2;
const FETCH_TIMEOUT_MS = 8000;

const IMG_PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect fill="#e8efee" width="200" height="200"/>
      <text x="100" y="105" text-anchor="middle" fill="#4a5c5f" font-family="sans-serif" font-size="14">No image</text>
    </svg>`
  );

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Map FakeStore categories → filter chips */
const CATEGORY_MAP = {
  electronics: "electronics",
  jewelery: "jewelry",
  "men's clothing": "clothing",
  "women's clothing": "clothing",
};

const BADGE_LABELS = {
  electronics: "Electronics",
  jewelery: "Jewelry",
  "men's clothing": "Men",
  "women's clothing": "Women",
};

const els = {
  themeToggle: document.getElementById("theme-toggle"),
  searchInput: document.getElementById("product-search"),
  filterGroup: document.querySelector(".filter-group"),
  status: document.getElementById("status-message"),
  statusText: document.getElementById("status-text"),
  statusRetry: document.getElementById("status-retry"),
  catalogCount: document.getElementById("catalog-count"),
  productGrid: document.getElementById("product-grid"),
  emptyCatalog: document.getElementById("empty-catalog"),
  cartTrigger: document.getElementById("cart-open"),
  cartBadge: document.getElementById("cart-badge"),
  cartDrawer: document.getElementById("cart-drawer"),
  cartBackdrop: document.getElementById("cart-backdrop"),
  cartClose: document.getElementById("cart-close"),
  cartList: document.getElementById("cart-list"),
  cartEmpty: document.getElementById("cart-empty"),
  cartSubtotal: document.getElementById("cart-subtotal"),
  cartShipping: document.getElementById("cart-shipping"),
  cartTax: document.getElementById("cart-tax"),
  cartTotal: document.getElementById("cart-total"),
  checkoutBtn: document.getElementById("checkout-btn"),
  modalBackdrop: document.getElementById("checkout-backdrop"),
  checkoutModal: document.getElementById("checkout-modal"),
  formView: document.getElementById("checkout-form-view"),
  successView: document.getElementById("checkout-success-view"),
  checkoutForm: document.getElementById("checkout-form"),
  checkoutClose: document.getElementById("checkout-close"),
  successDone: document.getElementById("checkout-done"),
  checkoutPayTotal: document.getElementById("checkout-total-label"),
  successCopy: document.getElementById("checkout-success-copy"),
  toast: document.getElementById("toast"),
  toastMessage: document.getElementById("toast-message"),
};

/** @type {Array<object>} */
let products = [];
/** @type {Map<number, { id: number, title: string, price: number, image: string, quantity: number }>} */
let cart = new Map();
let activeFilter = "all";
let searchQuery = "";
let toastTimer = null;
let lastFocus = null;
let activeTrap = null;
let syncingFromStorage = false;

/* --------------------------------------------------------------------------
   Theme
   -------------------------------------------------------------------------- */
function getPreferredTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  if (els.themeToggle) {
    els.themeToggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    els.themeToggle.setAttribute(
      "aria-label",
      theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
    );
  }
}

function toggleTheme() {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
}

/* --------------------------------------------------------------------------
   Cart persistence & math
   -------------------------------------------------------------------------- */
function parseCartItems(raw) {
  const items = JSON.parse(raw);
  if (!Array.isArray(items)) return new Map();
  return new Map(
    items
      .filter((i) => i && typeof i.id === "number" && i.quantity > 0)
      .map((i) => [
        i.id,
        {
          id: i.id,
          title: String(i.title || "Item"),
          price: Number(i.price) || 0,
          image: String(i.image || ""),
          quantity: Math.min(99, Math.max(1, Number(i.quantity) || 1)),
        },
      ])
  );
}

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return;
    cart = parseCartItems(raw);
  } catch {
    cart = new Map();
  }
}

function saveCart() {
  if (syncingFromStorage) return;
  localStorage.setItem(CART_KEY, JSON.stringify([...cart.values()]));
}

function cartItemCount() {
  let n = 0;
  for (const item of cart.values()) n += item.quantity;
  return n;
}

function calculateTotal() {
  let subtotal = 0;
  for (const item of cart.values()) {
    subtotal += item.price * item.quantity;
  }
  const shipping = subtotal === 0 ? 0 : subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FLAT;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shipping + tax;
  return { subtotal, shipping, tax, total };
}

function formatMoney(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

function addToCart(product, qty = 1) {
  if (!product) return;
  const existing = cart.get(product.id);
  if (existing) {
    existing.quantity = Math.min(99, existing.quantity + qty);
  } else {
    cart.set(product.id, {
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      quantity: Math.min(99, Math.max(1, qty)),
    });
  }
  saveCart();
  renderCart();
  showToast(`Added “${truncate(product.title, 36)}” to cart`);
}

function removeFromCart(id) {
  cart.delete(id);
  saveCart();
  renderCart();
  showToast("Item removed");
}

function updateQuantity(id, nextQty) {
  const item = cart.get(id);
  if (!item) return;
  if (nextQty <= 0) {
    removeFromCart(id);
    return;
  }
  item.quantity = Math.min(99, nextQty);
  saveCart();
  renderCart();
}

/* --------------------------------------------------------------------------
   Focus trap
   -------------------------------------------------------------------------- */
function getFocusable(container) {
  if (!container) return [];
  return [...container.querySelectorAll(FOCUSABLE)].filter((el) => {
    if (el.hasAttribute("disabled") || el.getAttribute("aria-hidden") === "true") return false;
    if (el.closest("[hidden]")) return false;
    return el.getClientRects().length > 0;
  });
}

function onTrapKeydown(e) {
  if (e.key !== "Tab" || !activeTrap) return;
  const nodes = getFocusable(activeTrap);
  if (nodes.length === 0) {
    e.preventDefault();
    return;
  }
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function activateTrap(container, focusEl) {
  activeTrap = container;
  document.addEventListener("keydown", onTrapKeydown);
  (focusEl || getFocusable(container)[0])?.focus();
}

function deactivateTrap() {
  activeTrap = null;
  document.removeEventListener("keydown", onTrapKeydown);
}

function restoreFocus() {
  const el = lastFocus;
  lastFocus = null;
  if (el && typeof el.focus === "function") el.focus();
}

/* --------------------------------------------------------------------------
   UI helpers
   -------------------------------------------------------------------------- */
function truncate(str, max) {
  if (!str || str.length <= max) return str;
  return `${str.slice(0, max - 1)}…`;
}

function starString(rate) {
  const full = Math.round(rate);
  return "★".repeat(Math.min(5, Math.max(0, full))) + "☆".repeat(Math.max(0, 5 - full));
}

function showToast(message) {
  if (!els.toast) return;
  if (els.toastMessage) els.toastMessage.textContent = message;
  else els.toast.textContent = message;
  els.toast.hidden = false;
  els.toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.classList.remove("is-visible");
    els.toast.hidden = true;
  }, 2400);
}

function setStatus(message, { isError = false, isWarn = false, retry = false } = {}) {
  if (!els.status) return;
  if (!message) {
    els.status.hidden = true;
    if (els.statusText) els.statusText.textContent = "";
    if (els.statusRetry) els.statusRetry.hidden = true;
    els.status.classList.remove("is-error", "is-warn");
    return;
  }
  els.status.hidden = false;
  if (els.statusText) els.statusText.textContent = message;
  if (els.statusRetry) els.statusRetry.hidden = !retry;
  els.status.classList.toggle("is-error", isError);
  els.status.classList.toggle("is-warn", isWarn && !isError);
}

function lockBody(locked) {
  document.body.classList.toggle("is-locked", locked);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, "&#39;");
}

function bindImageFallback(root) {
  root?.querySelectorAll("img").forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        if (img.dataset.fallback === "1") return;
        img.dataset.fallback = "1";
        img.src = IMG_PLACEHOLDER;
      },
      { once: true }
    );
  });
}

/* --------------------------------------------------------------------------
   Catalog
   -------------------------------------------------------------------------- */
function productMatchesFilter(product) {
  if (activeFilter === "all") return true;
  return CATEGORY_MAP[product.category] === activeFilter;
}

function productMatchesSearch(product) {
  if (!searchQuery) return true;
  const q = searchQuery.toLowerCase();
  return (
    product.title.toLowerCase().includes(q) ||
    product.category.toLowerCase().includes(q) ||
    String(product.description || "")
      .toLowerCase()
      .includes(q)
  );
}

function filteredProducts() {
  return products.filter((p) => productMatchesFilter(p) && productMatchesSearch(p));
}

function renderSkeletons(count = 8) {
  if (!els.productGrid) return;
  if (els.emptyCatalog) els.emptyCatalog.hidden = true;
  els.productGrid.innerHTML = Array.from({ length: count }, () => {
    return `
      <article class="product-card product-card--skeleton" aria-hidden="true">
        <div class="product-media"><div class="skeleton-block"></div></div>
        <div class="product-body">
          <div class="skeleton-line"></div>
          <div class="skeleton-line skeleton-line--short"></div>
        </div>
        <div class="product-footer">
          <div class="skeleton-line skeleton-line--price"></div>
          <div class="skeleton-btn"></div>
        </div>
      </article>
    `;
  }).join("");
  if (els.catalogCount) els.catalogCount.textContent = "Loading…";
}

function renderCatalog() {
  const list = filteredProducts();
  if (els.catalogCount) {
    els.catalogCount.textContent = `${list.length} product${list.length === 1 ? "" : "s"}`;
  }

  if (!els.productGrid) return;

  if (list.length === 0) {
    els.productGrid.innerHTML = "";
    if (els.emptyCatalog) {
      els.emptyCatalog.hidden = false;
      els.emptyCatalog.textContent = products.length
        ? "No products match this search or filter."
        : "No products to show yet.";
    }
    return;
  }

  if (els.emptyCatalog) els.emptyCatalog.hidden = true;

  els.productGrid.innerHTML = list
    .map((p) => {
      const badge = BADGE_LABELS[p.category] || "Item";
      const rate = p.rating?.rate ?? 0;
      const count = p.rating?.count ?? 0;
      return `
        <article class="product-card" data-id="${p.id}">
          <div class="product-media">
            <span class="product-badge">${escapeHtml(badge)}</span>
            <img src="${escapeAttr(p.image)}" alt="" loading="lazy" width="200" height="200" />
          </div>
          <div class="product-body">
            <h3 class="product-title">${escapeHtml(p.title)}</h3>
            <p class="product-rating">
              <span class="stars" aria-hidden="true">${starString(rate)}</span>
              ${rate.toFixed(1)} · ${count} reviews
            </p>
          </div>
          <div class="product-footer">
            <span class="product-price">${formatMoney(p.price)}</span>
            <button type="button" class="btn btn-primary btn-compact" data-add="${p.id}">
              Add to cart
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  bindImageFallback(els.productGrid);
}

function loadCachedProducts() {
  try {
    const raw = localStorage.getItem(PRODUCTS_CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return Array.isArray(data) && data.length ? data : null;
  } catch {
    return null;
  }
}

function cacheProducts(data) {
  try {
    localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(data));
  } catch {
    /* quota — ignore */
  }
}

async function fetchWithTimeout(url, attempt) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: attempt === 0 ? "default" : "reload",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("Unexpected response");
    return data;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchProducts() {
  setStatus("Loading products from FakeStoreAPI…");
  if (els.statusRetry) els.statusRetry.hidden = true;
  if (!products.length) renderSkeletons();

  let lastError = null;
  for (let attempt = 0; attempt <= FETCH_RETRIES; attempt += 1) {
    if (attempt > 0) {
      setStatus(`Still loading… retry ${attempt}/${FETCH_RETRIES}`);
    }
    try {
      const data = await fetchWithTimeout(API_URL, attempt);
      products = data;
      cacheProducts(data);
      setStatus("");
      renderCatalog();
      return;
    } catch (err) {
      lastError = err;
    }
  }

  console.error(lastError);
  const cached = loadCachedProducts();
  if (cached) {
    products = cached;
    renderCatalog();
    setStatus("Live catalog unavailable — showing last saved products.", {
      isWarn: true,
      retry: true,
    });
    return;
  }

  setStatus("Could not load products. Check your connection and retry.", {
    isError: true,
    retry: true,
  });
  if (els.productGrid) els.productGrid.innerHTML = "";
  if (els.catalogCount) els.catalogCount.textContent = "0 products";
  if (els.emptyCatalog) {
    els.emptyCatalog.hidden = false;
    els.emptyCatalog.textContent =
      "Catalog could not be loaded. Use Retry above, or try again in a moment.";
  }
}

/* --------------------------------------------------------------------------
   Cart drawer UI
   -------------------------------------------------------------------------- */
function openCart() {
  lastFocus = document.activeElement;
  els.cartDrawer?.classList.add("is-open");
  els.cartDrawer?.setAttribute("aria-hidden", "false");
  if (els.cartDrawer) els.cartDrawer.inert = false;
  els.cartBackdrop?.removeAttribute("hidden");
  els.cartTrigger?.setAttribute("aria-expanded", "true");
  lockBody(true);
  activateTrap(els.cartDrawer, els.cartClose);
}

function closeCart({ restore = true } = {}) {
  els.cartDrawer?.classList.remove("is-open");
  els.cartDrawer?.setAttribute("aria-hidden", "true");
  if (els.cartDrawer) els.cartDrawer.inert = true;
  els.cartBackdrop?.setAttribute("hidden", "");
  els.cartTrigger?.setAttribute("aria-expanded", "false");
  deactivateTrap();
  if (!els.modalBackdrop || els.modalBackdrop.hasAttribute("hidden")) {
    lockBody(false);
  }
  if (restore) restoreFocus();
}

function renderCart() {
  const count = cartItemCount();
  if (els.cartBadge) {
    els.cartBadge.textContent = String(count);
    els.cartBadge.hidden = count === 0;
  }

  const { subtotal, shipping, tax, total } = calculateTotal();
  if (els.cartSubtotal) els.cartSubtotal.textContent = formatMoney(subtotal);
  if (els.cartShipping) {
    els.cartShipping.textContent =
      shipping === 0 && subtotal > 0 ? "Free" : formatMoney(shipping);
  }
  if (els.cartTax) els.cartTax.textContent = formatMoney(tax);
  if (els.cartTotal) els.cartTotal.textContent = formatMoney(total);
  if (els.checkoutPayTotal) els.checkoutPayTotal.textContent = formatMoney(total);
  if (els.checkoutBtn) els.checkoutBtn.disabled = count === 0;

  if (!els.cartList) return;

  if (cart.size === 0) {
    els.cartList.innerHTML = "";
    if (els.cartEmpty) els.cartEmpty.hidden = false;
    return;
  }

  if (els.cartEmpty) els.cartEmpty.hidden = true;

  els.cartList.innerHTML = [...cart.values()]
    .map(
      (item) => `
      <li class="cart-item" data-cart-id="${item.id}">
        <img src="${escapeAttr(item.image || IMG_PLACEHOLDER)}" alt="" width="64" height="64" />
        <div>
          <h3 class="cart-item-title">${escapeHtml(item.title)}</h3>
          <p class="cart-item-price">${formatMoney(item.price)} each</p>
          <div class="cart-item-actions">
            <div class="qty-controls" role="group" aria-label="Quantity">
              <button type="button" data-qty-dec="${item.id}" aria-label="Decrease quantity">−</button>
              <span aria-live="polite">${item.quantity}</span>
              <button type="button" data-qty-inc="${item.id}" aria-label="Increase quantity">+</button>
            </div>
            <button type="button" class="btn btn-ghost btn-compact" data-remove="${item.id}">
              Remove
            </button>
          </div>
        </div>
      </li>
    `
    )
    .join("");

  bindImageFallback(els.cartList);
}

/* --------------------------------------------------------------------------
   Checkout modals
   -------------------------------------------------------------------------- */
function openCheckout() {
  if (cart.size === 0) return;
  closeCart({ restore: false });
  lastFocus = els.cartTrigger || document.activeElement;
  const { total } = calculateTotal();
  if (els.checkoutPayTotal) els.checkoutPayTotal.textContent = formatMoney(total);
  if (els.formView) els.formView.hidden = false;
  if (els.successView) els.successView.hidden = true;
  els.modalBackdrop?.removeAttribute("hidden");
  lockBody(true);
  activateTrap(els.checkoutModal, els.checkoutForm?.querySelector("input"));
}

function closeModals() {
  els.modalBackdrop?.setAttribute("hidden", "");
  if (els.formView) els.formView.hidden = false;
  if (els.successView) els.successView.hidden = true;
  deactivateTrap();
  lockBody(false);
  restoreFocus();
}

function completeOrder(event) {
  event.preventDefault();
  if (cart.size === 0) return;

  const form = els.checkoutForm;
  if (form && !form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const name = form?.elements?.namedItem("name")?.value?.trim() || "Customer";
  const orderId = `MD-${Date.now().toString(36).toUpperCase()}`;
  if (els.successCopy) {
    els.successCopy.textContent = `Thanks, ${name}! Your order ${orderId} is confirmed. A receipt would be emailed in a real store.`;
  }

  cart.clear();
  saveCart();
  renderCart();

  if (els.formView) els.formView.hidden = true;
  if (els.successView) els.successView.hidden = false;
  form?.reset();
  showToast("Order placed");
  activateTrap(els.checkoutModal, els.successDone);
}

/* --------------------------------------------------------------------------
   Events
   -------------------------------------------------------------------------- */
function bindEvents() {
  els.themeToggle?.addEventListener("click", toggleTheme);
  els.statusRetry?.addEventListener("click", () => fetchProducts());

  els.searchInput?.addEventListener("input", (e) => {
    searchQuery = e.target.value.trim();
    renderCatalog();
  });

  els.filterGroup?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-category]");
    if (!btn) return;
    activeFilter = btn.getAttribute("data-category") || "all";
    els.filterGroup.querySelectorAll(".filter-btn").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    renderCatalog();
  });

  els.productGrid?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add]");
    if (!btn) return;
    const id = Number(btn.getAttribute("data-add"));
    const product = products.find((p) => p.id === id);
    if (product) addToCart(product);
  });

  els.cartTrigger?.addEventListener("click", openCart);
  els.cartClose?.addEventListener("click", () => closeCart());
  els.cartBackdrop?.addEventListener("click", () => closeCart());

  els.cartList?.addEventListener("click", (e) => {
    const dec = e.target.closest("[data-qty-dec]");
    const inc = e.target.closest("[data-qty-inc]");
    const rem = e.target.closest("[data-remove]");
    if (dec) {
      const id = Number(dec.getAttribute("data-qty-dec"));
      const item = cart.get(id);
      if (item) updateQuantity(id, item.quantity - 1);
    } else if (inc) {
      const id = Number(inc.getAttribute("data-qty-inc"));
      const item = cart.get(id);
      if (item) updateQuantity(id, item.quantity + 1);
    } else if (rem) {
      removeFromCart(Number(rem.getAttribute("data-remove")));
    }
  });

  els.checkoutBtn?.addEventListener("click", openCheckout);
  els.checkoutClose?.addEventListener("click", closeModals);
  els.successDone?.addEventListener("click", closeModals);
  els.modalBackdrop?.addEventListener("click", (e) => {
    if (e.target === els.modalBackdrop) closeModals();
  });
  els.checkoutForm?.addEventListener("submit", completeOrder);

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (els.modalBackdrop && !els.modalBackdrop.hasAttribute("hidden")) {
      closeModals();
      return;
    }
    if (els.cartDrawer?.classList.contains("is-open")) closeCart();
  });

  window.addEventListener("storage", (e) => {
    if (e.key !== CART_KEY) return;
    syncingFromStorage = true;
    try {
      cart = e.newValue ? parseCartItems(e.newValue) : new Map();
      renderCart();
    } catch {
      /* ignore bad remote payload */
    } finally {
      syncingFromStorage = false;
    }
  });
}

/* --------------------------------------------------------------------------
   Boot
   -------------------------------------------------------------------------- */
function init() {
  applyTheme(getPreferredTheme());
  if (els.cartDrawer) els.cartDrawer.inert = true;
  loadCart();
  bindEvents();
  renderCart();
  fetchProducts();
}

init();
