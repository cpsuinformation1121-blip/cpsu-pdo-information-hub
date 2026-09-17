import { describe, expect, it, vi } from "vitest";
import { handlePublicResourceLinkRequest } from "./publicResourceLinkHandler";

const resourceId = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const config = {
  accountId: "test-account",
  accessKeyId: "test-access-key",
  secretAccessKey: "test-secret-key",
  bucketName: "test-bucket",
  endpoint: "https://test-account.r2.cloudflarestorage.com",
};
const linkResource = {
  id: resourceId,
  key: "forms/excel/2027-2028/MIS DPCR Evaluation Form.link",
  filename: "MIS DPCR Evaluation Form.link",
  displayName: "MIS DPCR Evaluation Form",
  sectionId: "forms",
  categoryId: "excel",
  year: "2027-2028",
  fileType: "link" as const,
  mimeType: "application/vnd.cpsu.repository-link+json",
  fileSize: 58,
  uploadedAt: "2026-09-17T08:00:00.000Z",
};

function request(id = resourceId) {
  return new Request(`http://localhost/api/resource-link?id=${id}`);
}

describe("handlePublicResourceLinkRequest", () => {
  it("resolves an opaque link id to a validated HTTPS redirect", async () => {
    const response = await handlePublicResourceLinkRequest(request(), {
      config,
      findResource: async () => linkResource,
      readLink: async () => JSON.stringify({ url: "https://forms.example.edu/dpcr" }),
    });

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://forms.example.edu/dpcr",
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  });

  it("rejects malformed identifiers before reading R2", async () => {
    const findResource = vi.fn();
    const response = await handlePublicResourceLinkRequest(
      request("../../private"),
      { config, findResource },
    );

    expect(response.status).toBe(400);
    expect(findResource).not.toHaveBeenCalled();
  });

  it("does not redirect non-link resources", async () => {
    const readLink = vi.fn();
    const response = await handlePublicResourceLinkRequest(request(), {
      config,
      findResource: async () => ({
        ...linkResource,
        key: "forms/excel/2027-2028/report.pdf",
        filename: "report.pdf",
        displayName: "Report",
        fileType: "pdf",
        mimeType: "application/pdf",
      }),
      readLink,
    });

    expect(response.status).toBe(400);
    expect(readLink).not.toHaveBeenCalled();
  });

  it("fails closed when the stored destination is not HTTPS", async () => {
    const response = await handlePublicResourceLinkRequest(request(), {
      config,
      findResource: async () => linkResource,
      readLink: async () => JSON.stringify({ url: "http://example.test" }),
    });

    expect(response.status).toBe(503);
    expect(response.headers.get("location")).toBeNull();
  });
});