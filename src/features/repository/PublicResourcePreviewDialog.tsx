import {
  Maximize2,
  Minimize2,
  Scan,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useState } from "react";
import type { PublicResource } from "../../contracts/resource";
import { AppDialog } from "../../components/ui/AppDialog";

const MIN_ZOOM = 50;
const MAX_ZOOM = 250;
const ZOOM_STEP = 25;

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFitToWindow, setIsFitToWindow] = useState(true);
  const [zoom, setZoom] = useState(100);

  const adjustZoom = (amount: number) => {
    setIsFitToWindow(false);
    setZoom((currentZoom) => clampZoom(currentZoom + amount));
  };

  const fitToWindow = () => {
    setZoom(100);
    setIsFitToWindow(true);
  };

  return (
    <AppDialog
      title={resource.displayName}
      description="Preview only."
      onClose={onClose}
      size={isExpanded ? "viewport" : "wide"}
    >
      <div
        className={`flex min-h-0 flex-col bg-surface-secondary ${isExpanded ? "flex-1" : "h-[min(70dvh,48rem)]"}`}
      >
        {resource.fileType === "image" ? (
          <>
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-surface px-3 py-2 sm:px-4">
              <div
                className="flex items-center gap-1"
                role="group"
                aria-label="Image zoom controls"
              >
                <button
                  type="button"
                  onClick={() => adjustZoom(-ZOOM_STEP)}
                  disabled={!isFitToWindow && zoom <= MIN_ZOOM}
                  aria-label="Zoom out"
                  title="Zoom out"
                  className="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg text-foreground hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ZoomOut className="size-5" aria-hidden="true" />
                </button>
                <output
                  className="min-w-16 text-center text-sm font-semibold tabular-nums text-muted-foreground"
                  aria-live="polite"
                >
                  {isFitToWindow ? "Fit" : `${zoom}%`}
                </output>
                <button
                  type="button"
                  onClick={() => adjustZoom(ZOOM_STEP)}
                  disabled={!isFitToWindow && zoom >= MAX_ZOOM}
                  aria-label="Zoom in"
                  title="Zoom in"
                  className="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg text-foreground hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ZoomIn className="size-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={fitToWindow}
                  aria-pressed={isFitToWindow}
                  className="ml-1 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <Scan className="size-4" aria-hidden="true" />
                  Fit
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded((current) => !current)}
                aria-pressed={isExpanded}
                className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-primary"
              >
                {isExpanded ? (
                  <Minimize2 className="size-4" aria-hidden="true" />
                ) : (
                  <Maximize2 className="size-4" aria-hidden="true" />
                )}
                {isExpanded ? "Restore" : "Expand"}
              </button>
            </div>
            <div
              className="min-h-0 flex-1 overflow-auto overscroll-contain p-3 sm:p-5"
              aria-label="Scrollable image preview"
            >
              <div
                className={`flex min-h-full min-w-full justify-center ${isFitToWindow ? "items-center" : "items-start"}`}
              >
                <img
                  src={url}
                  alt={`Preview of ${resource.displayName}`}
                  referrerPolicy="no-referrer"
                  className={`h-auto rounded-xl object-contain shadow-sm ${isFitToWindow ? "max-h-full max-w-full" : "max-w-none"}`}
                  style={
                    isFitToWindow ? undefined : { width: `${zoom}%` }
                  }
                />
              </div>
            </div>
          </>
        ) : (
          <div className="min-h-0 flex-1 p-3 sm:p-5">
            <iframe
              src={url}
              title={`Preview of ${resource.displayName}`}
              referrerPolicy="no-referrer"
              className="h-full min-h-80 w-full rounded-xl border border-border bg-white"
            />
          </div>
        )}
      </div>
    </AppDialog>
  );
}
