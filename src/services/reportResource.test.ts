import { afterEach, describe, expect, it, vi } from "vitest";
import type { User } from "firebase/auth";
import { z } from "zod";
import { createReportResourceClient } from "./reportResource";
const data = { value: "report" };
const client = () => createReportResourceClient({ adminEndpoint: "/api/admin/test", publicEndpoint: "/api/test", responseSchema: z.object({ data: z.object({ value: z.string() }) }), adminFailureMessage: "Failed", publicFailureMessage: "Failed" });
const user = () => ({ getIdToken: async () => "fixture-token" }) as User;
const response = (revision: string) => new Response(JSON.stringify({ data }), { headers: { "x-report-revision": revision } });
afterEach(() => vi.unstubAllGlobals());
describe("report revision requests", () => {
  it("sends the loaded revision and uses each successful save's new revision", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(response('"old"')).mockResolvedValueOnce(response('"new"')).mockResolvedValueOnce(response('"latest"'));
    vi.stubGlobal("fetch", fetcher); const api = client(); const staff = user();
    await api.getAdmin(staff); await api.saveAdmin(staff, data); await api.saveAdmin(staff, data);
    expect(fetcher.mock.calls[1][1].headers.get("x-report-revision")).toBe('"old"');
    expect(fetcher.mock.calls[2][1].headers.get("x-report-revision")).toBe('"new"');
  });
  it("keeps report revisions separate for different signed-in users", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(response('"staff-one"')).mockResolvedValueOnce(response('"staff-two"')).mockResolvedValueOnce(response('"new"'));
    vi.stubGlobal("fetch", fetcher); const api = client(); const one = user(); const two = user();
    await api.getAdmin(one); await api.getAdmin(two); await api.saveAdmin(one, data);
    expect(fetcher.mock.calls[2][1].headers.get("x-report-revision")).toBe('"staff-one"');
  });
});
