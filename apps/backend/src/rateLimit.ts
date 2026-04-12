import type { Context, Next } from "hono";
import { connection } from "./queue";

/**
 * Redis-based sliding window rate limiter.
 *
 * @param limit   Max requests allowed in the window
 * @param windowSec  Window size in seconds
 * @param keyFn  Function to derive the rate limit key from the request (default: userId or IP)
 */
export function rateLimit(
  limit: number,
  windowSec: number,
  keyFn?: (c: Context) => string,
) {
  return async (c: Context, next: Next) => {
    const identifier = keyFn
      ? keyFn(c)
      : (c.get("user")?.userId ?? c.req.header("x-forwarded-for") ?? "anon");

    const route = c.req.routePath ?? c.req.path;
    const key = `rl:${route}:${identifier}`;

    const count = await connection.incr(key);
    if (count === 1) await connection.expire(key, windowSec);

    c.res.headers.set("X-RateLimit-Limit", String(limit));
    c.res.headers.set("X-RateLimit-Remaining", String(Math.max(0, limit - count)));

    if (count > limit) {
      return c.json(
        { error: `Too many requests. Limit is ${limit} per ${windowSec}s.` },
        429,
      );
    }

    await next();
  };
}
