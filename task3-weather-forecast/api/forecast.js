/**
 * Vercel serverless — GET /api/forecast?q=City
 */
const { fetchOpenWeather } = require("../lib/owm");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  try {
    const city = String(req.query.q || "").trim();
    const data = await fetchOpenWeather("forecast", city);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.status || 502).json({
      message: error.message || "Forecast request failed",
      cod: error.cod,
    });
  }
};
