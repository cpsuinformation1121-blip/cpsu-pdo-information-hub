import { afterEach, describe, expect, it, vi } from "vitest";
import { getAllResources } from "./resources";
const resource = (id: string) => ({ id: id.repeat(43), filename: "report.pdf", displayName: "Report", sectionId: "planning-documents", year: 2026, fileType: "pdf", mimeType: "application/pdf", fileSize: 10, uploadedAt: "2026-01-01T00:00:00Z" });
const page = (id: string, nextCursor: string | null) => new Response(JSON.stringify({ data: [resource(id)], meta: { total: 2, groupTotal: 2, nextCursor } }));
afterEach(() => vi.unstubAllGlobals());
describe("complete public repository listing", () => {
  it("follows cursors while preserving filters, grouping and cancellation", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(page("A", "next")).mockResolvedValueOnce(page("B", null));
    vi.stubGlobal("fetch", fetcher);
    const signal = new AbortController().signal;
    const result = await getAllResources({ section: "planning-documents", groupBy: "year", limit: 100 }, signal);
    expect(result.data.map(item => item.id)).toEqual(["A".repeat(43), "B".repeat(43)]);
    expect(result.meta).toEqual({ total: 2, groupTotal: 2, nextCursor: null });
    expect(fetcher.mock.calls[1][0]).toContain("cursor=next");
    expect(fetcher.mock.calls[1][0]).toContain("groupBy=year");
    expect(fetcher.mock.calls[1][0]).toContain("section=planning-documents");
    expect(fetcher.mock.calls.every(call => call[1].signal === signal)).toBe(true);
  });
  it("fails instead of silently returning partial results if a later page fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(page("A", "next")).mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: "UNAVAILABLE", message: "Unavailable" } }), { status: 503 })));
    await expect(getAllResources()).rejects.toMatchObject({ status: 503 });
  });
  it("rejects repeated cursors instead of looping indefinitely", async () => {
    const fetcher = vi.fn().mockImplementation(async () => page("A", "next"));
    vi.stubGlobal("fetch", fetcher);
    await expect(getAllResources()).rejects.toMatchObject({ code: "INVALID_PAGINATION" });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("propagates cancellation while loading the next page", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(page("A", "next")).mockRejectedValueOnce(new DOMException("Aborted", "AbortError")));
    await expect(getAllResources()).rejects.toMatchObject({ name: "AbortError" });
  });
});
