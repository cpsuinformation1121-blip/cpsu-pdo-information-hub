import { Move, Scan } from "lucide-react";
import { type ReactNode, useEffect, useId, useState } from "react";
import { useGestureZoom } from "./useGestureZoom";

export type GestureZoomRenderState = {
  zoom: number;
  viewportWidth: number;
  viewportHeight: number;
};

export function GestureZoomViewport({
  label,
  children,
  minZoom = 50,
  maxZoom = 300,
}: {
  label: string;
  children: (state: GestureZoomRenderState) => ReactNode;
  minZoom?: number;
  maxZoom?: number;
}) {
  const instructionId = useId();
  const {
    viewportRef,
    viewportProps,
    zoom,
    isInteracting,
    resetZoom,
  } = useGestureZoom({ minZoom, maxZoom });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const updateSize = () => {
      setViewportSize({
        width: viewport.clientWidth,
        height: viewport.clientHeight,
      });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [viewportRef]);

  return (
    <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden bg-surface-secondary">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-surface px-3 py-2 sm:px-4">
        <p
          id={instructionId}
          className="flex min-w-0 items-center gap-2 text-xs font-medium text-muted-foreground sm:text-sm"
        >
          <Move className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate sm:hidden">Pinch to zoom · drag to move</span>
          <span className="hidden sm:inline">
            Pinch or Ctrl + scroll to zoom · drag to move · double-click to zoom
          </span>
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <output
            className="min-w-12 text-center text-xs font-semibold tabular-nums text-muted-foreground"
            aria-live="polite"
          >
            {Math.round(zoom)}%
          </output>
          <button
            type="button"
            onClick={resetZoom}
            className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-primary"
          >
            <Scan className="size-4" aria-hidden="true" />
            Fit
          </button>
        </div>
      </div>
      <div
        ref={viewportRef}
        {...viewportProps}
        role="region"
        tabIndex={0}
        aria-label={label}
        aria-describedby={instructionId}
        style={{ touchAction: "none" }}
        className={`min-h-0 min-w-0 w-full flex-1 overflow-auto overscroll-contain p-3 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:p-4 ${isInteracting ? "cursor-grabbing select-none" : "cursor-grab"}`}
      >
        {children({
          zoom,
          viewportWidth: viewportSize.width,
          viewportHeight: viewportSize.height,
        })}
      </div>
    </div>
  );
}
