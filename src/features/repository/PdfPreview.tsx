import { AlertCircle, LoaderCircle } from "lucide-react";
import {
  type PDFDocumentProxy,
  type PDFPageProxy,
  GlobalWorkerOptions,
  getDocument,
} from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfWorkerUrl from "./pdf.worker.compat.ts?worker&url";
import { installPromiseWithResolversPolyfill } from "../../utils/promiseWithResolvers";
import { useEffect, useRef, useState } from "react";
import { GestureZoomViewport } from "./GestureZoomViewport";

installPromiseWithResolversPolyfill();
GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

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

        const canvasContext = canvas.getContext("2d", { alpha: false });
        if (!canvasContext) {
          throw new Error("The browser could not create a PDF canvas.");
        }

        renderTask = loadedPage.render({
          canvas: null,
          canvasContext,
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
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadingTask = getDocument({
      url,
      isImageDecoderSupported: false,
      isOffscreenCanvasSupported: false,
      useWasm: false,
    });

    void loadingTask.promise
      .then((loadedDocument) => {
        if (!cancelled) setDocument(loadedDocument);
      })
      .catch(() => {
        if (!cancelled) {
          setError("The PDF preview could not be loaded. Please try again.");
        }
      });

    return () => {
      cancelled = true;
      void loadingTask.destroy();
    };
  }, [url]);

  return (
    <GestureZoomViewport
      label={"Gesture-enabled PDF preview of " + title}
      maxZoom={250}
    >
      {({ zoom, viewportWidth }) => (
        <div className="min-h-full w-full">
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
              <p className="sticky top-0 z-[1] self-end rounded-full bg-surface/90 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
                {document.numPages} {document.numPages === 1 ? "page" : "pages"}
              </p>
              {Array.from({ length: document.numPages }, (_, index) => (
                <PdfPage
                  key={index + 1}
                  document={document}
                  pageNumber={index + 1}
                  width={Math.max(1, viewportWidth - 32)}
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
      )}
    </GestureZoomViewport>
  );
}
