import { describe, expect, it } from "vitest";
import {
  createOpcrAnnualIndicatorChartData,
  createOpcrAnnualIndicatorSeriesChartData,
} from "./opcrChartData";

const blank = { h1: "", h2: "", total: "" };

describe("OPCR chart data", () => {
  it("uses Raw Data when Percentage is empty", () => {
    const data = createOpcrAnnualIndicatorChartData(
      [{ id: "services", title: "Services delivered" }],
      {
        services: {
          results: { target: blank, accomplishment: blank },
          rawData: {
            target: { ...blank, total: "500" },
            accomplishment: { ...blank, total: "525" },
          },
        },
      },
    );

    expect(data[0]).toMatchObject({
      dataSource: "rawData",
      targetDisplay: "500",
      accomplishmentDisplay: "525",
      targetNumeric: 500,
      accomplishmentNumeric: 525,
    });
  });

  it("uses Percentage when both Percentage and Raw Data exist", () => {
    const data = createOpcrAnnualIndicatorSeriesChartData("services", [
      {
        year: 2026,
        entries: {
          services: {
            results: {
              target: { ...blank, total: "90" },
              accomplishment: { ...blank, total: "95" },
            },
            rawData: {
              target: { ...blank, total: "500" },
              accomplishment: { ...blank, total: "525" },
            },
          },
        },
      },
    ]);

    expect(data[0]).toMatchObject({
      dataSource: "percentage",
      targetDisplay: "90%",
      accomplishmentDisplay: "95%",
      targetNumeric: 90,
      accomplishmentNumeric: 95,
    });
  });
});
