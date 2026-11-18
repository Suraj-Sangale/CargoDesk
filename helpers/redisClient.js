/**
 * Upstash Redis REST Client for CargoDesk.
 *
 * Utilizes native global fetch with zero external npm dependencies.
 * Provides resilient fail-open execution (if Redis is offline or credentials
 * are missing, it gracefully returns null/fallback without breaking the app).
 */

const REST_URL = process.env.UPSTASH_REDIS_REST_URL?.trim();
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

let isWarnedMissingConfig = false;

/**
 * Checks whether Redis is configured.
 */
export function isRedisConfigured() {
  return Boolean(REST_URL && REST_TOKEN);
}

/**
 * Execute a single Redis command using Upstash REST API.
 * Example: redisCommand("GET", "my-key")
 * Example: redisCommand("SET", "my-key", "value", "EX", 300)
 * Example: redisCommand("DEL", "my-key")
 */
export async function redisCommand(...commandArray) {
  if (!REST_URL || !REST_TOKEN) {
    if (!isWarnedMissingConfig) {
      console.warn("[Redis] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN missing. Redis caching disabled.");
      isWarnedMissingConfig = true;
    }
    return null;
  }

  try {
    const response = await fetch(REST_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commandArray),
      // Set short 2.5s timeout so slow network never halts page rendering
      signal: AbortSignal.timeout(2500),
    });

    if (!response.ok) {
      console.warn(`[Redis] Command ${commandArray[0]} returned HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (data.error) {
      console.warn(`[Redis] Command ${commandArray[0]} error:`, data.error);
      return null;
    }

    return data.result;
  } catch (error) {
    console.warn(`[Redis] Fail-open: Command ${commandArray[0]} failed:`, error?.message);
    return null;
  }
}

/**
 * Execute multiple Redis commands in a single atomic pipeline HTTP round-trip.
 * Example: redisPipeline([["GET", "k1"], ["GET", "k2"], ["DEL", "k3"]])
 */
export async function redisPipeline(commands) {
  if (!REST_URL || !REST_TOKEN || !Array.isArray(commands) || commands.length === 0) {
    return [];
  }

  try {
    const pipelineUrl = `${REST_URL.replace(/\/+$/, "")}/pipeline`;
    const response = await fetch(pipelineUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands),
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      console.warn(`[Redis] Pipeline returned HTTP ${response.status}`);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data.map((item) => item.result) : [];
  } catch (error) {
    console.warn("[Redis] Fail-open: Pipeline execution failed:", error?.message);
    return [];
  }
}

export default {
  redisCommand,
  redisPipeline,
  isRedisConfigured,
};
