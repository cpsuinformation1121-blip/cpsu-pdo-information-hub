import type { PublicResource } from "../../contracts/resource";
import { AppDialog } from "../../components/ui/AppDialog";
import { LazyPdfPreview } from "./LazyPdfPreview";
import { ZoomableImagePreview } from "./ZoomableImagePreview";

type PublicResourcePreviewDialogProps = {
  resource: PublicResource;
  url: string;
  onClose: () => void;
};

export function PublicResourcePreviewDialog({
  resource,
  url,
  onClose,
}: PublicResourcePreviewDialogProps) {
  return (
    <AppDialog
      title={resource.displayName}
      description="Preview only. Pinch to zoom and drag to move."
      onClose={onClose}
      size="viewport"
    >
      <div className="flex min-h-0 flex-1 bg-surface-secondary">
        {resource.fileType === "image" ? (
          <ZoomableImagePreview url={url} title={resource.displayName} />
        ) : (
          <LazyPdfPreview url={url} title={resource.displayName} />
        )}
      </div>
    </AppDialog>
  );
}
