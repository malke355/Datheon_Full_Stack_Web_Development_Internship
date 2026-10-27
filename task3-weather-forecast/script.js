/**
 * Atmos — frontend
 * Talks to our local /api/* proxy (API key never appears in the browser).
 */

const LAST_CITY_KEY = "atmos.lastCity.v1";
const THEME_KEY = "atmos.theme.v1";
const ICON_BASE = "https://openweathermap.org/img/wn";

const els = {
  themeToggle: document.getElementById("theme-toggle"),
  searchForm: document.getElementById("search-form"),
  cityInput: document.getElementById("city-input"),
  searchBtn: document.getElementById("search-btn"),
  statusMessage: document.getElementById("status-message"),
  currentPanel: document.getElementById("current-panel"),
  forecastPanel: document.getElementById("forecast-panel"),
  emptyState: document.getElementById("empty-state"),
  placeName: document.getElementById("current-heading"),
  placeMeta: document.getElementById("place-meta"),
  conditionIcon: document.getElementById("condition-icon"),
  tempValue: document.getElementById("temp-value"),
  conditionLabel: document.getElementById("condition-label"),
  feelsLike: document.getElementById("feels-like"),
  humidity: document.getElementById("humidity"),
  wind: document.getElementById("wind"),
  pressure: document.getElementById("pressure"),
  forecastGrid: document.getElementById("forecast-grid"),
  metaTheme: document.getElementById("meta-theme-color"),
};

/* ---------- Theme ---------- */

function getPreferredTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch (_) {
    /* ignore */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme) {
  const next = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch (_) {
    /* ignore */
  }
  if (els.themeToggle) {
    const label =
      next === "dark" ? "Switch to light theme" : "Switch to dark theme";
    els.themeToggle.setAttribute("aria-label", label);
    els.themeToggle.title = label;
  }
  syncThemeColor();
}

function syncThemeColor() {
  if (!els.metaTheme) return;
  const sky = document.documentElement.getAttribute("data-sky") || "clear-day";
  const colors = {
    "clear-day": "#2f7ea0",
    "clear-night": "#0b1c2c",
    clouds: "#4d636a",
    rain: "#1e3340",
    storm: "#0d1418",
    snow: "#6f93a8",
    mist: "#5f706c",
  };
  els.metaTheme.setAttribute("content", colors[sky] || "#0F2E2F");
}

/* ---------- API helpers (via local proxy) ---------- */

async function fetchJson(url) {
  const response = await fetch(url);
  let data = null;
  try {
    data = await response.json();
  } catch (_) {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(
      (data && data.message) || `Request failed (${response.status})`
    );
    error.status = response.status;
    throw error;
  }

  return data;
}

/** Current weather for a city */
function fetchCurrentWeather(city) {
  return fetchJson(`/api/weather?q=${encodeURIComponent(city)}`);
}

/** 5-day / 3-hour forecast for a city */
function fetchForecast(city) {
  return fetchJson(`/api/forecast?q=${encodeURIComponent(city)}`);
}

/**
 * Collapse 3-hour forecast slots into one card per day.
 * Uses Array.map() for the final card list.
 */
function buildDailyForecast(list) {
  if (!Array.isArray(list)) return [];

  const byDay = list.reduce((acc, item) => {
    const date = new Date(item.dt * 1000);
    const key = date.toISOString().slice(0, 10);
    if (!acc[key]) {
      acc[key] = { key, date, temps: [], items: [] };
    }
    acc[key].temps.push(item.main.temp);
    acc[key].items.push(item);
    return acc;
  }, {});

  return Object.values(byDay)
    .slice(0, 5)
    .map((day) => {
      const noonish =
        day.items.find((item) => {
          const hour = new Date(item.dt * 1000).getHours();
          return hour >= 11 && hour <= 14;
        }) || day.items[Math.floor(day.items.length / 2)];

      const weather = noonish.weather[0] || {};
      return {
        key: day.key,
        date: day.date,
        hi: Math.round(Math.max(...day.temps)),
        lo: Math.round(Math.min(...day.temps)),
        description: weather.description || "—",
        icon: weather.icon || "01d",
      };
    });
}

/* ---------- Sky mood / UI helpers ---------- */

function resolveSkyMood(weatherMain, iconCode) {
  const main = String(weatherMain || "").toLowerCase();
  const isNight = String(iconCode || "").endsWith("n");

  if (main.includes("thunder")) return "storm";
  if (main.includes("drizzle") || main.includes("rain")) return "rain";
  if (main.includes("snow")) return "snow";
  if (
    main.includes("mist") ||
    main.includes("fog") ||
    main.includes("haze") ||
    main.includes("smoke") ||
    main.includes("dust")
  ) {
    return "mist";
  }
  if (main.includes("cloud")) return "clouds";
  if (main.includes("clear")) return isNight ? "clear-night" : "clear-day";
  return isNight ? "clear-night" : "clouds";
}

function applySkyMood(mood) {
  document.documentElement.setAttribute("data-sky", mood);
  syncThemeColor();
}

