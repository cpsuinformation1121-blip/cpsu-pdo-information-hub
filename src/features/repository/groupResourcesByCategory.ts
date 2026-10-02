import { repositorySections } from "../../config/repository";
import type { PublicResource } from "../../contracts/resource";

export type ResourceCategoryGroup = {
  categoryId: string;
  categoryTitle: string;
  isSectionRoot: boolean;
  sectionId: PublicResource["sectionId"];
  sectionTitle: string;
  resources: PublicResource[];
};

type StructureSection = {
  id: string;
  title: string;
  categories: readonly { id: string; title: string }[];
};

export function groupResourcesByCategory(
  resources: PublicResource[],
  sections: readonly StructureSection[] = repositorySections,
): ResourceCategoryGroup[] {
  const groups = new Map<string, ResourceCategoryGroup>();
  const sectionById = new Map(sections.map((section) => [section.id, section]));
  const categories = sections.flatMap((section) =>
    section.categories.map((category) => ({
      ...category,
      sectionId: section.id,
    })),
  );
  const categoryById = new Map(
    categories.map((category) => [JSON.stringify([category.sectionId, category.id]), category]),
  );

  resources.forEach((resource) => {
    const section = sectionById.get(resource.sectionId);
    const category = resource.categoryId
      ? categoryById.get(JSON.stringify([resource.sectionId, resource.categoryId]))
      : undefined;
    const groupId =
      JSON.stringify([resource.sectionId, resource.categoryId ?? null]);

    const existing = groups.get(groupId);
    if (existing) {
      existing.resources.push(resource);
      return;
    }

    groups.set(groupId, {
      categoryId: resource.categoryId ?? `${resource.sectionId}--section-files`,
      categoryTitle: category?.title ?? section?.title ?? resource.sectionId,
      isSectionRoot: !resource.categoryId,
      sectionId: resource.sectionId,
      sectionTitle: section?.title ?? resource.sectionId,
      resources: [resource],
    });
  });

  const sectionOrder = new Map(
    sections.map((section, index) => [section.id, index]),
  );
  const categoryOrder = new Map(
    sections.flatMap((section) =>
      section.categories.map(
        (category, index) => [`${section.id}/${category.id}`, index] as const,
      ),
    ),
  );

  return [...groups.values()].sort((left, right) => {
    const leftSectionId = left.sectionId;
    const rightSectionId = right.sectionId;
    const sectionDifference =
      (leftSectionId
        ? (sectionOrder.get(leftSectionId) ?? Number.MAX_SAFE_INTEGER)
        : Number.MAX_SAFE_INTEGER) -
      (rightSectionId
        ? (sectionOrder.get(rightSectionId) ?? Number.MAX_SAFE_INTEGER)
        : Number.MAX_SAFE_INTEGER);

    if (sectionDifference !== 0) return sectionDifference;

    if (left.isSectionRoot !== right.isSectionRoot) {
      return left.isSectionRoot ? -1 : 1;
    }

    return (
      (categoryOrder.get(`${left.sectionId}/${left.categoryId}`) ??
        Number.MAX_SAFE_INTEGER) -
      (categoryOrder.get(`${right.sectionId}/${right.categoryId}`) ??
        Number.MAX_SAFE_INTEGER)
    );
  });
}
