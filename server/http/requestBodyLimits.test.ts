import type { Auth, DecodedIdToken } from "firebase-admin/auth";
import { describe, expect, it, vi } from "vitest";
import { handleAdminResourceMutationRequest } from "./adminResourceMutationHandler";
import { handleAdminResourceAccessRequest } from "./adminResourceAccessHandler";
import { handlePublicResourcePreviewRequest } from "./publicResourcePreviewHandler";
import { handleUploadAuthorizeRequest } from "./uploadAuthorizeHandler";
import { handleUploadCompleteRequest } from "./uploadCompleteHandler";
import { handleAdminUsersRequest } from "./adminUsersHandler";
const identity = { uid: "admin", admin: true } as unknown as DecodedIdToken;
const deps = { verifyIdToken: async () => identity, auth: {} as Auth };
const handlers = [handleAdminResourceMutationRequest, handleAdminResourceAccessRequest, handlePublicResourcePreviewRequest, handleUploadAuthorizeRequest, handleUploadCompleteRequest, handleAdminUsersRequest] as const;
describe("bounded metadata API bodies", () => {
  it.each(handlers)("rejects oversized streamed bodies in %s", async handler => {
    const response = await handler(new Request("https://example.edu/api", { method: "POST", headers: { authorization: "Bearer valid", "content-length": "0" }, body: JSON.stringify({ value: "x".repeat(17 * 1024) }) }), deps);
    expect(response.status).toBe(413);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    await expect(response.json()).resolves.toMatchObject({ error: { code: "REQUEST_TOO_LARGE" } });
  });
  it.each(handlers)("rejects declared oversize bodies in %s", async handler => {
    const response = await handler(new Request("https://example.edu/api", { method: "POST", headers: { authorization: "Bearer valid", "content-length": "1000000" }, body: "{}" }), deps);
    expect(response.status).toBe(413);
  });
  it.each(handlers)("returns 400 for malformed JSON in %s", async handler => {
    const response = await handler(new Request("https://example.edu/api", { method: "POST", headers: { authorization: "Bearer valid" }, body: "{" }), deps);
    expect(response.status).toBe(400);
  });
  it("returns 405 for unsupported mutation methods before provider access", async () => {
    expect((await handleAdminResourceMutationRequest(new Request("https://example.edu/api"))).status).toBe(405);
    expect((await handleAdminUsersRequest(new Request("https://example.edu/api", { method: "PUT" }))).status).toBe(405);
  });
  it("returns a safe JSON error when R2 configuration is unavailable", async () => {
    const send = vi.fn();
    const response = await handleAdminResourceMutationRequest(new Request("https://example.edu/api", { method: "DELETE", headers: { authorization: "Bearer valid" }, body: "{}" }), { ...deps, environment: {}, send });
    expect(response.status).toBe(500);
    expect(send).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({ error: { code: "RESOURCE_OPERATION_FAILED", message: "The repository operation could not be completed." } });
  });
});
