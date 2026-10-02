import { FileSearch, RefreshCw } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { ResourceQuery } from "../../contracts/resource";
import { groupResourcesByCategory } from "./groupResourcesByCategory";
import { RepositoryToolbar, type RepositoryFilters } from "./RepositoryToolbar";
import { ResourceCategoryPanel } from "./ResourceCategoryPanel";
import { useResourcesQuery } from "./useResourcesQuery";
import { useRepositoryStructureQuery } from "./useRepositoryStructureQuery";

export function RepositoryResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<RepositoryFilters>(() => ({
    fileType:
      searchParams.get("fileType") === "pdf" ||
      searchParams.get("fileType") === "image"
        ? (searchParams.get("fileType") as RepositoryFilters["fileType"])
        : "",
    query: searchParams.get("q") ?? "",
    section: searchParams.get("section") ?? "",
    sort:
      searchParams.get("sort") === "oldest" ||
      searchParams.get("sort") === "name-asc" ||
      searchParams.get("sort") === "name-desc" ||
      searchParams.get("sort") === "file-size" ||
      searchParams.get("sort") === "file-type"
        ? (searchParams.get("sort") as RepositoryFilters["sort"])
        : "newest",
  }));
  const deferredQuery = useDeferredValue(filters.query.trim());
  const query = useMemo<Partial<ResourceQuery>>(
    () => ({
      fileType: filters.fileType || undefined,
      limit: 100,
      groupBy: "year",
      q: deferredQuery || undefined,
      section: filters.section || undefined,
      sort: filters.sort,
    }),
    [deferredQuery, filters.fileType, filters.section, filters.sort],
  );
  const resourcesQuery = useResourcesQuery(query);
  const structureQuery = useRepositoryStructureQuery();
  const groups = useMemo(
    () =>
      groupResourcesByCategory(
        resourcesQuery.data?.data ?? [],
        structureQuery.data,
      ),
    [resourcesQuery.data?.data, structureQuery.data],
  );
  const sectionGroups = useMemo(
    () =>
      (structureQuery.data ?? []).flatMap((section) => {
        const categories = groups.filter(
          (group) => group.sectionId === section.id,
        );
        return categories.length
          ? [{ id: section.id, title: section.title, categories }]
          : [];
      }),
    [groups, structureQuery.data],
  );
  const categoryCount = groups.filter((group) => !group.isSectionRoot).length;
  function updateFilters(next: RepositoryFilters) {
    setFilters(next);
    const params = new URLSearchParams();
    if (next.query.trim()) params.set("q", next.query.trim());
    if (next.section) params.set("section", next.section);
    if (next.fileType) params.set("fileType", next.fileType);
    if (next.sort !== "newest") params.set("sort", next.sort);
    setSearchParams(params, { replace: true });
  }

  return (
    <div aria-live="polite">
      <RepositoryToolbar {...filters} onChange={updateFilters} />

      {resourcesQuery.isPending ? (
        <div className="mt-5 rounded-2xl border border-border bg-surface px-6 py-10 text-center shadow-[0_10px_28px_rgba(20,83,45,0.05)]">
          <RefreshCw
            className="mx-auto size-7 animate-spin text-primary motion-reduce:animate-none"
            aria-hidden="true"
          />
          <p className="mt-4 font-medium">Loading resources…</p>
        </div>
      ) : null}

      {resourcesQuery.isError ? (
        <div
          className="mt-5 rounded-2xl border border-border bg-surface px-6 py-9 text-center shadow-[0_10px_28px_rgba(20,83,45,0.05)] sm:px-8"
          role="alert"
        >
          <h2 className="font-serif text-2xl">Resources unavailable</h2>
          <p className="mx-auto mt-3 max-w-xl leading-7 text-muted-foreground">
            Check your connection and try again.
          </p>
          <button
            type="button"
            className="mt-5 inline-flex min-h-11 cursor-pointer items-center gap-2 border border-primary px-5 text-sm font-semibold text-primary hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            onClick={() => resourcesQuery.refetch()}
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Try again
          </button>
        </div>
      ) : null}

      {resourcesQuery.isSuccess && groups.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-border bg-surface px-6 py-9 text-center shadow-[0_10px_28px_rgba(20,83,45,0.05)] sm:px-8">
          <FileSearch
            className="mx-auto size-8 text-primary"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <h2 className="mt-3 font-serif text-2xl">No results</h2>
          <p className="mx-auto mt-3 max-w-xl leading-7 text-muted-foreground">
            Change your search or clear the filters.
          </p>
        </div>
      ) : null}

      {resourcesQuery.isSuccess && groups.length > 0 ? (
        <section className="mt-6" aria-labelledby="resource-groups-title">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-strong-border pb-4">
            <div>
              <h2
                id="resource-groups-title"
                className="font-serif text-2xl tracking-tight"
              >
                Browse by category
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {resourcesQuery.data.meta.total}{" "}
              {resourcesQuery.data.meta.total === 1 ? "resource" : "resources"}{" "}
              · {categoryCount}{" "}
              {categoryCount === 1 ? "category" : "categories"}
            </p>
          </div>
          <div className="mt-5 space-y-8">
            {sectionGroups.map((section) => (
              <section
                key={section.id}
                aria-labelledby={`repository-section-${section.id}`}
              >
                <div className="flex items-center gap-4 border-b-2 border-primary pb-3">
                  <h3
                    id={`repository-section-${section.id}`}
                    className="font-serif text-2xl tracking-tight text-foreground sm:text-3xl"
                  >
                    {section.title}
                  </h3>
                  <span className="h-px flex-1 bg-border" aria-hidden="true" />
                </div>
                <div className="mt-4 space-y-7">
                  {section.categories.map((group) => (
                    <ResourceCategoryPanel
                      key={group.categoryId}
                      group={group}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
