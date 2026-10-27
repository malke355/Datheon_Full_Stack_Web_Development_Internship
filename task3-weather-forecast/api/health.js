/**
 * Vercel serverless — GET /api/health
 */
const { getApiKey } = require("../lib/owm");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  res.status(200).json({
    ok: true,
    hasApiKey: Boolean(getApiKey()),
  });
};
