import { handleAdminRepositoryStructureRequest } from "./repositoryStructureHandler";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createAdminReportResourceHandler } from "./adminReportResourceHandler";
vi.mock("../auth/authenticateAdminRequest.ts", async importOriginal => ({ ...await importOriginal<object>(), authenticateAdminRequest: async () => ({ uid: "admin", admin: true }) }));
const data = { value: "report" };
const writeSnapshot = vi.fn(async () => ({ data, revision: '"new"' }));
const handler = createAdminReportResourceHandler({ schema: z.object({ value: z.string() }), read: async () => data, write: async () => data,
  readSnapshot: async () => ({ data, revision: '"original"' }), writeSnapshot,
  invalidRequestMessage: "Invalid", unavailableCode: "UNAVAILABLE", unavailableMessage: "Unavailable", auditAction: "opcr-resource.saved", auditTarget: "test" });
const request = (revision?: string) => new Request("https://example.edu/api", { method: "PUT", headers: revision ? { "x-report-revision": revision } : {}, body: JSON.stringify(data) });
describe("report concurrency", () => {
  it("returns the loaded report revision with its data", async () => {
    const response = await handler(new Request("https://example.edu/api"));
    expect(response.headers.get("x-report-revision")).toBe('"original"');
    await expect(response.json()).resolves.toEqual({ data });
  });
  it("rejects a save without a loaded revision before writing", async () => {
    const response = await handler(request());
    expect(response.status).toBe(428);
    expect(writeSnapshot).not.toHaveBeenCalled();
  });
  it("passes the revision to the conditional write and returns the new one", async () => {
    const response = await handler(request('"original"'), {}, { audit: async () => "audit" });
    expect(response.status).toBe(200);
    expect(writeSnapshot).toHaveBeenCalledWith(data, {}, '"original"');
    expect(response.headers.get("x-report-revision")).toBe('"new"');
  });
  it("returns a conflict instead of silently overwriting another administrator's save", async () => {
    writeSnapshot.mockRejectedValueOnce({ $metadata: { httpStatusCode: 412 } });
    const response = await handler(request('"stale"'), {}, { audit: async () => "audit" });
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "REPORT_CONFLICT" } });
  });
});

it("bounds structure mutation request bodies before accessing R2", async () => {
  const response = await handleAdminRepositoryStructureRequest(new Request("https://example.edu/api", { method: "POST", body: JSON.stringify({ value: "x".repeat(17 * 1024) }) }), {});
  expect(response.status).toBe(413);
});
