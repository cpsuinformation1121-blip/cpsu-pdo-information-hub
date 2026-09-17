import { Search, X } from "lucide-react";
import type {
  RepositorySectionId,
  ResourceFileType,
  ResourceSort,
} from "../../contracts/resource";
import { useRepositoryStructureQuery } from "./useRepositoryStructureQuery";

export type RepositoryFilters = {
  fileType: ResourceFileType | "";
  query: string;
  section: RepositorySectionId | "";
  sort: ResourceSort;
};

type RepositoryToolbarProps = RepositoryFilters & {
  onChange: (filters: RepositoryFilters) => void;
};

const fileTypeOptions: readonly {
  value: ResourceFileType | "";
  label: string;
}[] = [
  { value: "", label: "All file types" },
  { value: "pdf", label: "PDF documents" },
  { value: "image", label: "Images" },
  { value: "link", label: "Links" },
];

const sortOptions: readonly { value: ResourceSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
  { value: "file-size", label: "Largest first" },
  { value: "file-type", label: "File type" },
];

const emptyFilters: RepositoryFilters = {
  fileType: "",
  query: "",
  section: "",
  sort: "newest",
};

export function RepositoryToolbar({
  fileType,
  onChange,
  query,
  section,
  sort,
}: RepositoryToolbarProps) {
  const structure = useRepositoryStructureQuery();
  const hasFilters = Boolean(query || section || fileType || sort !== "newest");
  const controlClass =
    "mt-2 min-h-12 w-full rounded-xl border border-strong-border bg-surface px-4 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15";

  return (
    <div className="mt-6 rounded-2xl border border-border bg-surface px-4 py-5 shadow-[0_12px_32px_rgba(20,83,45,0.06)] sm:px-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-12 lg:items-end">
        <label className="col-span-2 block lg:col-span-5">
          <span className="text-sm font-semibold">Search</span>
          <span className="relative mt-2 block">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) =>
                onChange({ fileType, query: event.target.value, section, sort })
              }
              placeholder="File or category"
              className="min-h-12 w-full rounded-xl border border-strong-border bg-surface py-3 pl-11 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </span>
        </label>

        <label className="col-span-2 block lg:col-span-3">
          <span className="text-sm font-semibold">Section</span>
          <select
            value={section}
            onChange={(event) =>
              onChange({
                fileType,
                query,
                section: event.target.value as RepositorySectionId | "",
                sort,
              })
            }
            className={controlClass}
          >
            <option value="">All sections</option>
            {structure.data?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>

        <label className="block lg:col-span-2">
          <span className="text-sm font-semibold">Type</span>
          <select
            value={fileType}
            onChange={(event) =>
              onChange({
                fileType: event.target.value as ResourceFileType | "",
                query,
                section,
                sort,
              })
            }
            className={controlClass}
          >
            {fileTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block lg:col-span-2">
          <span className="text-sm font-semibold">Sort</span>
          <select
            value={sort}
            onChange={(event) =>
              onChange({
                fileType,
                query,
                section,
                sort: event.target.value as ResourceSort,
              })
            }
            className={controlClass}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {hasFilters ? (
        <button
          type="button"
          onClick={() => onChange(emptyFilters)}
          className="mt-5 inline-flex min-h-10 cursor-pointer items-center gap-2 text-sm font-semibold text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          <X className="size-4" aria-hidden="true" />
          Clear filters
        </button>
      ) : null}
    </div>
  );
}
