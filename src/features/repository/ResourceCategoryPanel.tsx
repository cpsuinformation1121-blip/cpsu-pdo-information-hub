import {
  ChevronRight,
  ExternalLink,
  File,
  FileImage,
  FileText,
  Link2,
  LoaderCircle,
} from "lucide-react";
import { useState } from "react";
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
}: ResourceRowProps) {
  return (
    <li className={isWide ? "md:col-span-2" : undefined}>
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
        className="min-w-0"
        aria-label={
          group.isSectionRoot ? `${group.sectionTitle} resources` : undefined
        }
      >
        {!group.isSectionRoot ? (
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b border-strong-border pb-2">
            <h4 className="font-serif text-xl tracking-tight text-foreground">
              {group.categoryTitle}
            </h4>
            <p className="text-sm text-muted-foreground">
              {group.resources.length}{" "}
              {group.resources.length === 1 ? "resource" : "resources"}
            </p>
          </div>
        ) : null}
        <ul className="grid gap-3 md:grid-cols-2">
          {group.resources.map((resource, index) => (
            <ResourceRow
              key={resource.id}
              resource={resource}
              isPending={pendingId === resource.id}
              isWide={
                group.resources.length % 2 === 1 &&
                index === group.resources.length - 1
              }
              error={
                previewError?.id === resource.id
                  ? previewError.message
                  : undefined
              }
              onPreview={handlePreview}
            />
          ))}
        </ul>
      </article>
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