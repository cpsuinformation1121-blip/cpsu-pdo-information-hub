import type { User } from "firebase/auth";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAuthenticatedJson } from "./authenticatedApi";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchAuthenticatedJson", () => {
  it("adds the Firebase token and preserves request headers", async () => {
    const getIdToken = vi.fn(async () => "firebase-token");
    const user = { getIdToken } as unknown as User;
    const fetchMock = vi.fn<
      (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
    >(async () =>
      new Response(JSON.stringify({ data: { ok: true } }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchAuthenticatedJson(user, "/api/admin/session", {
      headers: { accept: "application/json" },
    });

    const request = fetchMock.mock.calls[0];
    const headers = new Headers(request[1]?.headers);
    expect(headers.get("authorization")).toBe("Bearer firebase-token");
    expect(headers.get("accept")).toBe("application/json");
    expect(result.payload).toEqual({ data: { ok: true } });
    expect(getIdToken).toHaveBeenCalledOnce();
  });

  it("reuses a supplied token instead of requesting another one", async () => {
    const getIdToken = vi.fn(async () => "unused-token");
    const user = { getIdToken } as unknown as User;
    const fetchMock = vi.fn<
      (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
    >(async () =>
      new Response(JSON.stringify({ data: null }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await fetchAuthenticatedJson(user, "/api/admin/resources", {}, "shared-token");

    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(headers.get("authorization")).toBe("Bearer shared-token");
    expect(getIdToken).not.toHaveBeenCalled();
  });
});
