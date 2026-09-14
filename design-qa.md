# Design QA

**Comparison target**

- Source visual truth path: user-provided conversation attachment (local path unavailable)
- Implementation screenshot path: unavailable
- Intended viewport: wide desktop admin workspace
- Source dimensions: 1919 x 1079 pixels
- Implementation pixels, CSS size, and density normalization: unavailable
- State: authenticated administrator on `/admin/accomplish-resource`, current year selected, editable performance hierarchy expanded

**Full-view comparison evidence**

Blocked. The revised implementation compiles and builds, but no connected browser was available to capture the rendered protected route at the matching state.

**Focused region comparison evidence**

Not performed because the implementation could not be captured. Full-name wrapping, the Save changes action, saved/unsaved feedback, Results and Raw Data rows, and table proportions remain visually unverified.

**Findings**

- [P2] Rendered fidelity is unverified
  Location: accomplishment resource table.
  Evidence: the source sketch is available, but no implementation screenshot could be captured.
  Impact: exact proportions, table overflow, text wrapping, and field alignment cannot be confirmed visually.
  Fix: connect a supported browser, open the authenticated route, capture the expanded table, and compare it with the source at the same state.

**Open Questions**

- The final label replacing `Performance based on...` remains intentionally provisional.
- Persistence and chart rendering remain deferred until the final workflow is confirmed.

**Implementation Checklist**

- Capture the authenticated desktop worksheet.
- Verify hierarchy add, edit, delete, toggles, year switching, all manual inputs, and chart selection.
- Compare typography, spacing, colors, copy, and table proportions with the source.

**Comparison History**

- Initial layout pass: blocked because no browser connection was available.
- Revised table pass: added Target, Q1-Q4, Total, and chart selection; visual comparison remains blocked because no browser connection was available.
- Editable hierarchy pass: added section, group, and indicator creation, renaming, and confirmed deletion; visual comparison remains blocked because no browser connection was available.
- Data-row pass: added separate Results and Raw Data rows for every indicator; visual comparison remains blocked because no browser connection was available.
- Save and readability pass: widened the performance column, removed name truncation, and added authenticated R2 persistence with saved/unsaved feedback; visual comparison remains blocked because no browser connection was available.

**Follow-up Polish**

- Revisit field widths and row density after the final performance indicators are supplied.

Previous result: blocked


---

# Resource Card Design QA — 2026-09-09

**Comparison target**

- Source visual truth: user-provided repository screenshot and local baseline `C:\Users\reign\AppData\Local\Temp\cpsu-resource-panel-before.png`
- Implementation: `C:\Users\reign\AppData\Local\Temp\cpsu-resource-panel-after.png`
- Interaction states: `C:\Users\reign\AppData\Local\Temp\cpsu-resource-panel-hover.png` and `C:\Users\reign\AppData\Local\Temp\cpsu-resource-preview-open.png`
- Mobile implementation: `C:\Users\reign\AppData\Local\Temp\cpsu-resource-panel-mobile.png`
- Viewport: 1917 x 876 CSS pixels at deviceScaleFactor 1; mobile 390 x 844 CSS pixels at deviceScaleFactor 1
- Source crop: 1329 x 352 pixels
- Implementation crop: 1329 x 222 pixels
- Mobile crop: 350 x 266 pixels
- State: public repository with two previewable image resources

**Full-view comparison evidence**

The baseline grouped resources inside one large container, displayed year, type, size, and upload date, and limited the obvious action to a small Preview button. The revised implementation removes those metadata fields and presents each resource as a separate full-width card-button. The category heading and file count remain unchanged.

**Focused region comparison evidence**

The resource-card crop was compared in default, hover, and mobile states. Filename hierarchy, icon alignment, action label, chevron, border change, shadow lift, wrapping, and spacing remain clear at both tested widths. Clicking the full card opened the existing preview dialog.

**Required fidelity surfaces**

- Fonts and typography: existing Poppins family, weights, line heights, and hierarchy are preserved; long filenames wrap without truncation.
- Spacing and layout rhythm: card height reduced to 80 pixels on desktop, metadata whitespace removed, and 12-pixel separation added between resources.
- Colors and tokens: existing primary, border, surface, and muted tokens are reused; hover contrast remains readable.
- Image and icon quality: no new raster assets were required; existing Lucide file, eye, loading, and chevron icons remain sharp and consistent.
- Copy and content: year/date, file type, and file size are removed. “Click to preview” and “Preview” provide explicit affordance. XLSX resources retain “Staff access only” because public spreadsheet access is intentionally unavailable.

