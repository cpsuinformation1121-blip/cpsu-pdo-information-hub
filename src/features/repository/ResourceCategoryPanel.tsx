import {
  ChevronRight,
  ExternalLink,
  File,
  FileImage,
  FileText,
  FolderOpen,
  Link2,
  LoaderCircle,
} from "lucide-react";
import { AppDialog } from "../../components/ui/AppDialog";
import { groupResourcesByYear } from "../../utils/groupResourcesByYear";
import { useId, useState } from "react";
import type { PublicResource } from "../../contracts/resource";
import { authorizePublicResourcePreview } from "../../services/publicResourcePreview";
import type { ResourceCategoryGroup } from "./groupResourcesByCategory";
import { PublicResourcePreviewDialog } from "./PublicResourcePreviewDialog";

type ResourceCategoryPanelProps = {
  group: ResourceCategoryGroup;
};

const fileTypeDetails = {
  pdf: { icon: FileText },
  xlsx: { icon: File },
  image: { icon: FileImage },
  link: { icon: Link2 },
} as const;

type ResourceRowProps = {
  resource: PublicResource;
  isPending: boolean;
  isWide: boolean;
  error?: string;
  onPreview: (resource: PublicResource) => void;
  showYear?: boolean;
};

function ResourceIdentity({ resource }: { resource: PublicResource }) {
  const FileIcon = fileTypeDetails[resource.fileType].icon;
  return (
    <span className="flex w-full items-start gap-3">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-primary-soft text-primary transition-colors group-hover:border-primary/25 group-hover:bg-surface">
        <FileIcon className="size-5" strokeWidth={1.6} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 break-words pt-1 text-sm font-semibold leading-6 text-foreground [overflow-wrap:anywhere]">
        {resource.displayName}
      </span>
    </span>
  );
}

