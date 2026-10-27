/**
 * Atmos local server
 * - Serves the static HTML/CSS/JS app
 * - Proxies OpenWeatherMap requests so OPENWEATHER_API_KEY stays on the server
 */
require("dotenv").config();

const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT) || 8083;
const API_KEY = (process.env.OPENWEATHER_API_KEY || "").trim();
const OWM_BASE = "https://api.openweathermap.org/data/2.5";
const ROOT = __dirname;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

/** Send a JSON response */
function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(payload);
}

/** Serve a file from this folder (index.html for "/") */
function serveStatic(req, res, pathname) {
  const relative = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(ROOT, decodeURIComponent(relative)));

  // Block path traversal outside this folder
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const type = MIME[path.extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  });
}

/**
 * Proxy OpenWeatherMap: /api/weather?q=City or /api/forecast?q=City
 * The browser never sees OPENWEATHER_API_KEY.
 */
async function proxyWeather(res, endpoint, city) {
  if (!API_KEY) {
    sendJson(res, 500, {
      message:
        "Server missing OPENWEATHER_API_KEY. Copy .env.example to .env and add your key.",
    });
    return;
  }

  if (!city) {
    sendJson(res, 400, { message: "Missing city query (?q=City)." });
    return;
  }

  const url = `${OWM_BASE}/${endpoint}?q=${encodeURIComponent(city)}&units=metric&appid=${encodeURIComponent(API_KEY)}`;

  try {
    const upstream = await fetch(url);
    const data = await upstream.json();

    if (!upstream.ok) {
      sendJson(res, upstream.status, {
        message: data.message || `OpenWeatherMap error (${upstream.status})`,
        cod: data.cod,
      });
      return;
    }

    sendJson(res, 200, data);
  } catch (error) {
    sendJson(res, 502, {
      message: "Could not reach OpenWeatherMap. Check your network and try again.",
      detail: error.message,
    });
  }
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const { pathname, searchParams } = requestUrl;

  if (pathname === "/api/weather") {
    proxyWeather(res, "weather", (searchParams.get("q") || "").trim());
    return;
  }

  if (pathname === "/api/forecast") {
    proxyWeather(res, "forecast", (searchParams.get("q") || "").trim());
    return;
  }

  // Health check used by the UI to confirm the server (and key) are ready
  if (pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      hasApiKey: Boolean(API_KEY),
    });
    return;
  }

  serveStatic(req, res, pathname);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Atmos running at http://127.0.0.1:${PORT}`);
  if (!API_KEY) {
    console.warn(
      "Warning: OPENWEATHER_API_KEY is empty. Add it to task3-weather-forecast/.env"
    );
  }
});
