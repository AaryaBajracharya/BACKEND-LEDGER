import { ensureConnected } from "../config/redis.config.js";

const INCR_AND_EXPIRE_SCRIPT = `
  local current = redis.call("INCR", KEYS[1])
  if tonumber(current) == 1 then
    redis.call("EXPIRE", KEYS[1], ARGV[1])
  end
  return current
`;

/**
 * Checks whether a request under `key` is allowed within the current
 * fixed window, given a window size (ms) and a max request count.
 * Returns true if allowed, false if the limit has been exceeded.
 */
const isAllowed = async(req, key, windowSizeMs, maxRequests) => {
  const windowSizeSec = Math.floor(windowSizeMs / 1000);
  const windowId = Math.floor(Date.now() / windowSizeMs);
  const route = req.baseUrl + req.path;
  const redisKey = `ratelimit:${key}:${route}:${windowId}`;

  try {
    const client = await ensureConnected();
    if (!client || !client.isOpen) {
      // Redis unavailable — fail open
      return true;
    }

    const count = await client.eval(INCR_AND_EXPIRE_SCRIPT, {
      keys: [redisKey],
      arguments: [String(windowSizeSec)],
    });

    return count <= maxRequests;
  } catch (err) {
    console.error('Rate limiter Redis error:', err);
    // On any Redis error, allow the request (fail open)
    return true;
  }
}

export {isAllowed}

