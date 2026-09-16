import { describe, expect, it } from "vitest";
import type { ComparisonDatum } from "./chartData";
import {
  defaultReportLegend,
  reportBarColorKey,
  resolveBarColor,
  resolveReportLegend,
  restoreReportAppearance,
  upsertCustomLegendItem,
} from "./reportAppearance";

function datum(overrides: Partial<ComparisonDatum> = {}): ComparisonDatum {
  return {
    id: "total",
    label: "Annual",
    targetDisplay: "80%",
    targetNumeric: 80,
    accomplishmentDisplay: "70%",
    accomplishmentNumeric: 70,
    status: "below",
    colorKey: "indicator-a:total",
    ...overrides,
  };
}

describe("report appearance", () => {
  it("merges saved legend overrides over the defaults", () => {
    const legend = resolveReportLegend([
      { id: "met", label: "On track", color: "#0000ff" },
    ]);

    expect(legend).toHaveLength(defaultReportLegend.length);
    expect(legend.find((item) => item.id === "met")).toMatchObject({
      label: "On track",
      color: "#0000ff",
    });
    expect(legend.find((item) => item.id === "target")?.color).toBe("#46647a");
  });

  it("resolves a per-bar legend reference before the category color", () => {
    const appearance = {
      legend: [
        { id: "met", label: "Met target", color: "#14532d" },
        { id: "custom-exceeded", label: "Exceeded", color: "#2563eb" },
      ],
      barColors: { "indicator-a:total:accomplishment": "custom-exceeded" },
    };

    expect(resolveBarColor(appearance, datum(), "accomplishment")).toBe(
      "#2563eb",
    );
    expect(
      resolveBarColor(
        appearance,
        datum({ colorKey: "other:total" }),
        "accomplishment",
      ),
    ).toBe("#9f2d2d");
    expect(resolveBarColor(appearance, datum(), "target")).toBe("#46647a");
  });

  it("reuses a custom legend entry by label", () => {
    const first = upsertCustomLegendItem(
      resolveReportLegend(),
      "#2563eb",
      "Exceeded",
    );
    expect(first.id).toBe("custom-exceeded");

    const second = upsertCustomLegendItem(first.legend, "#16a34a", "exceeded");
    expect(second.id).toBe("custom-exceeded");
    expect(
      second.legend.filter(
        (item) => item.label.toLowerCase() === "exceeded",
      ),
    ).toHaveLength(1);
    expect(
      second.legend.find((item) => item.id === "custom-exceeded")?.color,
    ).toBe("#16a34a");
  });

  it("builds a stable bar color key", () => {
    expect(reportBarColorKey("indicator-a:total", "target")).toBe(
      "indicator-a:total:target",
    );
    expect(reportBarColorKey(undefined, "target")).toBeUndefined();
  });
});

describe("restore report appearance", () => {
  const appearance = {
    legend: [
      ...defaultReportLegend.map((item) => ({ ...item })),
      { id: "custom-exceeded", label: "Exceeded", color: "#2563eb" },
    ],
    barColors: {
      "indicator-a:total:accomplishment": "custom-exceeded",
      "indicator-b:total:accomplishment": "met",
    },
  };

  it("restores one indicator and prunes the label it alone used", () => {
    const result = restoreReportAppearance(appearance, {
      legend: false,
      indicatorIds: ["indicator-a"],
    });

    expect(result.barColors).toEqual({
      "indicator-b:total:accomplishment": "met",
    });
    expect(
      result.legend.some((item) => item.id === "custom-exceeded"),
    ).toBe(false);
  });

  it("restores the legend and reverts bars that used custom labels", () => {
    const result = restoreReportAppearance(appearance, {
      legend: true,
      indicatorIds: [],
    });

    expect(result.legend).toEqual(
      defaultReportLegend.map((item) => ({ ...item })),
    );
    expect(result.barColors).toEqual({
      "indicator-b:total:accomplishment": "met",
    });
  });

  it("restores everything to the defaults", () => {
    const result = restoreReportAppearance(appearance, {
      legend: true,
      indicatorIds: ["indicator-a", "indicator-b"],
    });

    expect(result.barColors).toEqual({});
    expect(result.legend).toEqual(
      defaultReportLegend.map((item) => ({ ...item })),
    );
  });
});
