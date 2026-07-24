
import { isAllowed } from '../services/rateLimit.service.js';
import { TooManyRequestsError } from '../errors/index.js'; 

/**
 * Returns an Express middleware that enforces a fixed-window rate limit.
 * Usage: app.use(rateLimit(60_000, 300)) for 300 requests per minute.
 */
const rateLimit = (windowSizeMs, maxRequests, message = 'Too many requests, please try again later.') =>{
  return async (req, res, next) => {
    try {
      const key = req.user?.id || req.ip;
      const allowed = await isAllowed(req, key, windowSizeMs, maxRequests);

      if (!allowed) {
        return next(new TooManyRequestsError(message));
      }

      next();
    } catch (err) {
      // Redis down shouldn't take the whole API down — fail open.
      console.error('Rate limiter error, failing open:', err);
      next();
    }
  };
}
export {rateLimit}