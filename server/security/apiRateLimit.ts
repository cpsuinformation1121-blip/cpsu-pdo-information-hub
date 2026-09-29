type Counter = { count: number; resetAt: number };

const windowMs = 60_000;
const counters = new Map<string, Counter>();

function requestLimit(path: string) {
  if (path === "/api/resources" || path === "/api/repository-structure") return 60;
  if (path === "/api/resource-preview" || path === "/api/resource-link") return 30;
  if (path === "/api/accomplishments" || path === "/api/opcr") return 30;
  if (path === "/api/admin/session" || path === "/api/admin/users") return 30;
  return path.startsWith("/api/admin/") ? 120 : 60;
}

/**
 * A per-instance backstop. Vercel overwrites x-forwarded-for, but this map is
 * not shared between instances; production still needs a Vercel WAF rule.
 */
export function checkApiRateLimit(request: Request, path: string, now = Date.now()) {
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!clientIp || clientIp.length > 64) return null;

  const key = `${clientIp}:${path}`;
  const current = counters.get(key);
  const next = !current || current.resetAt <= now
    ? { count: 1, resetAt: now + windowMs }
    : { count: current.count + 1, resetAt: current.resetAt };
  counters.set(key, next);
  if (counters.size > 4096) counters.delete(counters.keys().next().value!);

  if (next.count <= requestLimit(path)) return null;
  return new Response(JSON.stringify({
    error: { code: "RATE_LIMITED", message: "Too many requests. Please try again shortly." },
  }), {
    status: 429,
    headers: {
      "cache-control": "private, no-store",
      "content-type": "application/json; charset=utf-8",
      "retry-after": String(Math.max(1, Math.ceil((next.resetAt - now) / 1000))),
    },
  });
}
