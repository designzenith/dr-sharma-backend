const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  // Optional: better error messages during development
  // showFriendlyErrorStack: true,
});

redis.on("connect", () => {
  console.log("✅ Redis Connected Successfully");
});

redis.on("error", (err) => {
  console.error("❌ Redis connection error:", err.message);
});

module.exports = redis;