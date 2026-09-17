import type { AdminResource } from "../../contracts/resource";
import { AppDialog } from "../../components/ui/AppDialog";
import { LazyPdfPreview } from "../repository/LazyPdfPreview";

export type RenameTarget = {
  key: string;
  original: string;
  value: string;
  isLink: boolean;
};

export type DeleteTarget = {
  key: string;
  filename: string;
};

export type PreviewTarget = {
  resource: AdminResource;
  url: string;
};

type DialogStateProps = {
  error?: string;
  isPending: boolean;
  onClose: () => void;
};

export function AdminResourcePreviewDialog({
  target,
  onClose,
}: {
  target: PreviewTarget;
  onClose: () => void;
}) {
  return (
    <AppDialog
      title={target.resource.filename}
      description="Temporary staff preview."
      size="wide"
      onClose={onClose}
    >
      <div className="p-4 sm:p-6">
        {target.resource.fileType === "image" ? (
          <img
            src={target.url}
            alt={`Preview of ${target.resource.displayName}`}
            referrerPolicy="no-referrer"
            className="max-h-[65dvh] w-full object-contain"
          />
        ) : (
          <div className="flex h-[65dvh] min-h-0">
            <LazyPdfPreview
              url={target.url}
              title={target.resource.displayName}
            />
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 cursor-pointer border border-strong-border px-5 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </AppDialog>
  );
}

export function AdminResourceRenameDialog({
  target,
  error,
  isPending,
  onChange,
  onClose,
  onSubmit,
}: DialogStateProps & {
  target: RenameTarget;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <AppDialog
      title="Rename"
      description={
        target.isLink
          ? "Change the public name of this link."
          : "Keep the file extension unchanged."
      }
      onClose={onClose}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="p-5 sm:p-6"
      >
        <label className="text-sm font-semibold">
          {target.isLink ? "Link name" : "Filename"}
          <input
            autoFocus
            required
            value={target.value}
            onChange={(event) => onChange(event.target.value)}
            className="mt-2 min-h-12 w-full border border-strong-border px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        {error ? (
          <p className="mt-3 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-6 grid gap-3 min-[24rem]:flex min-[24rem]:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 cursor-pointer border border-strong-border px-5 font-semibold"
          >
            Cancel
          </button>
          <button
            disabled={
              isPending ||
              !target.value.trim() ||
              target.value === target.original
            }
            className="min-h-11 cursor-pointer bg-primary px-5 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Renaming..." : "Rename resource"}
          </button>
        </div>
      </form>
    </AppDialog>
  );
}

export function AdminResourceDeleteDialog({
  target,
  error,
  isPending,
  onClose,
  onConfirm,
}: DialogStateProps & {
  target: DeleteTarget;
  onConfirm: () => void;
}) {
  return (
    <AppDialog
      title="Delete resource"
      description="This permanently deletes the file from the public repository."
      onClose={onClose}
    >
      <div className="p-5 sm:p-6">
        <p className="break-all border-l-2 border-danger bg-danger-soft px-4 py-3 text-sm font-semibold text-foreground">
          {target.filename}
        </p>
        {error ? (
          <p className="mt-3 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-6 grid gap-3 min-[24rem]:flex min-[24rem]:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 cursor-pointer border border-strong-border px-5 font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="min-h-11 cursor-pointer bg-danger px-5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Deleting..." : "Delete file"}
          </button>
        </div>
      </div>
    </AppDialog>
  );
}
