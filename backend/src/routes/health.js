const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  const uptime = process.uptime();
  const timestamp = new Date().toISOString();

  res.json({
    status: "healthy",
    timestamp,
    uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    services: {
      github:
        !!process.env.GITHUB_TOKEN ||
        !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
      llm: !!process.env.GROQ_API_KEY, // Updated to use Groq API key
    },
  });
});

module.exports = router;
