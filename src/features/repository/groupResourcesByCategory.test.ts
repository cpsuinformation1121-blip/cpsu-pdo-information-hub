import { describe, expect, it } from "vitest";
import type { PublicResource } from "../../contracts/resource";
import { groupResourcesByCategory } from "./groupResourcesByCategory";

const resource = (
  overrides: Partial<PublicResource> = {},
): PublicResource => ({
  id: "A".repeat(43),
  filename: "Original Report FINAL.pdf",
  displayName: "Original report final",
  sectionId: "statistical-profile",
  categoryId: "student-population",
  year: 2026,
  fileType: "pdf",
  mimeType: "application/pdf",
  fileSize: 2_048,
  uploadedAt: "2026-08-12T06:02:16.467Z",
  ...overrides,
});

describe("groupResourcesByCategory", () => {
  it("uses configured category titles while preserving original resource filenames", () => {
    const groups = groupResourcesByCategory([resource()]);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      categoryTitle: "Student Population",
      sectionTitle: "Statistical Profile",
    });
    expect(groups[0].resources[0].filename).toBe("Original Report FINAL.pdf");
  });

  it("keeps resources in the same category together and orders categories institutionally", () => {
    const groups = groupResourcesByCategory([
      resource({
        filename: "accreditation.pdf",
        sectionId: "higher-education-performance",
        categoryId: "accreditation",
      }),
      resource(),
      resource({
        filename: "student-population-2025.pdf",
        year: 2025,
      }),
    ]);

    expect(groups.map((group) => group.categoryTitle)).toEqual([
      "Student Population",
      "Accreditation",
    ]);
    expect(groups[0].resources).toHaveLength(2);
  });

  it("groups files without a category directly under their section", () => {
    const groups = groupResourcesByCategory([
      resource({
        filename: "Office Report.pdf",
        categoryId: undefined,
        year: "2025-2026",
      }),
    ]);
    expect(groups[0]).toMatchObject({
      categoryTitle: "Statistical Profile",
      isSectionRoot: true,
      sectionTitle: "Statistical Profile",
    });
  });

  it("places uncategorized files first, followed by configured category order", () => {
    const groups = groupResourcesByCategory([
      resource({
        filename: "personnel.pdf",
        categoryId: "human-resources",
      }),
      resource({
        filename: "section-report.pdf",
        categoryId: undefined,
      }),
      resource(),
    ]);

    expect(
      groups.map(({ categoryTitle, isSectionRoot }) => ({
        categoryTitle,
        isSectionRoot,
      })),
    ).toEqual([
      { categoryTitle: "Statistical Profile", isSectionRoot: true },
      { categoryTitle: "Student Population", isSectionRoot: false },
      { categoryTitle: "Human Resources", isSectionRoot: false },
    ]);
  });
});

it("keeps matching category IDs in different sections separate", () => {
  const sections = [{ id: "first", title: "First", categories: [{ id: "reports", title: "First reports" }] }, { id: "second", title: "Second", categories: [{ id: "reports", title: "Second reports" }] }];
  const groups = groupResourcesByCategory([resource({ sectionId: "first", categoryId: "reports" }), resource({ sectionId: "second", categoryId: "reports" })], sections);
  expect(groups.map(group => group.categoryTitle)).toEqual(["First reports", "Second reports"]);
  expect(groups.every(group => group.resources.length === 1)).toBe(true);
});
