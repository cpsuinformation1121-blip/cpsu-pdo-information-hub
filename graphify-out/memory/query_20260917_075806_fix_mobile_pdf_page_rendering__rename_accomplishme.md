---
type: "query"
date: "2026-09-17T07:58:06.392776+00:00"
question: "fix mobile PDF page rendering, rename Accomplishment Report to Physical Performance, and prevent administrators from deleting Forms"
contributor: "graphify"
outcome: "useful"
source_nodes: ["PublicResourcePreviewDialog()", "repositoryStructureStore.ts", "navigation.ts", "AdminRepositoryStructurePage.tsx"]
---

# Q: fix mobile PDF page rendering, rename Accomplishment Report to Physical Performance, and prevent administrators from deleting Forms

## Answer

Expanded via graph vocabulary: [pdf, preview, accomplishment, report, performance, structure, section, delete, admin, navigation]. Corrected PDF.js rendering to use its supported canvas-only API and disabled worker-side OffscreenCanvas, ImageDecoder, and WASM acceleration for Android compatibility. Renamed every user-facing Accomplishment Report label to Physical Performance. Added a shared protected Forms section definition, hid its section Delete button, and added a server-side deletion guard with regression tests.

## Outcome

- Signal: useful

## Source Nodes

- PublicResourcePreviewDialog()
- repositoryStructureStore.ts
- navigation.ts
- AdminRepositoryStructurePage.tsx