# Live Demo

**Live site:** _Coming soon — replace this URL after you deploy_

Local demo (with your own API key): [http://127.0.0.1:8083](http://127.0.0.1:8083)

---

# Task 3 — Atmos  
### Real-Time Weather Forecast & Climate Telemetry

**Atmos** is a live weather app for the **Datheon Full Stack Web Development Internship — Task 3**. Search any city on Earth and get current conditions plus a five-day outlook, powered by the **OpenWeatherMap** REST API.

Built with **plain HTML5, CSS3, and vanilla JavaScript** — no React, no Vite, no bundler. A small **Node.js** server serves the UI and **proxies** weather requests so your API key stays in `.env` and never ships to the browser.

> **Brand feel:** same visual family as Tasks 1–2 — Syne + Atkinson Hyperlegible, deep teal / slate, amber accents — with a sky that literally changes with the weather.

---

## What you can do

Type a city → Atmos fetches live telemetry in parallel → the page updates:

| You see | Source |
| --- | --- |
| Temperature (°C) | Current weather API |
| Feels-like temperature | Current weather API |
| Condition + icon (sunny, rain, clouds, …) | Weather `main` / `description` + OpenWeatherMap icons |
| Humidity, wind speed, pressure | Current weather API |
| 5-day forecast cards (hi / lo + icon) | Forecast API (3-hour slots → daily cards via `Array.map()`) |

While data loads, the search button shows a **spinner**. If the city is unknown or the network fails, you get a **clear, friendly error** — not a blank screen or raw JSON.

---

## Overview

Atmos is a **client + thin proxy** app:

1. **Browser** — search form, loading/error UI, current panel, forecast grid, light/dark theme, sky moods  
2. **`server.js`** — static files + `/api/weather` and `/api/forecast`  
3. **OpenWeatherMap** — authoritative climate data (`units=metric`)

```text
┌─────────────┐     /api/weather?q=…      ┌─────────────┐     OpenWeatherMap
│   Browser   │ ────────────────────────► │  server.js  │ ──────────────────►
│  script.js  │ ◄──────────────────────── │  + .env key │ ◄──────────────────
└─────────────┘     JSON (no API key)     └─────────────┘
```

The browser **never** sees `OPENWEATHER_API_KEY`. That is intentional: free keys are secrets and must not be hardcoded in frontend JS.

---

## Features

### Weather & forecast
- Global city search (any place OpenWeatherMap resolves)
- Current temperature and feels-like (°C)
- Human-readable condition + official weather icon  
  `https://openweathermap.org/img/wn/{icon}@2x.png`
- Humidity (%), wind (m/s), atmospheric pressure (hPa)
- **5-day forecast** — daily hi/lo cards built with `Array.map()`
- Remembers the last searched city in `localStorage`

### Resilience & UX
- `async` / `await` + `Promise.all` for current + forecast together
- Loading spinner on **Get weather**
- Friendly messages for:
  - city not found (404)
  - missing / invalid server API key
  - offline / network failures
- Empty state until the first successful search

### Design & accessibility
- Light / dark theme toggle (persisted; first visit respects `prefers-color-scheme`)
- **Dynamic sky gradients** by condition: clear day/night, clouds, rain, storm, snow, mist
- Skip link, labeled controls, focus styles
- Mobile-responsive layout (Flexbox / Grid)
- Motion respects `prefers-reduced-motion`

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Markup | HTML5 (semantic regions, accessible form) |
| Styles | CSS3 (custom properties, Flexbox/Grid, theme + sky tokens) |
| Client logic | Vanilla JavaScript (ES6+, `fetch`, `async`/`await`) |
| Server | Node.js ≥ 18 (`http` + `dotenv`) |
| Weather data | OpenWeatherMap Current Weather + 5 Day / 3 Hour Forecast |
| Icons | OpenWeatherMap icon CDN |
| Fonts | Google Fonts — Syne, Atkinson Hyperlegible |
| Secrets | `.env` → `OPENWEATHER_API_KEY` (gitignored) |

No frontend framework. The only npm dependency is **`dotenv`** so the server can read `.env`.

---

## How it works

### 1. Search
The form submits a city name. `loadWeather(city)` runs:

```js
const [current, forecast] = await Promise.all([
  fetchCurrentWeather(query),  // GET /api/weather?q=…
  fetchForecast(query),        // GET /api/forecast?q=…
]);
```

### 2. Proxy (`server.js`)
For each `/api/*` request the server:

1. Reads `OPENWEATHER_API_KEY` from the environment  
2. Calls OpenWeatherMap with `units=metric`  
3. Returns JSON to the browser (or a clear error status/message)

| App route | Upstream |
| --- | --- |
| `GET /api/weather?q={city}` | `https://api.openweathermap.org/data/2.5/weather` |
| `GET /api/forecast?q={city}` | `https://api.openweathermap.org/data/2.5/forecast` |
| `GET /api/health` | Local readiness check (`hasApiKey`) |

### 3. Forecast cards
OpenWeatherMap’s free forecast returns **3-hour** slots. Atmos groups them by calendar day, picks a midday-ish representative icon/description, computes daily **hi/lo**, then renders cards with **`Array.map()`**.

### 4. Sky mood
`resolveSkyMood(weather.main, icon)` maps conditions to `data-sky` on `<html>` (e.g. `rain`, `clear-night`). CSS variables drive the full-bleed gradient. UI chrome (panels, text) follows **`data-theme`** (light/dark) separately — so rain can still look stormy in light mode without washing out the type.

---

## Folder structure

```text
task3-weather-forecast/
├── index.html          # Page structure + theme FOUC guard
├── style.css           # Layout, light/dark, sky moods
├── script.js           # Search, fetch, render, theme
├── server.js           # Static hosting + OpenWeatherMap proxy
├── package.json        # npm start → node server.js
├── package-lock.json
├── .env.example        # Safe placeholder (committed)
├── .env                # Your real key (gitignored — never commit)
├── .gitignore
└── README.md
```

---

## Setup & run

### 1. API key
1. Create a free account at [openweathermap.org](https://openweathermap.org/)  
2. Copy a key from [API keys](https://home.openweathermap.org/api_keys)  
3. New keys can take up to **~10 minutes** to activate

### 2. Configure environment

```bash
cd task3-weather-forecast
cp .env.example .env
```

Edit `.env`:

```env
OPENWEATHER_API_KEY=your_real_key_here
PORT=8083
```

| Variable | Required | Description |
| --- | --- | --- |
| `OPENWEATHER_API_KEY` | Yes | Free OpenWeatherMap key |
| `PORT` | No | Local port (default `8083`) |

### 3. Install & start

```bash
npm install
npm start
```

Open **[http://127.0.0.1:8083](http://127.0.0.1:8083)** → search a city (try `Addis Ababa`, `London`, or `Tokyo`).

> Opening `index.html` as a file will **not** load live weather — the proxy must be running so the key stays server-side.

---

## Security notes

- **Do not hardcode** the API key in `script.js`, `index.html`, or the README  
- **Do not commit** `.env` — it is listed in `.gitignore`  
- Commit **`.env.example`** only (placeholder value)  
- The browser only talks to `/api/*` on your machine (or your host); the key is appended server-side when calling OpenWeatherMap

---

## Deploy notes

Static-only hosts (plain GitHub Pages / Vercel with no server) cannot hide the key. To go live you typically:

1. Deploy the Node app (or serverless functions that wrap the same proxy logic)  
2. Set `OPENWEATHER_API_KEY` in the host’s environment dashboard  
3. Paste the public URL into **Live Demo** above  

Vercel / Railway / Render all work if the start command is `npm start` and the env var is set.

---

## Screenshots

Optional for reviewers — capture after a successful search:

| Viewport | Suggested file |
| --- | --- |
| Desktop (clear day) | `assets/screenshot-desktop-clear.png` |
| Desktop (rain / dark) | `assets/screenshot-desktop-rain.png` |
| Mobile | `assets/screenshot-mobile.png` |

```markdown
![Desktop clear](assets/screenshot-desktop-clear.png)
![Desktop rain](assets/screenshot-desktop-rain.png)
![Mobile](assets/screenshot-mobile.png)
```

---

## Project checklist (Task 3 brief)

| Requirement | Status |
| --- | --- |
| City search box | Done |
| Current temp, feels-like, description, humidity, wind, icon | Done |
| 5-day forecast | Done |
| Friendly errors (invalid city / request fail) | Done |
| Loading state while fetching | Done |
| Clean responsive / mobile layout | Done |
| OpenWeatherMap current + forecast endpoints, `units=metric` | Done |
| Icons via `openweathermap.org/img/wn/{icon}@2x.png` | Done |
| Key from `OPENWEATHER_API_KEY` — not hardcoded | Done |
| `.env` + `.env.example` + `.gitignore` | Done |
| Plain HTML / CSS / JS, small clear functions | Done |

---

## License

Prepared for the Datheon Full Stack Web Development Internship — Task 3.
