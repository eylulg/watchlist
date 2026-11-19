import 'server-only';

interface Window {
  startedAt: number;
  count: number;
}

/**
 * Fixed window limiter kept in memory. On serverless hosts each instance has its own memory, so this is a
 * best effort guard against a single client hammering TMDB through the search route, not a global quota.
 */
export const createRateLimiter = ({
  limit,
  windowMs,
  now = Date.now,
}: {
  limit: number;
  windowMs: number;
  now?: () => number;
}) => {
  const windows = new Map<string, Window>();

  return (key: string): boolean => {
    const time = now();
    const current = windows.get(key);
    if (!current || time - current.startedAt >= windowMs) {
      // Drop stale entries now and then so the map cannot grow without bound.
      if (windows.size > 10_000) windows.clear();
      windows.set(key, { startedAt: time, count: 1 });
      return true;
    }
    current.count += 1;
    return current.count <= limit;
  };
};
