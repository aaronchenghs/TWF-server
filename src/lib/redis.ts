import { createClient } from "redis";
import { readStringEnv } from "./env.js";

type AppRedisClient = ReturnType<typeof createClient>;

let redisClient: AppRedisClient | null = null;
let connectPromise: Promise<AppRedisClient | null> | null = null;

function getRedisUrl(): string {
  return readStringEnv("REDIS_URL", "");
}

/**
 * Returns whether Redis-backed persistence is enabled for this process.
 * The feature is considered enabled only when `REDIS_URL` is configured.
 */
export function isRedisConfigured(): boolean {
  return getRedisUrl().length > 0;
}

/**
 * Lazily opens and memoizes a shared Redis connection for the current process.
 * Returns `null` when Redis is not configured so callers can stay no-op safe.
 */
export async function connectRedis(): Promise<AppRedisClient | null> {
  const redisUrl = getRedisUrl();
  if (redisUrl.length === 0) return null;
  if (!isRedisConfigured()) return null;
  if (redisClient?.isOpen) return redisClient;
  if (connectPromise) return connectPromise;

  const nextClient = createClient({ url: redisUrl });
  nextClient.on("error", (error) => {
    console.error("[redis] client error", error);
  });

  connectPromise = nextClient
    .connect()
    .then(() => {
      redisClient = nextClient;
      return nextClient;
    })
    .catch((error) => {
      connectPromise = null;
      throw error;
    });

  return connectPromise;
}

/**
 * Gracefully closes the shared Redis client during process shutdown.
 * Safe to call even when Redis was never configured or never connected.
 */
export async function closeRedis(): Promise<void> {
  const activeClient = redisClient;
  redisClient = null;
  connectPromise = null;

  if (!activeClient) return;
  if (!activeClient.isOpen) return;

  await activeClient.quit();
}
