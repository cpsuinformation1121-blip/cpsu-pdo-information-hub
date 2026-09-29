import { describe, expect, it } from "vitest";
import { checkApiRateLimit } from "./apiRateLimit.ts";

describe("API rate limit backstop", () => {
  it("returns 429 after the public preview allowance", () => {
    const request = new Request("https://example.edu/api/resource-preview", {
      headers: { "x-forwarded-for": "198.51.100.31" },
    });
    for (let index = 0; index < 30; index += 1) {
      expect(checkApiRateLimit(request, "/api/resource-preview", 1_000)).toBeNull();
    }
    const response = checkApiRateLimit(request, "/api/resource-preview", 1_000);
    expect(response?.status).toBe(429);
    expect(response?.headers.get("retry-after")).toBe("60");
    expect(checkApiRateLimit(request, "/api/resource-preview", 61_001)).toBeNull();
  });

  it("does not trust a query string as a separate rate-limit bucket", () => {
    const request = new Request("https://example.edu/api/handler?__apiPath=resource-preview", {
      headers: { "x-forwarded-for": "198.51.100.32" },
    });
    for (let index = 0; index < 30; index += 1) {
      expect(checkApiRateLimit(request, "/api/resource-preview", 1_000)).toBeNull();
    }
    expect(checkApiRateLimit(request, "/api/resource-preview", 1_000)?.status).toBe(429);
  });
});
