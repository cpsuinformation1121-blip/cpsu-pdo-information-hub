---
type: "query"
date: "2026-09-17T08:30:31.603695+00:00"
question: "the pdf viewing problem is still there please fix it well."
contributor: "graphify"
outcome: "corrected"
correction: "The previous modern PDF.js canvas-only change was insufficient for older Android engines; compatibility is required in both the main PDF.js bundle and its worker, together with cancellation-safe loading."
source_nodes: ["PublicResourcePreviewDialog()", "publicResourcePreviewHandler.ts"]
---

# Q: the pdf viewing problem is still there please fix it well.

## Answer

Expanded from original query via graph vocab: [pdf, preview, public, resource, dialog, mobile, access]. The signed R2 response and exact 460463-byte production PDF were valid; the remaining failure was browser-side rendering compatibility. The shared PdfPreview now uses the PDF.js legacy build, explicitly polyfills Promise.withResolvers in both the page and worker, renders through CanvasRenderingContext2D, and ignores stale rejected loads after effect cancellation. The exact deployed two-page PDF rendered nonblank pages in a mobile Chromium test with Promise.withResolvers removed.

## Outcome

- Signal: corrected
- Correction: The previous modern PDF.js canvas-only change was insufficient for older Android engines; compatibility is required in both the main PDF.js bundle and its worker, together with cancellation-safe loading.

## Source Nodes

- PublicResourcePreviewDialog()
- publicResourcePreviewHandler.ts