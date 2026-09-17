import {
  AlertCircle,
  LoaderCircle,
  Scan,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  type PDFDocumentProxy,
  type PDFPageProxy,
  GlobalWorkerOptions,
  getDocument,
} from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useEffect, useRef, useState } from "react";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const MIN_ZOOM = 50;
const MAX_ZOOM = 200;
const ZOOM_STEP = 25;

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function PdfPage({
  document,
  pageNumber,
  width,
  zoom,
}: {
  document: PDFDocumentProxy;
  pageNumber: number;
  width: number;
  zoom: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0) return;

    let page: PDFPageProxy | undefined;
    let cancelled = false;
    let renderTask: ReturnType<PDFPageProxy["render"]> | undefined;

    void document
      .getPage(pageNumber)
      .then((loadedPage) => {
        page = loadedPage;
        if (cancelled) return;

        const baseViewport = loadedPage.getViewport({ scale: 1 });
        const cssScale = (width / baseViewport.width) * (zoom / 100);
        const viewport = loadedPage.getViewport({ scale: cssScale });
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = String(Math.floor(viewport.width)) + "px";
        canvas.style.height = String(Math.floor(viewport.height)) + "px";

        renderTask = loadedPage.render({
          canvas,
          viewport,
          transform:
            pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
        });
        return renderTask.promise;
      })
      .then(() => {
        if (!cancelled) setError(false);
      })
      .catch((renderError: unknown) => {
        if (
          !cancelled &&
          (!(renderError instanceof Error) ||
            renderError.name !== "RenderingCancelledException")
        ) {
          setError(true);
        }
      });

    return () => {
      cancelled = true;
      renderTask?.cancel();
      page?.cleanup();
    };
  }, [document, pageNumber, width, zoom]);

  if (error) {
    return (
      <div className="flex min-h-48 w-full items-center justify-center bg-white p-6 text-center text-sm text-danger">
        Page {pageNumber} could not be rendered.
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-label={"PDF page " + pageNumber}
      className="block max-w-none bg-white shadow-sm"
    />
  );
}

export function PdfPreview({ url, title }: { url: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [width, setWidth] = useState(0);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => setWidth(Math.max(1, container.clientWidth - 24));
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const loadingTask = getDocument({
      url,
      isImageDecoderSupported: false,
      isOffscreenCanvasSupported: false,
      useWasm: false,
    });

    void loadingTask.promise
      .then(setDocument)
      .catch(() =>
        setError("The PDF preview could not be loaded. Please try again."),
      );

    return () => {
      void loadingTask.destroy();
    };
  }, [url]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface-secondary">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-surface px-3 py-2 sm:px-4">
        <div
          className="flex items-center gap-1"
          role="group"
          aria-label="PDF zoom controls"
        >
          <button
            type="button"
            onClick={() => setZoom((value) => clampZoom(value - ZOOM_STEP))}
            disabled={zoom <= MIN_ZOOM}
            aria-label="Zoom out"
            className="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg text-foreground hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ZoomOut className="size-5" aria-hidden="true" />
          </button>
          <output
            className="min-w-14 text-center text-sm font-semibold tabular-nums text-muted-foreground"
            aria-live="polite"
          >
            {zoom}%
          </output>
          <button
            type="button"
            onClick={() => setZoom((value) => clampZoom(value + ZOOM_STEP))}
            disabled={zoom >= MAX_ZOOM}
            aria-label="Zoom in"
            className="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg text-foreground hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ZoomIn className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(100)}
            className="ml-1 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-primary"
          >
            <Scan className="size-4" aria-hidden="true" />
            Fit
          </button>
        </div>
        {document ? (
          <span className="text-xs font-medium text-muted-foreground">
            {document.numPages} {document.numPages === 1 ? "page" : "pages"}
          </span>
        ) : null}
      </div>

      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-auto overscroll-contain p-3"
        aria-label={"Scrollable PDF preview of " + title}
      >
        {error ? (
          <div className="flex min-h-full items-center justify-center p-6 text-center">
            <p
              className="flex max-w-md items-start gap-2 text-sm text-danger"
              role="alert"
            >
              <AlertCircle
                className="mt-0.5 size-5 shrink-0"
                aria-hidden="true"
              />
              {error}
            </p>
          </div>
        ) : document ? (
          <div className="flex min-w-max flex-col items-center gap-3">
            {Array.from({ length: document.numPages }, (_, index) => (
              <PdfPage
                key={index + 1}
                document={document}
                pageNumber={index + 1}
                width={width}
                zoom={zoom}
              />
            ))}
          </div>
        ) : (
          <div
            className="flex min-h-full items-center justify-center gap-3 p-6 text-sm text-muted-foreground"
            role="status"
          >
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            Loading PDF preview…
          </div>
        )}
      </div>
    </div>
  );
}
