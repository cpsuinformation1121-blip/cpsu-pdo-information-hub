---
type: "query"
date: "2026-09-17T07:48:53.265033+00:00"
question: "why pdf cannot preview in the mobile phone website; fix it"
contributor: "graphify"
outcome: "useful"
source_nodes: ["PublicResourcePreviewDialog()", "AdminResourceDialogs.tsx", "AppDialog()"]
---

# Q: why pdf cannot preview in the mobile phone website; fix it

## Answer

Expanded via graph vocabulary: [pdf, preview, public, resource, dialog, mobile, access, admin]. Both public and administrator previews embedded short-lived R2 PDF URLs in iframes, which Android mobile browsers do not reliably render. Replaced the iframe paths with a shared, lazy-loaded PDF.js canvas viewer with responsive fit-to-width rendering, zoom controls, multi-page scrolling, and loading/error states. Existing signed access flows remain unchanged.

## Outcome

- Signal: useful

## Source Nodes

- PublicResourcePreviewDialog()
- AdminResourceDialogs.tsx
- AppDialog()