import { describe, expect, it } from "vitest";
import { accomplishmentResourceDataSchema } from "./accomplishmentResource";

const nodes = [
  {
    id: "performance",
    parentId: null,
    type: "section" as const,
    title: "Performance",
  },
  {
    id: "education",
    parentId: "performance",
    type: "group" as const,
    title: "Education",
  },
  {
    id: "completion-rate",
    parentId: "education",
    type: "indicator" as const,
    title: "Completion rate",
  },
];

describe("accomplishment resource contract", () => {
  it("accepts quarterly target and accomplishment values", () => {
    const period = { q1: "1", q2: "2", q3: "3", q4: "4", total: "10" };
    const rawPeriod = {
      q1: "1,250 (estimated)",
      q2: "N/A — pending",
      q3: "50% / 75%",
      q4: "José & Ana",
      total: "Manual total: 1,300+",
    };
    const data = {
      version: 2 as const,
      nodes,
      entries: {
        "2026": {
          "completion-rate": {
            results: { target: period, accomplishment: period },
            rawData: { target: rawPeriod, accomplishment: rawPeriod },
          },
        },
      },
      chartType: "column" as const,
    };

    expect(accomplishmentResourceDataSchema.parse(data)).toEqual(data);
  });

  it("accepts chart appearance settings and rejects invalid colors", () => {
    const base = {
      version: 2 as const,
      nodes,
      entries: {},
      chartType: "column" as const,
    };

    const parsed = accomplishmentResourceDataSchema.parse({
      ...base,
      appearance: {
        legend: [
          { id: "met", label: "Met target", color: "#14532d" },
          { id: "custom-exceeded", label: "Exceeded", color: "#2563eb" },
        ],
        barColors: {
          "completion-rate:total:accomplishment": "custom-exceeded",
        },
      },
    });
    expect(
      parsed.appearance?.barColors?.["completion-rate:total:accomplishment"],
    ).toBe("custom-exceeded");

    expect(
      accomplishmentResourceDataSchema.safeParse({
        ...base,
        appearance: { legend: [{ id: "met", label: "Met", color: "green" }] },
      }).success,
    ).toBe(false);
  });

  it("migrates a legacy annual target into Target Total", () => {
    const migrated = accomplishmentResourceDataSchema.parse({
      version: 1,
      nodes,
      entries: {
        "2026": {
          "completion-rate": {
            results: {
              target: "90%",
              q1: "88%",
              q2: "89%",
              q3: "",
              q4: "",
              total: "89%",
            },
            rawData: {
              target: "100",
              q1: "88",
              q2: "89",
              q3: "",
              q4: "",
              total: "89",
            },
          },
        },
      },
      chartType: "line",
    });

    expect(migrated.version).toBe(2);
    expect(migrated.entries["2026"]["completion-rate"].results).toEqual({
      target: { q1: "", q2: "", q3: "", q4: "", total: "90%" },
      accomplishment: {
        q1: "88%",
        q2: "89%",
        q3: "",
        q4: "",
        total: "89%",
      },
    });
  });
});
