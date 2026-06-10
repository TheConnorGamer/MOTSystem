import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
  retryStrategy: () => null,
});

redis.on("error", () => {
  // Suppress connection error spam — Redis is optional for dev
});

export const getRedis = () => redis;
