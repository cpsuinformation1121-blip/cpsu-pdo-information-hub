import { describe, expect, it } from "vitest";
import {
  repositoryCategoryById,
  repositoryCategoryIds,
  repositorySections,
} from "./repository";
import { repositorySectionIds } from "../contracts/resource";

describe("repository configuration", () => {
  it("defines every supported section exactly once", () => {
    const configuredIds = repositorySections.map((section) => section.id);
    expect(new Set(configuredIds).size).toBe(configuredIds.length);
    expect(configuredIds).toEqual([...repositorySectionIds]);
  });

  it("uses unique category identifiers", () => {
    const categoryIds = repositorySections.flatMap((section) =>
      section.categories.map((category) => category.id),
    );
    expect(repositoryCategoryIds.size).toBe(categoryIds.length);
    expect(repositoryCategoryById.size).toBe(categoryIds.length);
  });

  it("exposes the Forms section at its public repository filter", () => {
    expect(repositorySections.find((section) => section.id === "forms")).toMatchObject({
      title: "Forms",
      path: "/repository?section=forms",
      categories: [{ id: "excel", title: "Excel" }],
    });
  });
});
