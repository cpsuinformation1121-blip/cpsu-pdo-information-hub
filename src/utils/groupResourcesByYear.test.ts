import { describe, expect, it } from "vitest";
import type { PublicResource } from "../contracts/resource";
import { groupResourcesByYear } from "./groupResourcesByYear";

function resource(name: string, year: PublicResource["year"], changes: Partial<PublicResource> = {}): PublicResource {
  return {
    id: name + year, filename: name + ".pdf", displayName: name, sectionId: "forms",
    categoryId: "reports", year, fileType: "pdf", mimeType: "application/pdf",
    fileSize: 1024, uploadedAt: "2026-09-01T00:00:00Z", ...changes,
  };
}
describe("groupResourcesByYear", () => {
  it("groups names differing only in year, case, spacing, hyphens or underscores", () => {
    const groups = groupResourcesByYear([
      resource("Student-Population-2024", 2024),
      resource("student_population_2026", 2026),
      resource("Student   Population 2025", 2025),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].title).toBe("Student Population");
    expect(groups[0].years).toEqual([2026, 2025, 2024]);
  });
  it("groups consecutive school-year labels with a title without a year", () => {
    const groups = groupResourcesByYear([
      resource("Annual report (2024-2025)", "2024-2025"),
      resource("Annual report", "2026-2027"),
      resource("Annual report 2025–2026", "2025-2026"),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].title).toBe("Annual report");
    expect(groups[0].years).toEqual(["2026-2027", "2025-2026", "2024-2025"]);
  });
  it.each([
    { sectionId: "another-section" }, { categoryId: "other" }, { categoryId: undefined },
    { fileType: "link" as const, filename: "Report.link" },
    { fileType: "xlsx" as const, filename: "Report.xlsx" },
  ])("keeps different locations or types separate: %j", (change) => {
    expect(groupResourcesByYear([resource("Report 2024", 2024), resource("Report 2025", 2025, change)])).toHaveLength(2);
  });
  it("does not merge different reports or remove unrelated years and numbers", () => {
    const groups = groupResourcesByYear([
      resource("Report for 2020 published 2024", 2024),
      resource("Report for 2021 published 2025", 2025),
      resource("Form 101 2024", 2024), resource("Form 102 2025", 2025),
      resource("Research report 2024", 2024),
    ]);
    expect(groups).toHaveLength(5);
  });
  it("does not remove digits embedded in words or group year-only names", () => {
    expect(groupResourcesByYear([resource("Code2024", 2024), resource("Code2025", 2025)])).toHaveLength(2);
    expect(groupResourcesByYear([resource("2024", 2024), resource("2025", 2025)])).toHaveLength(2);
  });
  it("keeps group order from the input sort while ordering members newest year first", () => {
    const groups = groupResourcesByYear([resource("Z 2024", 2024), resource("A 2026", 2026), resource("Z 2026", 2026)]);
    expect(groups.map((group) => group.title)).toEqual(["Z", "A"]);
    expect(groups[0].years).toEqual([2026, 2024]);
  });
  it("does not mutate inputs and keeps exact IDs and private admin fields", () => {
    const input = [ { ...resource("Report 2024", 2024), key: "forms/reports/2024/report.pdf" }, { ...resource("Report 2025", 2025), key: "forms/reports/2025/report.pdf" } ];
    const original = [...input];
    const groups = groupResourcesByYear(input);
    expect(input).toEqual(original);
    expect(groups[0].resources[0]).toBe(input[1]);
    expect(groups[0].resources[0].key).toBe(input[1].key);
  });
  it("retains multiple resources from the same year and counts unique years", () => {
    const groups = groupResourcesByYear([resource("Report", 2026, { id: "a" }), resource("Report", 2026, { id: "b" })]);
    expect(groups[0].resources).toHaveLength(2);
    expect(groups[0].years).toEqual([2026]);
  });
  it("handles an empty inventory", () => { expect(groupResourcesByYear([])).toEqual([]); });
});