**Findings**

- No actionable P0, P1, or P2 mismatch remains.
- P3: the desktop card contains both “Click to preview” and “Preview.” This is intentional redundancy for first-time public users and may be reduced later if analytics show it is unnecessary.

**Comparison history**

- Initial finding [P2]: individual files did not read as clickable because they were plain rows inside a shared container, and the click target was limited to a small button.
- Fix: converted each previewable resource into a semantic full-width button with persistent action text, an eye icon, a directional chevron, hover elevation, stronger border feedback, and keyboard focus styling.
- Post-fix evidence: default, hover, mobile, and open-preview screenshots show the revised affordance and successful interaction.

**Interaction and console checks**

- Full-card click opened the “Graduate Disadvantage Students” preview dialog.
- Mobile cards remained readable at 390 pixels wide.
- No browser console warnings, console errors, or page errors were recorded.

Previous result: passed


---

# Resource Bento Grid QA - 2026-09-09

**Accepted direction**

- Source reference: the previously approved clickable list at `C:\Users\reign\AppData\Local\Temp\cpsu-resource-panel-after.png`
- Requested change: compact public-facing bento layout
- Rendered desktop: `C:\Users\reign\AppData\Local\Temp\cpsu-resource-bento-desktop.png`
- Rendered hover: `C:\Users\reign\AppData\Local\Temp\cpsu-resource-bento-hover.png`
- Rendered mobile: `C:\Users\reign\AppData\Local\Temp\cpsu-resource-bento-mobile.png`
- Rendered interaction: `C:\Users\reign\AppData\Local\Temp\cpsu-resource-bento-preview.png`
- Viewports: 1917 x 876 desktop and 390 x 844 mobile at deviceScaleFactor 1
- State: public repository, two previewable resources in Student Profile

**Fidelity ledger**

- Container model: changed from stacked full-width rows to a requested two-column bento grid; mobile intentionally returns to one column.
- Copy: filenames and Preview remain. “Click to preview” became the shorter “Click to open” beside the action. No unrelated page copy changed.
- Typography: existing Poppins family, weights, and filename hierarchy remain unchanged.
- Palette and borders: existing CPSU green, surface, border, muted, and shadow tokens are preserved.
- Icon treatment: existing file, eye, and chevron icons retain the same stroke style and semantic meaning.
- Spacing: paired cards are 658 x 128 pixels on desktop with a 12-pixel gutter; a lone final card spans the 1328-pixel row; mobile cards are 350 x 134 pixels and stack without overflow.
- Responsive behavior: long filenames wrap cleanly; actions remain visible at 390 pixels.
- Interaction: clicking the full first tile opened the existing “Graduate Disadvantage Students” preview dialog.
- Console health: no warnings, errors, or page errors were recorded.

**Findings**

- No actionable P0, P1, or P2 mismatch remains.
- The bento grid is intentionally limited to two columns. A lone final resource spans both columns so no empty tile remains. More columns would reduce filename readability and weaken the institutional document-list character.

**Comparison history**

- Initial list: highly scannable but visually repetitive and less discoverable for casual visitors.
- Bento revision: moved each resource into a self-contained tile with a clearer top-to-bottom reading order.
- Post-fix evidence: desktop, hover, mobile, and open-preview captures show consistent spacing, working responsiveness, and successful full-tile interaction.

**Above-the-fold copy diff**

- No header, search, navigation, or repository-introduction copy changed.

final result: passed


---

# Contact Strip QA — 2026-09-14

- Source visual truth: user-provided contact-strip attachment, 1416 × 112 pixels; local source path unavailable.
- Implementation: C:\Users\reign\AppData\Local\Temp/contact-strip-desktop.png (1328 × 108 pixels), C:\Users\reign\AppData\Local\Temp/contact-strip-mobile.png (350 × 314 pixels).
- Viewports: desktop 1416 × 900 and mobile 390 × 844 CSS pixels, deviceScaleFactor 1. Both captures are contact-list element crops. Source and implementation viewed in this conversation; width difference reflects the existing site content gutter.
- State: guest `/contact`, four supplied contact methods, no draft placeholders.

