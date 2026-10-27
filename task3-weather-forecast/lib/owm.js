/**
 * Shared OpenWeatherMap helper (local server + Vercel serverless).
 * The API key is read only from process.env — never from the browser.
 */

const OWM_BASE = "https://api.openweathermap.org/data/2.5";

function getApiKey() {
  return (process.env.OPENWEATHER_API_KEY || "").trim();
}

/**
 * Fetch a Current Weather or Forecast payload.
 * @param {"weather"|"forecast"} endpoint
 * @param {string} city
 */
async function fetchOpenWeather(endpoint, city) {
  const apiKey = getApiKey();

  if (!apiKey) {
    const error = new Error(
      "Server missing OPENWEATHER_API_KEY. Add it in .env (local) or Vercel Environment Variables."
    );
    error.status = 500;
    throw error;
  }

  const query = String(city || "").trim();
  if (!query) {
    const error = new Error("Missing city query (?q=City).");
    error.status = 400;
    throw error;
  }

  const url = `${OWM_BASE}/${endpoint}?q=${encodeURIComponent(query)}&units=metric&appid=${encodeURIComponent(apiKey)}`;

  let upstream;
  try {
    upstream = await fetch(url);
  } catch (networkError) {
    const error = new Error(
      "Could not reach OpenWeatherMap. Check your network and try again."
    );
    error.status = 502;
    error.detail = networkError.message;
    throw error;
  }

  const data = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    const error = new Error(
      data.message || `OpenWeatherMap error (${upstream.status})`
    );
    error.status = upstream.status;
    error.cod = data.cod;
    throw error;
  }

  return data;
}

module.exports = {
  getApiKey,
  fetchOpenWeather,
};
