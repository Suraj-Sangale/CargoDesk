import { redisCommand, redisPipeline, isRedisConfigured } from "./redisClient";

/**
 * CargoDesk Cache-Aside Service.
 * Provides multi-tenant Redis caching with graceful fail-open fallback.
 */

/**
 * Retrieve cached JSON or compute, cache, and return fresh value.
 *
 * @param {string} key - Redis key (e.g. cargodesk:org:1:drivers:list)
 * @param {number} ttlSeconds - Expiration time in seconds
 * @param {Function} fetchFn - Async function returning fresh data on cache miss
 * @returns {Promise<any>}
 */
export async function getOrSetCache(key, ttlSeconds, fetchFn) {
  if (!key || typeof fetchFn !== "function") {
    return fetchFn ? await fetchFn() : null;
  }

  // 1. Try reading from Redis if configured
  if (isRedisConfigured()) {
    try {
      const cached = await redisCommand("GET", key);
      if (cached !== null && cached !== undefined) {
        if (typeof cached === "string") {
          try {
            return JSON.parse(cached);
          } catch (_) {
            return cached;
          }
        }
        return cached;
      }
    } catch (err) {
      console.warn(`[CacheService] Read error for "${key}":`, err?.message);
    }
  }

  // 2. Cache miss: Compute fresh data
  const freshData = await fetchFn();

  // 3. Write back to Redis asynchronously
  if (isRedisConfigured() && freshData !== undefined && freshData !== null) {
    try {
      const serialized = typeof freshData === "string" ? freshData : JSON.stringify(freshData);
      // Fire and forget (or await) without blocking request return
      if (ttlSeconds && ttlSeconds > 0) {
        await redisCommand("SET", key, serialized, "EX", ttlSeconds);
      } else {
        await redisCommand("SET", key, serialized);
      }
    } catch (err) {
      console.warn(`[CacheService] Write error for "${key}":`, err?.message);
    }
  }

  return freshData;
}

/**
 * Get value from cache.
 */
export async function getCache(key) {
  if (!key || !isRedisConfigured()) return null;
  try {
    const raw = await redisCommand("GET", key);
    if (raw === null || raw === undefined) return null;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return raw;
    }
  } catch (err) {
    console.warn(`[CacheService] getCache error for "${key}":`, err?.message);
    return null;
  }
}

/**
 * Store value into cache.
 */
export async function setCache(key, value, ttlSeconds = 300) {
  if (!key || !isRedisConfigured()) return false;
  try {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await redisCommand("SET", key, serialized, "EX", ttlSeconds);
    } else {
      await redisCommand("SET", key, serialized);
    }
    return true;
  } catch (err) {
    console.warn(`[CacheService] setCache error for "${key}":`, err?.message);
    return false;
  }
}

/**
 * Delete a specific key.
 */
export async function deleteCache(key) {
  if (!key || !isRedisConfigured()) return false;
  try {
    await redisCommand("DEL", key);
    return true;
  } catch (err) {
    console.warn(`[CacheService] deleteCache error for "${key}":`, err?.message);
    return false;
  }
}

/**
 * Invalidate all keys matching a wildcard pattern.
 * Example: invalidateCachePattern("cargodesk:org:1:drivers:*")
 * Example: invalidateCachePattern("cargodesk:org:*:fleets:*")
 */
export async function invalidateCachePattern(pattern) {
  if (!pattern || !isRedisConfigured()) return 0;

  try {
    // 1. Fetch all matching keys
    const keys = await redisCommand("KEYS", pattern);
    if (!Array.isArray(keys) || keys.length === 0) {
      return 0;
    }

    // 2. Delete all matching keys in a single batch
    if (keys.length === 1) {
      await redisCommand("DEL", keys[0]);
      return 1;
    }

    const pipelineCommands = keys.map((k) => ["DEL", k]);
    await redisPipeline(pipelineCommands);
    return keys.length;
  } catch (err) {
    console.warn(`[CacheService] invalidateCachePattern error for "${pattern}":`, err?.message);
    return 0;
  }
}

export default {
  getOrSetCache,
  getCache,
  setCache,
  deleteCache,
  invalidateCachePattern,
};
