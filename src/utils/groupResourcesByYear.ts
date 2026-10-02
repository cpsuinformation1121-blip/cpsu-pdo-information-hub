import type { PublicResource } from "../contracts/resource.ts";

export type ResourceYearGroup<T extends PublicResource = PublicResource> = {
  id: string;
  title: string;
  resources: T[];
  years: PublicResource["year"][];
};

function nameWithoutYear(resource: PublicResource): string {
  const name = resource.displayName.normalize("NFKC").replace(/[-_\u2013\u2014]+/gu, " ");
  const yearParts = String(resource.year).split("-");
  // Remove only this resource's year, keeping unrelated numbers and words intact.
  const yearPattern = yearParts.length === 2
    ? `${yearParts[0]}\\s+${yearParts[1]}|${yearParts[0]}|${yearParts[1]}`
    : yearParts[0];
  const stripped = name.replace(new RegExp(`(?<![\\p{L}\\p{N}])(?:${yearPattern})(?![\\p{L}\\p{N}])`, "gu"), " ")
    .replace(/\(\s*\)|\[\s*\]/gu, " ").replace(/\s+/gu, " ").trim();
  return stripped || resource.displayName.trim();
}

export function groupResourcesByYear<T extends PublicResource>(resources: readonly T[]): ResourceYearGroup<T>[] {
  const groups = new Map<string, ResourceYearGroup<T>>();
  for (const resource of resources) {
    const title = nameWithoutYear(resource);
    const id = JSON.stringify([resource.sectionId, resource.categoryId ?? "", resource.fileType, title.toLowerCase()]);
    const group = groups.get(id);
    if (group) group.resources.push(resource);
    else groups.set(id, { id, title, resources: [resource], years: [] });
  }
  return [...groups.values()].map((group) => {
    const sorted = [...group.resources].sort((left, right) =>
      Number(String(right.year).slice(0, 4)) - Number(String(left.year).slice(0, 4)) ||
      String(right.year).localeCompare(String(left.year)) ||
      left.filename.localeCompare(right.filename) || left.id.localeCompare(right.id));
    return { ...group, resources: sorted, years: [...new Set(sorted.map((resource) => resource.year))] };
  });
}
