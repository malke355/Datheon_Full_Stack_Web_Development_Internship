/**
 * Atmos local server
 * - Serves the static HTML/CSS/JS app
 * - Proxies OpenWeatherMap so OPENWEATHER_API_KEY stays on the server
 *
 * On Vercel, /api/* is handled by the serverless files in ./api instead.
 */
require("dotenv").config();

const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const { getApiKey, fetchOpenWeather } = require("./lib/owm");

const PORT = Number(process.env.PORT) || 8083;
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

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
}

function serveStatic(req, res, pathname) {
  const relative = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(ROOT, decodeURIComponent(relative)));
  const asPosix = filePath.replace(/\\/g, "/");

  // Block path traversal and secrets
  if (
    !filePath.startsWith(ROOT) ||
    asPosix.includes("/node_modules/") ||
    /\/\.env(\.|$)/.test(asPosix)
  ) {
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

async function proxyWeather(res, endpoint, city) {
  try {
    const data = await fetchOpenWeather(endpoint, city);
    sendJson(res, 200, data);
  } catch (error) {
    sendJson(res, error.status || 502, {
      message: error.message || "Weather request failed",
      cod: error.cod,
      detail: error.detail,
    });
  }
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const { pathname, searchParams } = requestUrl;
  const city = (searchParams.get("q") || "").trim();

  if (pathname === "/api/weather") {
    proxyWeather(res, "weather", city);
    return;
  }

  if (pathname === "/api/forecast") {
    proxyWeather(res, "forecast", city);
    return;
  }

  if (pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      hasApiKey: Boolean(getApiKey()),
    });
    return;
  }

  serveStatic(req, res, pathname);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Atmos running at http://127.0.0.1:${PORT}`);
  if (!getApiKey()) {
    console.warn(
      "Warning: OPENWEATHER_API_KEY is empty. Add it to task3-weather-forecast/.env"
    );
  }
});
