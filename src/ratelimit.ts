import { Redis } from "ioredis";

// Fixed-window limiter keyed by (account, user). Shared across tasks via Redis
// when REDIS_URL is set; otherwise (and on any Redis error) it fails open to a
// per-task in-memory bucket. Set MCP_RATELIMIT_FAIL_CLOSED=true to reject during
// a Redis partition instead (abuse kill-switch).
// ponytail: fixed window (not sliding) and a per-task fallback limit — upgrade to a
// sliding window + dynamic divisor if a burst at a window edge or fan-out matters.
const WINDOW_MS = 60_000;
const LIMIT = Number(process.env.MCP_RATELIMIT_PER_MIN ?? 120);
const REDIS_OP_TIMEOUT_MS = 100;
const FAIL_CLOSED = process.env.MCP_RATELIMIT_FAIL_CLOSED === "true";

let redis: Redis | undefined;
if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    commandTimeout: REDIS_OP_TIMEOUT_MS,
  });
  redis.connect().catch(() => {
    // fail-open handles an unreachable Redis at call time
  });
}

const localBuckets = new Map<string, { count: number; windowStart: number }>();

function localAllow(key: string, now: number): boolean {
  const bucket = localBuckets.get(key);
  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    localBuckets.set(key, { count: 1, windowStart: now });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= LIMIT;
}

// Returns true if the request is within the limit, false if it should be rejected.
export async function checkRateLimit(
  accountId: string | number,
  sub: string | number
): Promise<boolean> {
  const now = Date.now();
  const key = `${accountId}:${sub}`;

  if (redis) {
    const window = Math.floor(now / WINDOW_MS);
    const redisKey = `mcp:rl:${key}:${window}`;
    try {
      const count = await redis.incr(redisKey);
      if (count === 1) await redis.pexpire(redisKey, WINDOW_MS);
      return count <= LIMIT;
    } catch {
      if (FAIL_CLOSED) return false;
      return localAllow(key, now);
    }
  }

  return localAllow(key, now);
}