function ResourceRow({
  resource,
  isPending,
  isWide,
  error,
  onPreview,
  showYear = false,
}: ResourceRowProps) {
  return (
    <li className={isWide ? "md:col-span-2" : undefined}>
      {showYear ? <p className="mb-2 text-sm font-semibold text-primary">Year: {resource.year}</p> : null}
      {resource.fileType === "link" ? (
        <a
          href={`/api/resource-link?id=${encodeURIComponent(resource.id)}`}
          target="_blank"
          rel="noopener noreferrer"
          referrerPolicy="no-referrer"
          aria-label={`Open ${resource.displayName} in a new tab`}
          className="group flex min-h-32 w-full cursor-pointer flex-col justify-between rounded-2xl border border-border bg-surface p-5 text-left shadow-[0_5px_16px_rgba(20,83,45,0.05)] transition-[border-color,background-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary hover:bg-primary-soft/45 hover:shadow-[0_12px_28px_rgba(20,83,45,0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span className="flex w-full items-start gap-3">
            <ResourceIdentity resource={resource} />
            <ExternalLink
              className="mt-3 size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
          </span>
          <span className="mt-5 flex items-center gap-2 font-semibold text-primary">
            <span className="text-sm">Open link</span>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-primary">
              Opens in a new tab
            </span>
          </span>
        </a>
      ) : resource.fileType === "xlsx" ? (
        <div className="flex min-h-32 flex-col justify-between rounded-2xl border border-border bg-surface-secondary/55 p-5 text-muted-foreground">
          <ResourceIdentity resource={resource} />
          <p className="mt-5 text-xs font-medium">Staff access only</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onPreview(resource)}
          disabled={isPending}
          aria-label={`Preview ${resource.displayName}`}
          className="group flex min-h-32 w-full cursor-pointer flex-col justify-between rounded-2xl border border-border bg-surface p-5 text-left shadow-[0_5px_16px_rgba(20,83,45,0.05)] transition-[border-color,background-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary hover:bg-primary-soft/45 hover:shadow-[0_12px_28px_rgba(20,83,45,0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60"
        >
          <span className="flex w-full items-start gap-3">
            <ResourceIdentity resource={resource} />
            <ChevronRight
              className="mt-3 size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
          <span className="mt-5 flex items-center gap-2 font-semibold text-primary">
            {isPending ? (
              <LoaderCircle
                className="size-4 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            ) : null}
            <span className="text-sm">
              {isPending ? "Opening..." : "Preview"}
            </span>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-primary">
              Click to open
            </span>
          </span>
        </button>
      )}
      {error ? (
        <p className="mt-2 text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </li>
  );
}

export function ResourceCategoryPanel({ group }: ResourceCategoryPanelProps) {
  const categoryTitleId = useId();
  const yearGroups = groupResourcesByYear(group.resources);
  const [selectedGroupId, setSelectedGroupId] = useState<string>();
  const selectedGroup = yearGroups.find((item) => item.id === selectedGroupId);
  const [pendingId, setPendingId] = useState<string>();
  const [preview, setPreview] = useState<{
    resource: PublicResource;
    url: string;
  }>();
  const [previewError, setPreviewError] = useState<{
    id: string;
    message: string;
  }>();

  async function handlePreview(resource: PublicResource) {
    setPendingId(resource.id);
    setPreviewError(undefined);

    try {
      const access = await authorizePublicResourcePreview(resource.id);
      setPreview({ resource, url: access.url });
    } catch (error) {
      setPreviewError({
        id: resource.id,
        message:
          error instanceof Error
            ? error.message
            : "The file preview could not be opened.",
      });
    } finally {
      setPendingId(undefined);
    }
  }

  return (
    <>
      <article
        className={group.isSectionRoot
          ? "min-w-0"
          : "min-w-0 rounded-2xl border border-primary/20 bg-primary-soft/60 p-4 sm:p-6"}
        aria-labelledby={group.isSectionRoot ? undefined : categoryTitleId}
        aria-label={
          group.isSectionRoot ? `${group.sectionTitle} resources` : undefined
        }
      >
        {!group.isSectionRoot ? (
          <header className="mb-4 flex flex-col items-start gap-3 border-b border-primary/15 pb-4 sm:flex-row sm:flex-wrap sm:justify-between">
            <div className="flex min-w-0 w-full items-start gap-3 sm:w-auto sm:flex-1">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-surface text-primary" aria-hidden="true">
                <FolderOpen className="size-5" strokeWidth={1.6} />
              </span>
              <div className="min-w-0">
                <h4 id={categoryTitleId} className="break-words font-serif text-xl tracking-tight text-foreground">
                  {group.categoryTitle}
                </h4>
              </div>
            </div>
            <p className="shrink-0 rounded-full border border-primary/15 bg-surface px-3 py-1 text-xs font-semibold text-primary">
              {group.resources.length}{" "}
              {group.resources.length === 1 ? "resource" : "resources"}
            </p>
          </header>
        ) : null}
        <ul className="grid gap-3 md:grid-cols-2">
          {yearGroups.map((yearGroup, index) => yearGroup.resources.length > 1 ? (
            <li key={yearGroup.id} className={yearGroups.length % 2 === 1 && index === yearGroups.length - 1 ? "md:col-span-2" : undefined}>
              <button type="button" onClick={() => setSelectedGroupId(yearGroup.id)}
                aria-label={`View years for ${yearGroup.title}`} aria-haspopup="dialog"
                className="group flex min-h-32 w-full cursor-pointer flex-col justify-between rounded-2xl border border-border bg-surface p-5 text-left shadow-[0_5px_16px_rgba(20,83,45,0.05)] hover:border-primary hover:bg-primary-soft/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                <ResourceIdentity resource={{ ...yearGroup.resources[0], displayName: yearGroup.title }} />
                <span className="mt-5 flex flex-wrap items-center gap-2 text-sm font-semibold text-primary">
                  View years <ChevronRight className="size-4" aria-hidden="true" />
                  <span className="text-xs font-medium text-muted-foreground">{yearGroup.resources.length} resources · {yearGroup.years.length} {yearGroup.years.length === 1 ? "year" : "years"}</span>
                </span>
              </button>
            </li>
          ) : (
            <ResourceRow key={yearGroup.id} resource={yearGroup.resources[0]}
              isPending={pendingId === yearGroup.resources[0].id}
              isWide={yearGroups.length % 2 === 1 && index === yearGroups.length - 1}
              error={previewError?.id === yearGroup.resources[0].id ? previewError.message : undefined}
              onPreview={handlePreview} />
          ))}
        </ul>
      </article>
      {selectedGroup ? (
        <AppDialog title={selectedGroup.title} description="Choose a year to view its resource." size="wide" onClose={() => setSelectedGroupId(undefined)}>
          <ul className="grid gap-4 p-5 sm:p-6 md:grid-cols-2">
            {selectedGroup.resources.map((resource) => (
              <ResourceRow key={resource.id} resource={resource} showYear isWide={false}
                isPending={pendingId === resource.id}
                error={previewError?.id === resource.id ? previewError.message : undefined}
                onPreview={handlePreview} />
            ))}
          </ul>
        </AppDialog>
      ) : null}
      {preview ? (
        <PublicResourcePreviewDialog
          resource={preview.resource}
          url={preview.url}
          onClose={() => setPreview(undefined)}
        />
      ) : null}
    </>
  );
}