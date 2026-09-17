---
type: "query"
date: "2026-09-17T08:40:51.033226+00:00"
question: "in this section please change the sequence like into ascending order 2021, 2022, 2023...... not decending"
contributor: "graphify"
outcome: "useful"
source_nodes: ["createAnnualIndicatorSeriesChartData()", "createOpcrAnnualIndicatorSeriesChartData()"]
---

# Q: in this section please change the sequence like into ascending order 2021, 2022, 2023...... not decending

## Answer

Expanded from original query via graph vocab: [annual, indicator, chart, year, accomplishment, opcr, series, sort, data, performance]. Both createAnnualIndicatorSeriesChartData and createOpcrAnnualIndicatorSeriesChartData preserved incoming API order. Each now sorts a copied yearData array numerically ascending before creating chart categories, producing earliest-to-latest labels without mutating source data. Regression tests cover descending and mixed inputs.

## Outcome

- Signal: useful

## Source Nodes

- createAnnualIndicatorSeriesChartData()
- createOpcrAnnualIndicatorSeriesChartData()