import { ensureConnected } from '../config/redis.config.js';

const ACCESS_TOKEN_PREFIX = 'access_token:';

/**
 * Stores the access token in Redis, keyed by userId, with a TTL
 * matching the token's expiry.
 */
const setAccessToken = async(userId, token, ttlSec) => {
  const client = await ensureConnected();
  const key = ACCESS_TOKEN_PREFIX + userId;
  await client.set(key, token, { EX: ttlSec });
}

// /**
//  * Retrieves the cached access token for a userId, or null if not found.
//  */
// const getAccessToken = async(userId) => {
//   const client = await ensureConnected();
//   const key = ACCESS_TOKEN_PREFIX + userId;
//   return client.get(key);
// }

export {setAccessToken}

