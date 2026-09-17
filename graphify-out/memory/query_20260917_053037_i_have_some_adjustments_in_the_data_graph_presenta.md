---
type: "query"
date: "2026-09-17T05:30:37.847888+00:00"
question: "I have some adjustments in the data graph presentation, some data's inputted only raw data but the graph visualization is only prioritizing the percentage, make an instances that if it's only the raw data inputted the graph will also show but it indicates as raw data just indicate all the graphs shown what is it, whether it is accomplishment or raw graph, then if the data was inputted in percentage and raw the graph shown will be prioritizing the percentage not the raw, raw graph only shows when the inputted data is only in raw."
contributor: "graphify"
outcome: "useful"
source_nodes: ["chartData.ts", "AccomplishmentDataChart()", "buildAccomplishmentOverviewGroups()", "opcrChartData.ts", "AccomplishmentsPage.tsx", "OpcrPublicPage.tsx"]
---

# Q: I have some adjustments in the data graph presentation, some data's inputted only raw data but the graph visualization is only prioritizing the percentage, make an instances that if it's only the raw data inputted the graph will also show but it indicates as raw data just indicate all the graphs shown what is it, whether it is accomplishment or raw graph, then if the data was inputted in percentage and raw the graph shown will be prioritizing the percentage not the raw, raw graph only shows when the inputted data is only in raw.

## Answer

Expanded from original query via graph vocabulary: [chart, raw, percentage, accomplishment, overview, series, comparison, indicator, data, results]. Added shared selectPreferredChartData logic that selects Percentage whenever requested fields contain Percentage values and falls back to Raw Data only when Percentage is empty. Added dataSource metadata to every chart datum, raw-value formatting without percent signs, source badges on every graph, and mixed-source labels for annual summaries. Applied behavior to Accomplishment and OPCR public pages, admin graph overviews, annual indicator summaries, period comparisons, and cross-year series. Empty periods are omitted and single available charts use full width. Added tests for raw fallback, percentage priority, raw formatting, mixed summaries, and OPCR parity. TypeScript, lint, 165 tests, production build, and diff check pass.

## Outcome

- Signal: useful

## Source Nodes

- chartData.ts
- AccomplishmentDataChart()
- buildAccomplishmentOverviewGroups()
- opcrChartData.ts
- AccomplishmentsPage.tsx
- OpcrPublicPage.tsx