import { createClient } from "redis";

const fallbackRedisClient = {
  get: async () => null,
  setEx: async () => null,
  del: async () => null,
};

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

let redisClient = fallbackRedisClient;

try {
  const client = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: false,
    },
  });

  client.on("error", (err) => {
    console.error("Redis Error:", err.message);
  });

  await client.connect();
  console.log("Redis connected");
  redisClient = client;
} catch (error) {
  console.warn("Redis disabled:", error.message);
}

export default redisClient;
