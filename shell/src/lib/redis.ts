import { createClient, type RedisClientType } from "redis";

/**
 * Shared Redis (Valkey) client. Server-side only — never import this from a
 * client component. Uses a lazy singleton so hot-reload in dev doesn't open a
 * new connection on every request.
 */

declare global {
  // eslint-disable-next-line no-var
  var __redisClient: RedisClientType | undefined;
  // eslint-disable-next-line no-var
  var __redisConnecting: Promise<RedisClientType> | undefined;
}

// Clear a rejected connection promise left behind by an earlier module version
// during Next.js hot reload. Otherwise the updated client would keep awaiting
// the same already-rejected promise until the dev server is restarted.
if (globalThis.__redisConnecting) {
  const pendingConnection = globalThis.__redisConnecting;
  void pendingConnection.catch(() => {
    if (globalThis.__redisConnecting === pendingConnection) {
      globalThis.__redisConnecting = undefined;
      globalThis.__redisClient = undefined;
    }
  });
}

function buildClient(): RedisClientType {
  const host = process.env.REDIS_HOST || "127.0.0.1";
  const port = Number(process.env.REDIS_PORT || 6379);
  const username = process.env.REDIS_USERNAME || undefined;
  const password = process.env.REDIS_PASSWORD || undefined;

  const client = createClient({
    socket: {
      host,
      port,
      // Fail fast instead of hanging when Redis is unreachable, so routes can
      // return a timely error (login -> 503, gateway -> mock fallback).
      connectTimeout: 5000,
      reconnectStrategy: (retries) => (retries > 3 ? false : Math.min(retries * 200, 1000)),
    },
    username,
    password,
  }) as RedisClientType;

  client.on("error", (err) => {
    // Keep noise low but visible; the gateway degrades gracefully on failure.
    console.error("[redis] client error:", err?.message ?? err);
  });

  return client;
}

/**
 * Returns a connected Redis client, reusing the singleton across requests and
 * hot reloads.
 */
export async function getRedis(): Promise<RedisClientType> {
  if (globalThis.__redisClient?.isOpen) {
    return globalThis.__redisClient;
  }
  if (globalThis.__redisConnecting) {
    return globalThis.__redisConnecting;
  }

  const client = globalThis.__redisClient ?? buildClient();
  globalThis.__redisClient = client;

  globalThis.__redisConnecting = (async () => {
    try {
      if (!client.isOpen) {
        await client.connect();
      }
      return client;
    } catch (error) {
      // A refused connection must not poison the singleton forever. Redis may
      // become available later, and the next request should get a fresh client.
      globalThis.__redisClient = undefined;
      throw error;
    } finally {
      globalThis.__redisConnecting = undefined;
    }
  })();

  return globalThis.__redisConnecting;
}

/** Prefix applied to every session key, e.g. "test-micro-fe:". */
export function keyPrefix(): string {
  return process.env.REDIS_KEY_PREFIX || "";
}
