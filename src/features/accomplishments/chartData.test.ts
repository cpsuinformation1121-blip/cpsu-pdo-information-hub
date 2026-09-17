import { describe, expect, it } from "vitest";
import {
  annualComparisonFields,
  chartDataSourceLabel,
  createAnnualIndicatorChartData,
  createAnnualIndicatorSeriesChartData,
  createComparisonChartData,
  getComparisonScaleMax,
  parseAccomplishmentNumber,
  quarterlyComparisonFields,
  selectPreferredChartData,
} from "./chartData";

const target = { q1: "80", q2: "80", q3: "", q4: "90", total: "85" };
const accomplishment = {
  q1: "90%",
  q2: "70",
  q3: "75",
  q4: "90",
  total: "88",
};

describe("accomplishment chart data", () => {
  it("parses numbers, percentages, decimals, and grouped values", () => {
    expect(parseAccomplishmentNumber("90%")).toBe(90);
    expect(parseAccomplishmentNumber("1,234.5")).toBe(1234.5);
    expect(parseAccomplishmentNumber("(27)")).toBe(27);
    expect(parseAccomplishmentNumber("₱1,250 (estimated)")).toBe(1250);
    expect(parseAccomplishmentNumber("63*")).toBe(63);
    expect(parseAccomplishmentNumber("50% / 75%")).toBeNull();
    expect(parseAccomplishmentNumber("not reported")).toBeNull();
    expect(parseAccomplishmentNumber("-2")).toBeNull();
  });

  it("compares each quarterly accomplishment with its matching target", () => {
    const data = createComparisonChartData(
      target,
      accomplishment,
      quarterlyComparisonFields,
    );

    expect(data.map((item) => item.status)).toEqual([
      "met",
      "below",
      "unavailable",
      "met",
    ]);
    expect(data[0]).toMatchObject({
      targetDisplay: "80%",
      targetNumeric: 80,
      accomplishmentDisplay: "90%",
      accomplishmentNumeric: 90,
    });
    expect(getComparisonScaleMax(data)).toBe(90);
  });

  it("uses the saved totals for the annual comparison", () => {
    const [annual] = createComparisonChartData(
      target,
      accomplishment,
      annualComparisonFields,
    );

    expect(annual).toMatchObject({
      label: "Annual",
      targetNumeric: 85,
      accomplishmentNumeric: 88,
      status: "met",
    });
  });

  it("prioritizes Percentage data and falls back to Raw Data only when needed", () => {
    const blank = { q1: "", q2: "", q3: "", q4: "", total: "" };
    const raw = {
      target: { ...target, total: "1,200" },
      accomplishment: { ...accomplishment, total: "1,350" },
    };

    expect(
      selectPreferredChartData(
        {
          results: { target: blank, accomplishment: blank },
          rawData: raw,
        },
        ["total"],
      ),
    ).toMatchObject({ source: "rawData", row: raw });

    expect(
      selectPreferredChartData(
        {
          results: { target, accomplishment },
          rawData: raw,
        },
        ["total"],
      )?.source,
    ).toBe("percentage");
  });

  it("labels raw fallback values without percentage signs", () => {
    const blank = { q1: "", q2: "", q3: "", q4: "", total: "" };
    const data = createAnnualIndicatorChartData(
      [{ id: "graduates", title: "Graduates" }],
      {
        graduates: {
          results: { target: blank, accomplishment: blank },
          rawData: {
            target: { ...blank, total: "1,200" },
            accomplishment: { ...blank, total: "1,350" },
          },
        },
      },
    );

    expect(data[0]).toMatchObject({
      dataSource: "rawData",
      targetDisplay: "1,200",
      accomplishmentDisplay: "1,350",
      targetNumeric: 1200,
      accomplishmentNumeric: 1350,
    });
    expect(chartDataSourceLabel(data)).toBe("Raw Data");
  });

  it("identifies an annual summary containing both data sources", () => {
    const percentageDatum = createComparisonChartData(
      target,
      accomplishment,
      annualComparisonFields,
    )[0];
    const rawDatum = {
      ...percentageDatum,
      id: "raw",
      dataSource: "rawData" as const,
    };

    expect(chartDataSourceLabel([percentageDatum, rawDatum])).toBe(
      "Percentage + Raw Data",
    );
  });

  it("creates one annual comparison category per reported indicator", () => {
    const entries = {
      enrollment: {
        results: {
          target: { ...target, total: "40" },
          accomplishment: { ...accomplishment, total: "38.5" },
        },
      },
      research: {
        results: {
          target: { ...target, total: "60%" },
          accomplishment: { ...accomplishment, total: "62" },
        },
      },
      unreported: {
        results: {
          target: { ...target, total: "" },
          accomplishment: { ...accomplishment, total: "" },
        },
      },
    };

    const data = createAnnualIndicatorChartData(
      [
        { id: "enrollment", title: "Enrollment" },
        { id: "research", title: "Research outputs" },
        { id: "unreported", title: "Unreported indicator" },
      ],
      entries,
    );

    expect(data).toHaveLength(2);
    expect(data[0]).toMatchObject({
      id: "enrollment",
      label: "Enrollment",
      targetDisplay: "40%",
      accomplishmentDisplay: "38.5%",
      status: "below",
    });
    expect(data[1]).toMatchObject({
      id: "research",
      label: "Research outputs",
      targetDisplay: "60%",
      accomplishmentDisplay: "62%",
      status: "met",
    });
  });

  it("creates an annual total series for the selected indicator", () => {
    const data = createAnnualIndicatorSeriesChartData("employability", [
      {
        year: 2025,
        entries: {
          employability: {
            results: {
              target: { ...target, total: "70" },
              accomplishment: { ...accomplishment, total: "68" },
            },
          },
        },
      },
      {
        year: 2026,
        entries: {
          employability: {
            results: {
              target: { ...target, total: "80" },
              accomplishment: { ...accomplishment, total: "85" },
            },
          },
        },
      },
    ]);

    expect(data).toMatchObject([
      {
        id: "2025",
        label: "2025",
        targetNumeric: 70,
        accomplishmentNumeric: 68,
        status: "below",
      },
      {
        id: "2026",
        label: "2026",
        targetNumeric: 80,
        accomplishmentNumeric: 85,
        status: "met",
      },
    ]);
  });

  it("orders the annual indicator series from earliest to latest year", () => {
    const entry = {
      employability: {
        results: { target, accomplishment },
      },
    };
    const input = [
      { year: 2026, entries: entry },
      { year: 2024, entries: entry },
      { year: 2025, entries: entry },
    ];

    const data = createAnnualIndicatorSeriesChartData("employability", input);

    expect(data.map((item) => item.label)).toEqual(["2024", "2025", "2026"]);
    expect(input.map((item) => item.year)).toEqual([2026, 2024, 2025]);
  });
});
