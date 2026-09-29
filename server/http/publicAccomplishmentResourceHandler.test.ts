import { describe, expect, it } from "vitest";
import type { AccomplishmentResourceData } from "../../src/contracts/accomplishmentResource.ts";
import { handlePublicAccomplishmentResourceRequest } from "./publicAccomplishmentResourceHandler.ts";

const data: AccomplishmentResourceData = {
  version: 2,
  nodes: [
    {
      id: "performance",
      parentId: null,
      type: "section",
      title: "Performance",
    },
    {
      id: "education",
      parentId: "performance",
      type: "group",
      title: "Education",
    },
    {
      id: "completion-rate",
      parentId: "education",
      type: "indicator",
      title: "Completion rate",
    },
  ],
  entries: {
    "2026": {
      "completion-rate": {
        results: {
          target: { q1: "", q2: "", q3: "", q4: "", total: "90%" },
          accomplishment: {
            q1: "88%",
            q2: "",
            q3: "",
            q4: "",
            total: "",
          },
        },
        rawData: {
          target: { q1: "", q2: "", q3: "", q4: "", total: "100" },
          accomplishment: {
            q1: "88",
            q2: "",
            q3: "",
            q4: "",
            total: "",
          },
        },
      },
    },
    "2025": {},
  },
  chartType: "column",
};

describe("handlePublicAccomplishmentResourceRequest", () => {
  it("returns only the requested year without requiring authentication", async () => {
    const response = await handlePublicAccomplishmentResourceRequest(
      new Request("https://example.edu/api/accomplishments?year=2026"),
      {},
      { read: async () => data },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("s-maxage=60");
    expect(await response.json()).toEqual({
      data: { ...data, entries: { "2026": data.entries["2026"] } },
    });
  });

  it("returns all years in one response when requested by the public report page", async () => {
    const response = await handlePublicAccomplishmentResourceRequest(
      new Request("https://example.edu/api/accomplishments?year=all"),
      {},
      { read: async () => data },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data });
  });

  it("rejects a missing or malformed year", async () => {
    const response = await handlePublicAccomplishmentResourceRequest(
      new Request("https://example.edu/api/accomplishments?year=current"),
      {},
      { read: async () => data },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { code: "INVALID_YEAR" },
    });
  });

  it("does not allow public writes", async () => {
    const response = await handlePublicAccomplishmentResourceRequest(
      new Request("https://example.edu/api/accomplishments?year=2026", {
        method: "PUT",
      }),
      {},
      { read: async () => data },
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET");
  });

  it("returns a safe unavailable response when storage fails", async () => {
    const response = await handlePublicAccomplishmentResourceRequest(
      new Request("https://example.edu/api/accomplishments?year=2026"),
      {},
      {
        read: async () => {
          throw new Error("provider detail");
        },
      },
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      error: {
        code: "ACCOMPLISHMENT_RESOURCE_UNAVAILABLE",
        message: "Accomplishment data is temporarily unavailable.",
      },
    });
  });
});
