import { describe, expect, it } from "vitest";
import {
  calculatePeriodTotal,
  getAccomplishmentReportYears,
  isQuarterInputValid,
} from "./reportCalculations";

describe("accomplishment report calculations", () => {
  it("includes the planned report years through 2030", () => {
    expect(getAccomplishmentReportYears(2026)).toEqual([
      2030, 2029, 2028, 2027, 2026, 2025, 2024, 2023, 2022, 2021,
    ]);
  });

  it("continues beyond 2030 without dropping existing report years", () => {
    const years = getAccomplishmentReportYears(2032);

    expect(years[0]).toBe(2032);
    expect(years.at(-1)).toBe(2021);
  });

  it("totals quarterly values and treats blank quarters as zero", () => {
    expect(
      calculatePeriodTotal({ q1: "12.5", q2: "7.5", q3: "", q4: "10" }),
    ).toBe("30");
  });

  it("accepts existing percentage and grouped number formatting", () => {
    expect(
      calculatePeriodTotal({ q1: "1,000", q2: "20%", q3: "5", q4: "" }),
    ).toBe("1025");
  });

  it("does not show a misleading total for invalid input", () => {
    expect(
      calculatePeriodTotal({ q1: "10", q2: "pending", q3: "", q4: "" }),
    ).toBe("");
  });

  it("allows quarterly values with no more than two decimal places", () => {
    expect(isQuarterInputValid("")).toBe(true);
    expect(isQuarterInputValid("12")).toBe(true);
    expect(isQuarterInputValid("12.")).toBe(true);
    expect(isQuarterInputValid("12.5")).toBe(true);
    expect(isQuarterInputValid("12.50")).toBe(true);
    expect(isQuarterInputValid("1,250.75")).toBe(true);
    expect(isQuarterInputValid("12.345")).toBe(false);
    expect(isQuarterInputValid("pending")).toBe(false);
  });
});
