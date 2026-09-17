import { LoaderCircle } from "lucide-react";
import { lazy, Suspense } from "react";

const PdfPreview = lazy(() =>
  import("./PdfPreview").then((module) => ({ default: module.PdfPreview })),
);

export function LazyPdfPreview({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-0 flex-1 items-center justify-center gap-3 bg-surface-secondary p-6 text-sm text-muted-foreground"
          role="status"
        >
          <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
          Preparing PDF preview…
        </div>
      }
    >
      <PdfPreview url={url} title={title} />
    </Suspense>
  );
}
