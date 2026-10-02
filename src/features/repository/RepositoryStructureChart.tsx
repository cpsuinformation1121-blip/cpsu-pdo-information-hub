import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { repositorySections } from "../../config/repository";

const maximumCategoryCount = Math.max(
  ...repositorySections.map((section) => section.categories.length),
  1,
);

export function RepositoryStructureChart() {
  const [selectedSectionId, setSelectedSectionId] = useState(
    repositorySections[0].id,
  );
  const selectedSection =
    repositorySections.find((section) => section.id === selectedSectionId) ??
    repositorySections[0];

  return (
    <div className="mt-8 grid gap-8 border-y border-strong-border py-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)] lg:gap-12">
      <div>
        <div className="mb-5 flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <span>Section</span>
          <span>Categories</span>
        </div>
        <div className="space-y-3" aria-label="Repository categories by section">
          {repositorySections.map((section) => {
            const isSelected = section.id === selectedSection.id;
            const width = `${Math.max((section.categories.length / maximumCategoryCount) * 100, 8)}%`;

            return (
              <button
                key={section.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedSectionId(section.id)}
                className={`w-full cursor-pointer border px-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  isSelected
                    ? "border-primary bg-primary-soft"
                    : "border-border bg-surface hover:border-primary/30"
                }`}
              >
                <span className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-foreground">
                    <span className="mr-2 text-primary">{section.code}</span>
                    {section.title}
                  </span>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-primary">
                    {section.categories.length}
                  </span>
                </span>
                <span className="mt-2 block h-2 overflow-hidden rounded-sm bg-border" aria-hidden="true">
                  <span
                    className="block h-full rounded-sm bg-primary transition-[width] duration-300 motion-reduce:transition-none"
                    style={{ width }}
                  />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-l-2 border-primary pl-5" aria-live="polite">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
          Section {selectedSection.code}
        </p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight">
          {selectedSection.title}
        </h3>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
          Categories
        </p>
        <ul className="mt-3 space-y-2 text-sm text-foreground">
          {selectedSection.categories.map((category) => (
            <li key={category.id} className="border-b border-border pb-2">
              {category.title}
            </li>
          ))}
        </ul>
        <Link
          to={selectedSection.path}
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary"
        >
          Browse this section
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
