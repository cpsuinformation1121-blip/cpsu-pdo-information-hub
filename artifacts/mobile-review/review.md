# Mobile layout review - 2 October 2026

Reviewed all 17 distinct public and administrator routes in Chromium mobile emulation at 320px, 390px, and 768px widths, with 1440px desktop regression coverage. Additional interaction checks used a short 320x568 viewport. Screenshots and JSON findings are stored in this directory.

## Findings fixed

- Public category titles were squeezed beside resource counts and split words on narrow screens. Counts now sit below the title on phones; larger screens retain the inline layout.
- The OPCR editor's non-wrapping title and action row caused the tablet page to expand to 1312px at a 768px viewport. Report headings now wrap and action rows stack until desktop space is available. Both report editors use the same spacing.
- The active administrator tab could remain offscreen in the horizontal navigation. It is now brought into view on route changes. The mobile sign-out button has an accessible name.
- Report edit/delete icon controls and dialog close buttons now have 44px touch targets on phones.
- Resource edit category choices could display No category after asynchronous structure loading. Watched section and category values now keep the visible selections synchronized. Browser checks confirmed original selections, unchanged category after a name edit, reset after a section change, and selection of the new category.

## Verification

All reviewed routes fit their intended viewport after the fixes. Wide charts and report tables retain their own horizontal scrolling containers. Checked public navigation, resource year dialogs, resource edit dialogs, file/link forms, structure editing, staff creation form, expanded report views, editable report fields, active admin tab visibility, and empty states. Short-screen dialogs remain scrollable.

Administrator identity and API responses were isolated browser fixtures, including long labels and multiple reporting years. No live account, resource, upload, or save operation was performed. This is browser emulation, not physical iOS/Safari or Android device testing. PDF/image rendering and actual file transfers were not re-tested as part of this layout review.

Final project validation: TypeScript, lint, all 312 tests across 54 files, and production build.
