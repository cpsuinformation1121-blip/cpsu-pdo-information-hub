import { Download, ExternalLink, Eye, Pencil, Trash2 } from "lucide-react";
import type { AdminResource } from "../../contracts/resource";
import type { AdminResourceAccessMode } from "../../contracts/adminResourceAccess";

type AdminResourceActionsProps = {
  resource: AdminResource;
  accessDisabled: boolean;
  accessError?: string;
  accessPendingMode?: AdminResourceAccessMode;
  onAccess: (resource: AdminResource, mode: AdminResourceAccessMode) => void;
  onDelete: (resource: AdminResource) => void;
  onRename: (resource: AdminResource) => void;
};

const actionClassName =
  "inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap border border-primary px-3 text-sm font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0 sm:border-0 sm:p-0";

export function AdminResourceActions({
  resource,
  accessDisabled,
  accessError,
  accessPendingMode,
  onAccess,
  onDelete,
  onRename,
}: AdminResourceActionsProps) {
  const canPreview =
    resource.fileType === "pdf" || resource.fileType === "image";
  const isLink = resource.fileType === "link";

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-x-4 sm:gap-y-2">
        {isLink ? (
          <a
            href={`/api/resource-link?id=${encodeURIComponent(resource.id)}`}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
            className={actionClassName}
          >
            <ExternalLink className="mr-1.5 size-4" aria-hidden="true" />
            Open link
          </a>
        ) : (
          <>
            {canPreview ? (
              <button
                type="button"
                disabled={accessDisabled}
                onClick={() => onAccess(resource, "preview")}
                aria-label={`Preview ${resource.filename}`}
                className={actionClassName}
              >
                <Eye className="mr-1.5 size-4" aria-hidden="true" />
                {accessPendingMode === "preview" ? "Opening..." : "Preview"}
              </button>
            ) : null}
            <button
              type="button"
              disabled={accessDisabled}
              onClick={() => onAccess(resource, "download")}
              aria-label={`Download ${resource.filename}`}
              className={actionClassName}
            >
              <Download className="mr-1.5 size-4" aria-hidden="true" />
              {accessPendingMode === "download" ? "Preparing..." : "Download"}
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => onRename(resource)}
          className={actionClassName}
        >
          <Pencil className="mr-1.5 size-4" aria-hidden="true" />
          Rename
        </button>
        <button
          type="button"
          onClick={() => onDelete(resource)}
          className={`${actionClassName} border-danger/35 text-danger`}
        >
          <Trash2 className="mr-1.5 size-4" aria-hidden="true" />
          Delete
        </button>
      </div>
      {accessError ? (
        <p
          className="mt-3 max-w-sm whitespace-normal text-sm text-danger"
          role="alert"
        >
          {accessError}
        </p>
      ) : null}
    </div>
  );
}