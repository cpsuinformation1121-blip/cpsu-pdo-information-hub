import { expect, it, vi } from "vitest";
import api from "./apiEntry";
vi.mock("./http/resourcesHandler.ts", () => ({ handleResourcesRequest: async () => { throw new Error("private provider details"); } }));
it("converts an unexpected handler exception into a safe, uncached JSON response", async () => {
  const response = await api.fetch(new Request("https://example.edu/api/resources"));
  expect(response.status).toBe(500);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  const body = await response.text();
  expect(body).not.toContain("private provider details");
  expect(JSON.parse(body)).toMatchObject({ error: { code: "API_UNAVAILABLE" } });
});