## Full-view and focused comparison

The supplied strip and rendered element capture show the same order, phone number, Teams and Facebook display names, email, white background, and green desktop separators. The single-strip crop is also the focused region: every icon and label is readable. Mobile intentionally stacks the four rows.

## Fidelity surfaces

- Typography: retained the existing institutional Poppins font; supplied text remains complete without truncation. This is an intentional product constraint rather than substituting a new font for this one section.
- Spacing: four compact horizontally aligned contact methods on desktop, three green dividers, mobile rows with horizontal separators.
- Colors: existing CPSU green divider token, bright green phone icon, library brand colors.
- Assets: local SVGs retrieved from the Iconify Logos library, no handcrafted brand artwork or remote runtime icon requests. Library Facebook and Gmail variants differ slightly from the supplied artwork; the recognizable brand/color treatment is accepted for this scoped contact update.
- Copy: exact supplied values; draft address, telephone, and office-hours placeholders removed.

## Findings and comparison history

- No actionable P0/P1/P2 layout, content, or interaction mismatch remains.
- Initial placeholder-card section replaced with the requested compact strip; post-change desktop and mobile captures confirm the result.
- P3: Teams and Facebook remain descriptive names, not links, because verified destination URLs were not supplied. Do not guess institutional accounts.

## Interaction and technical checks

- Phone href: `tel:+639177152338`; email href: `mailto:cpsu_pdo@cpsu.edu.ph`.
- Phone link accepts keyboard focus; mobile menu opens and exposes repository navigation.
- All three local image assets load; no Vite overlay, page errors, console errors, or mobile document overflow.
- In-app browser unavailable; used previously approved standalone Playwright fallback.
- TypeScript and lint pass. Phone/email handler applications were not launched.

final result: passed


---

# Contact Website-Style Revision — 2026-09-14

- Accepted direction: user explicitly requested the website style rather than matching the supplied strip. Source: existing About-page institutional cards, C:\Users\reign\AppData\Local\Temp/website-card-style-reference.png.
- Rendered evidence: C:\Users\reign\AppData\Local\Temp/contact-cards-desktop.png and C:\Users\reign\AppData\Local\Temp/contact-cards-mobile.png.
- Viewports: 1440 × 1000 desktop and 390 × 844 mobile at density 1. Region captures use native CSS size. About card reference captured at mobile size; compare component typography, colors, border, and icon treatment, not whole-page proportions.
- State: public `/contact`, four unchanged contact methods; Facebook linked to the user-supplied URL.
- Full and focused inspection: source website card and contact-list crops emitted together for comparison. Local view_image failed because the filesystem sandbox helper is unavailable; actual image bytes were inspected through the browser/runtime image output instead.

## Fidelity ledger

- Layout: four equal desktop cards and one mobile column, replacing the strip as requested; no document overflow.
- Typography: existing Poppins, muted labels, bold contact values; no new marketing copy, truncation, or fake account data.
- Palette: site surface, border, primary, primary-soft, and muted text tokens; no bright brand-color strip.
- Container: existing rounded borders and subtle institutional shadows reused.
- Icons: supported Lucide outline icons in green panels; directional icons only on actionable cards. Teams remains informational until a verified URL is provided.
- Content: supplied number, names, and email preserved; Facebook uses https://www.facebook.com/cpsu.pdo.

## Findings and correction history

- Initial browser check caught an unsupported Facebook icon export. Replaced it with the supported MessageCircle icon and reloaded. Post-fix browser checks show the page renders with no page errors or overlay.
- No actionable P0/P1/P2 visual mismatch remains against the requested existing-site style.
- Intentional deviation: Facebook uses a site-style social-message icon rather than a colored brand logo. This follows the user request for website consistency.

## Interaction proof

- Clicking the whole Facebook card opens the exact supplied destination in a new tab with noopener noreferrer; original contact page remains open. The destination was intercepted with a test response, so external Facebook content was not inspected.
- Keyboard focus on Facebook card verified; mobile layout has no document overflow.
- TypeScript, lint, production build, and all 138 tests pass.

final result: passed
