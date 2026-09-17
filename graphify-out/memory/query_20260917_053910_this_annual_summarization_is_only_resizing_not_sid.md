---
type: "query"
date: "2026-09-17T05:39:10.579966+00:00"
question: "this annual summarization is only resizing not side scroller please fix that not just in the opcr but also in the accomplishment report. and also in the due to the effect of the special characters the data is not showing please fix that as well making sure it still showing the graph even with special characters."
contributor: "graphify"
outcome: "useful"
source_nodes: ["ComparisonChartVisual()", "parseAccomplishmentNumber()", "AccomplishmentIndicatorSeriesChart()", "AccomplishmentsPage.tsx", "OpcrPublicPage.tsx"]
---

# Q: this annual summarization is only resizing not side scroller please fix that not just in the opcr but also in the accomplishment report. and also in the due to the effect of the special characters the data is not showing please fix that as well making sure it still showing the graph even with special characters.

## Answer

Expanded from original query via graph vocabulary: [annual, chart, data, raw, series, comparison, indicator, percentage, column, value]. Updated the shared ComparisonChartVisual used by both OPCR and Accomplishment annual summaries to render column and line charts on a fixed-width canvas of 18rem per category inside an always-horizontal, overflow-y-hidden, keyboard-focusable scroll region. Updated shared parseAccomplishmentNumber to extract one unambiguous nonnegative numeric token from decorated Raw Data, allowing values such as (27), ₱1,250 (estimated), and 63* while rejecting ambiguous multi-number text such as 50% / 75% and negative values. Original labels remain unchanged while bar/point magnitudes use the parsed number. TypeScript, lint, 165 tests, production build, and diff checks pass.

## Outcome

- Signal: useful

## Source Nodes

- ComparisonChartVisual()
- parseAccomplishmentNumber()
- AccomplishmentIndicatorSeriesChart()
- AccomplishmentsPage.tsx
- OpcrPublicPage.tsx