function setLoading(isLoading) {
  els.searchBtn?.classList.toggle("is-loading", isLoading);
  els.searchBtn?.setAttribute("aria-busy", isLoading ? "true" : "false");
  if (els.cityInput) els.cityInput.disabled = isLoading;
}

function showStatus(message, { isError = false } = {}) {
  if (!els.statusMessage) return;
  els.statusMessage.hidden = false;
  els.statusMessage.textContent = message;
  els.statusMessage.classList.toggle("is-error", isError);
}

function hideStatus() {
  if (!els.statusMessage) return;
  els.statusMessage.hidden = true;
  els.statusMessage.textContent = "";
  els.statusMessage.classList.remove("is-error");
}

function formatWeekday(date) {
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

function formatShortDate(date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ---------- Render ---------- */

function renderCurrent(data) {
  const weather = data.weather[0] || {};
  const icon = weather.icon || "01d";
  const place = [data.name, data.sys?.country].filter(Boolean).join(", ");

  els.placeName.textContent = place || "Unknown location";
  els.placeMeta.textContent = weather.description || "—";
  els.conditionIcon.src = `${ICON_BASE}/${icon}@2x.png`;
  els.conditionIcon.alt = weather.description || "Weather condition";
  els.tempValue.textContent = String(Math.round(data.main.temp));
  els.conditionLabel.textContent = weather.main || weather.description || "—";
  els.feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;
  els.humidity.textContent = `${data.main.humidity}%`;
  els.wind.textContent = `${Number(data.wind.speed).toFixed(1)} m/s`;
  els.pressure.textContent = `${data.main.pressure} hPa`;

  applySkyMood(resolveSkyMood(weather.main, icon));
  els.currentPanel.hidden = false;
  els.emptyState.hidden = true;
}

function renderForecast(daily) {
  els.forecastGrid.innerHTML = "";

  const cards = daily.map((day) => {
    const card = document.createElement("article");
    card.className = "forecast-card";
    card.setAttribute("role", "listitem");
    card.innerHTML = `
      <p class="forecast-day">${formatWeekday(day.date)}</p>
      <p class="forecast-date">${formatShortDate(day.date)}</p>
      <img class="forecast-icon" src="${ICON_BASE}/${day.icon}@2x.png" alt="${day.description}" width="52" height="52" />
      <p class="forecast-temps"><span class="hi">${day.hi}°</span> <span class="lo">/ ${day.lo}°</span></p>
      <p class="forecast-desc">${day.description}</p>
    `;
    return card;
  });

  cards.forEach((card) => els.forecastGrid.appendChild(card));
  els.forecastPanel.hidden = daily.length === 0;
}

function resetResults() {
  els.currentPanel.hidden = true;
  els.forecastPanel.hidden = true;
  els.emptyState.hidden = false;
  applySkyMood("clouds");
}

/* ---------- Controllers ---------- */

async function loadWeather(city) {
  const query = city.trim();
  if (!query) {
    showStatus("Enter a city name to search.", { isError: true });
    return;
  }

  hideStatus();
  setLoading(true);
  showStatus("Fetching live weather…");

  try {
    const [current, forecast] = await Promise.all([
      fetchCurrentWeather(query),
      fetchForecast(query),
    ]);

    renderCurrent(current);
    renderForecast(buildDailyForecast(forecast.list));

    try {
      localStorage.setItem(LAST_CITY_KEY, query);
    } catch (_) {
      /* ignore */
    }

    showStatus(
      `Showing weather for ${current.name}${
        current.sys?.country ? `, ${current.sys.country}` : ""
      }.`
    );
  } catch (error) {
    resetResults();

    const status = error && error.status;
    if (status === 404) {
      showStatus(
        `City not found: “${query}”. Check the spelling and try again.`,
        { isError: true }
      );
    } else if (status === 500 && /OPENWEATHER_API_KEY/i.test(error.message || "")) {
      showStatus(
        "Server is missing OPENWEATHER_API_KEY. Add it to .env and restart npm start.",
        { isError: true }
      );
    } else if (!navigator.onLine) {
      showStatus("You’re offline. Reconnect and try again.", { isError: true });
    } else {
      showStatus(
        `Couldn’t load weather${
          error?.message ? ` — ${error.message}` : ". Please try again."
        }`,
        { isError: true }
      );
    }
  } finally {
    setLoading(false);
  }
}

function bindEvents() {
  els.themeToggle?.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
  });

  els.searchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    loadWeather(els.cityInput.value);
  });
}

async function checkServerHealth() {
  try {
    const health = await fetchJson("/api/health");
    if (!health.hasApiKey) {
      showStatus(
        "Add OPENWEATHER_API_KEY to .env (see .env.example), then restart the server.",
        { isError: true }
      );
    }
  } catch (_) {
    showStatus(
      "Start the app with npm start from task3-weather-forecast (local proxy required).",
      { isError: true }
    );
  }
}

function init() {
  applyTheme(getPreferredTheme());
  bindEvents();
  checkServerHealth();

  try {
    const lastCity = localStorage.getItem(LAST_CITY_KEY);
    if (lastCity) {
      els.cityInput.value = lastCity;
    }
  } catch (_) {
    /* ignore */
  }
}

init();
