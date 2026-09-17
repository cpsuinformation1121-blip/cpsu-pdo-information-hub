import { describe, expect, it } from "vitest";
import { opcrResourceDataSchema } from "./opcrResource";

describe("OPCR resource contract", () => {
  it("accepts special characters and Unicode in Raw Data values", () => {
    const rawPeriod = {
      h1: "1,250 (estimated)",
      h2: "N/A — José & Ana / 50%",
      total: "Manual total: 1,300+",
    };
    const data = {
      version: 1 as const,
      nodes: [
        {
          id: "performance",
          parentId: null,
          type: "section" as const,
          title: "Performance",
        },
        {
          id: "operations",
          parentId: "performance",
          type: "group" as const,
          title: "Operations",
        },
        {
          id: "service-quality",
          parentId: "operations",
          type: "indicator" as const,
          title: "Service quality",
        },
      ],
      entries: {
        "2026": {
          "service-quality": {
            results: {
              target: { h1: "90", h2: "95", total: "92.5" },
              accomplishment: { h1: "91", h2: "96", total: "93.5" },
            },
            rawData: {
              target: rawPeriod,
              accomplishment: rawPeriod,
            },
          },
        },
      },
      chartType: "column" as const,
    };

    expect(opcrResourceDataSchema.parse(data)).toEqual(data);
  });
});
