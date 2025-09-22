const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { RateLimiterMemory } = require("rate-limiter-flexible");
require("dotenv").config();

const roastRoutes = require("./src/routes/roast");
const userRoutes = require("./src/routes/user");
const healthRoutes = require("./src/routes/health");

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyBy: (req) => req.ip,
  points: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  duration: process.env.RATE_LIMIT_WINDOW_MS || 900, // 15 minutes
});

const rateLimiterMiddleware = async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set("Retry-After", String(secs));
    res.status(429).json({
      error: "Too many requests",
      retryAfter: secs,
    });
  }
};

// Middleware
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://your-frontend-domain.com"]
        : [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:5173",
            "http://localhost:5174",
          ],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiterMiddleware);

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/roast", roastRoutes);
app.use("/api/user", userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);

  if (err.status === 404) {
    return res.status(404).json({ error: "GitHub user not found" });
  }

  if (err.response?.status === 403) {
    return res.status(403).json({
      error: "GitHub API rate limit exceeded",
      message: "Please try again later",
    });
  }

  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`🚀 RoastRepo backend running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});
