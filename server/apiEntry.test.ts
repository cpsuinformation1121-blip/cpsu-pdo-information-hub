import { describe, expect, it } from "vitest";
import apiEntry, { resolveApiPath } from "./apiEntry.ts";

describe("Vercel API entrypoint", () => {
  it("keeps direct development API paths unchanged", () => {
    const request = new Request("http://127.0.0.1/api/admin/session");

    expect(resolveApiPath(request)).toBe("/api/admin/session");
  });

  it("restores nested API paths supplied by the Vercel rewrite", () => {
    const request = new Request(
      "https://example.test/api/handler?__apiPath=admin/resources/upload-authorize",
    );

    expect(resolveApiPath(request)).toBe(
      "/api/admin/resources/upload-authorize",
    );
  });

  it("routes rewritten protected endpoints through their real handler", async () => {
    const response = await apiEntry.fetch(
      new Request(
        "https://example.test/api/handler?__apiPath=admin/session",
      ),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "UNAUTHORIZED" },
    });
  });

  it("returns the application JSON 404 for an unknown rewritten route", async () => {
    const response = await apiEntry.fetch(
      new Request(
        "https://example.test/api/handler?__apiPath=unknown/nested-route",
      ),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "NOT_FOUND" },
    });
  });
});
