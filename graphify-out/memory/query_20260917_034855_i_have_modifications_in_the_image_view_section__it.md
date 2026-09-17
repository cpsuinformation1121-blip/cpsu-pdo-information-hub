---
type: "query"
date: "2026-09-17T03:48:55.572569+00:00"
question: "I have modifications in the image view section, it's not resizable. please optimized that."
contributor: "graphify"
outcome: "useful"
source_nodes: ["PublicResourcePreviewDialog()", "AppDialog()"]
---

# Q: I have modifications in the image view section, it's not resizable. please optimized that.

## Answer

Expanded from original query via graph vocabulary: [preview, image, dialog, modal, resource, resize, zoom, viewport]. Updated PublicResourcePreviewDialog with fit-to-window, 50%-250% zoom controls, a scrollable enlarged-image canvas, and expand/restore behavior. Added an opt-in viewport size to AppDialog without changing existing default or wide consumers. TypeScript, lint, 159 tests, and production build pass.

## Outcome

- Signal: useful

## Source Nodes

- PublicResourcePreviewDialog()
- AppDialog()