# Live Demo

**Live site:** _Deploy to Vercel, then paste the production URL here._

Deployed as a **static site** on Vercel (Root Directory = `task4-ecommerce-store`). No API key, no build step.

Local demo: [http://127.0.0.1:8084](http://127.0.0.1:8084) (`npx serve -l 8084`)

---

# Task 4 — Meridian  
### Commerce Product Catalog & Interactive Shopping Cart

**Meridian** is a modern e-commerce storefront for the **Datheon Full Stack Web Development Internship — Task 4**. It loads a live product catalog from **FakeStoreAPI**, filters by category, and drives a persistent **slide-out shopping cart** with quantity math, tax, shipping, and a simulated checkout confirmation.

Built with **plain HTML5, CSS3, and vanilla JavaScript** — no React, no Vite, no bundler, no API key, no backend.

> **Brand feel:** same visual family as Tasks 1–3 — Syne + Atkinson Hyperlegible, deep teal / slate, amber accents.

---

## What you can do

Browse → filter / search → add to cart → adjust quantities → checkout:

| You see / do | How it works |
| --- | --- |
| Product grid | Live data from `https://fakestoreapi.com/products` |
| Cards | Image, title, star rating + review count, price, category badge |
| Filters | **All · Electronics · Jewelry · Clothing** (men’s + women’s clothing grouped) |
| Search | Live match on title, category, or description |
| Cart badge | Navbar counter of total units |
| Slide-out drawer | Qty ±, remove, subtotal / shipping / tax / total |
| Checkout | Simulated modal (name, email, address) → order ID confirmation |

**Shipping:** **$5.99** under $100 subtotal · **Free** at $100+ · **Tax:** 8% of subtotal.

While the catalog loads you see **skeleton cards**. If FakeStoreAPI is down, Meridian retries, then falls back to the **last cached catalog** (or a clear error + **Retry**).

---

## Overview

Meridian is a **pure client-side** storefront:

1. **Browser** — catalog UI, filters, cart drawer, checkout modal, theme  
2. **FakeStoreAPI** — public product JSON (CORS-enabled, no key)  
3. **`localStorage`** — cart persistence + last successful product cache

```text
┌─────────────┐   GET /products    ┌─────────────────┐
│   Browser   │ ─────────────────► │  FakeStoreAPI   │
│  script.js  │ ◄───────────────── │  (public JSON)  │
└─────────────┘   product array    └─────────────────┘
       │
       ├── cart Map ──► localStorage (meridian-cart-v1)
       └── product cache ► localStorage (meridian-products-v1)
```

No proxy, no secrets, no `npm install` required to demo.

---

## Features

### Catalog
- Fetch from FakeStoreAPI with timeout + automatic retries  
- CSS Grid product cards (ratings, prices, badges)  
- Search + category filter chips  
- Skeleton loaders while fetching  
- Empty states for “no matches” vs “catalog failed to load”  
- Broken-image placeholder if a product CDN URL fails  

### Cart & checkout
- Slide-out drawer + navbar badge counter  
- Core actions: `addToCart()`, `removeFromCart()`, `updateQuantity()`, `calculateTotal()`  
- Subtotal, **8% tax**, shipping rules, grand total  
- Simulated checkout modal → confirmation with order ID (`MD-…`)  
- Cart survives reloads; syncs across browser tabs via `storage` events  

### Resilience & UX
- Retry button when the network / API fails  
- Cached catalog shown with a warning if live fetch fails  
- Toast feedback for add / remove / order placed  
- Escape closes drawer or modal  

### Design & accessibility
- Light / dark theme (persisted; first visit respects `prefers-color-scheme`)  
- Skip link, labeled controls, focus-visible outlines  
- Focus trap + focus restore on cart drawer and checkout modal  
- Drawer marked `inert` / `aria-hidden` when closed  
- Motion respects `prefers-reduced-motion`  
- Mobile-responsive layout (Grid / Flex)

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Markup | HTML5 (semantic regions, dialogs, labeled form) |
| Styles | CSS3 (custom properties, Grid, drawer / modal, themes) |
| Logic | Vanilla JavaScript (ES6+, `fetch`, `async`/`await`, `Map`) |
| Data | [FakeStoreAPI](https://fakestoreapi.com/) `GET /products` |
| State | In-memory `Map` + `localStorage` |
| Fonts | Google Fonts — Syne, Atkinson Hyperlegible |

No frontend framework. No npm dependencies for the app itself (optional `serve` only for local hosting).

---

## How it works

### 1. Load catalog
`fetchProducts()` calls FakeStoreAPI with an abort timeout. On success it caches the array and renders cards. On repeated failure it restores the last cache (if any) or shows an error with **Retry**.

### 2. Filter & search
Category chips map FakeStore categories:

| FakeStore category | Filter chip |
| --- | --- |
| `electronics` | Electronics |
| `jewelery` | Jewelry |
| `men's clothing` / `women's clothing` | Clothing |

Search is client-side and combines with the active filter.

### 3. Cart state
Items live in a `Map` keyed by product `id`. Mutations call `saveCart()` then `renderCart()` so the badge, line items, and totals stay in sync.

### 4. Totals

```text
subtotal  = Σ (price × quantity)
shipping  = 0 if cart empty OR subtotal ≥ $100, else $5.99
tax       = subtotal × 0.08
total     = subtotal + shipping + tax
```

### 5. Checkout
Checkout is **simulated** — no payment processor. Valid form → clear cart → show confirmation with a generated order ID. Suitable for demos and internship review, not production commerce.

---

## Folder structure

```text
task4-ecommerce-store/
├── index.html    # Storefront shell, cart drawer, checkout modal
├── style.css     # Layout, theme tokens, skeletons, drawer & modal
├── script.js     # Fetch, filters, cart math, a11y traps, checkout
└── README.md
```

---

## Setup & run

### Requirements
- A modern browser  
- Network access to FakeStoreAPI (first load)  
- Any static file server

### Start locally

```bash
cd task4-ecommerce-store
npx --yes serve -l 8084
```

Open **[http://127.0.0.1:8084](http://127.0.0.1:8084)**.

Or with Python:

```bash
python -m http.server 8084
```

> Opening `index.html` as a `file://` URL may block `fetch` in some browsers. Prefer a local static server.

No `.env`. No API key. No `npm install` for the app.

---

## Deploy — Vercel

Meridian is a **static** site (unlike Task 3 Atmos, which needs serverless `/api/*`).

### Correct Vercel settings

1. Import **`malke355/Datheon_Full_Stack_Web_Development_Internship`**
2. **Root Directory** → `task4-ecommerce-store`  
   *(Do not leave this as the repo root.)*
3. **Framework Preset** → **Other**
4. **Build Command** → leave empty  
5. **Output Directory** → leave empty (or `.`)  
6. **Install Command** → leave empty / default  
7. Deploy → open the URL → confirm products load  
8. Paste the production URL into **Live Demo** at the top of this README

GitHub Pages also works if you publish this folder as the site root.

### After deploy

Confirm the browser can reach `https://fakestoreapi.com/products`. If the API is temporarily down, users still get **Retry** and any previously cached catalog.

---

## Project checklist (Task 4 brief)

| Requirement | Status |
| --- | --- |
| Fetch product catalog from FakeStoreAPI | Done |
| Product cards with ratings, prices, badges | Done |
| Category filtering (Electronics, Jewelry, Clothing) | Done |
| Product search | Done |
| Slide-out shopping cart drawer | Done |
| Navbar cart badge counter | Done |
| `addToCart()` / `removeFromCart()` / `updateQuantity()` / `calculateTotal()` | Done |
| Tax + shipping + subtotal math | Done |
| Simulated checkout with order confirmation | Done |
| CSS Grid layout | Done |
| Clean responsive / mobile layout | Done |
| Plain HTML / CSS / JS | Done |

---

## Notes for reviewers

- Checkout is intentionally **simulated** (brief requirement) — no Stripe / PayPal.  
- Tax (8%) and shipping ($5.99 / free over $100) are **demo rules**, not real rates.  
- FakeStoreAPI is a third-party demo API; occasional latency or downtime is expected — Meridian retries and caches for that reason.  
- Vanilla JS keeps cart math easy to read for evaluation without a framework build step.

---

## License

Prepared for the Datheon Full Stack Web Development Internship — Task 4.
