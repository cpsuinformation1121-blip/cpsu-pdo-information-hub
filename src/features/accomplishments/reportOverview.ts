import type { AccomplishmentResourceData } from "../../contracts/accomplishmentResource";
import {
  annualComparisonFields,
  createAnnualIndicatorChartData,
  createComparisonChartData,
  quarterlyComparisonFields,
} from "./chartData";
import type { ReportOverviewGroup } from "./ReportGraphOverview";

type OverviewNode = AccomplishmentResourceData["nodes"][number];
type OverviewEntries = AccomplishmentResourceData["entries"][string];

export function buildAccomplishmentOverviewGroups(
  nodes: readonly OverviewNode[],
  entries: OverviewEntries,
): ReportOverviewGroup[] {
  const indicators = nodes.filter((node) => node.type === "indicator");
  const groups: ReportOverviewGroup[] = [];
  const annualOverview = createAnnualIndicatorChartData(indicators, entries);

  if (annualOverview.length > 0) {
    groups.push({
      id: "annual-overview",
      title: "Annual performance by indicator",
      charts: [
        {
          id: "annual-overview",
          title: "Annual performance by indicator",
          description:
            "Annual target and accomplishment totals for the selected year.",
          data: annualOverview,
        },
      ],
    });
  }

  for (const section of nodes.filter((node) => node.type === "section")) {
    for (const group of nodes.filter(
      (node) => node.type === "group" && node.parentId === section.id,
    )) {
      const charts = nodes
        .filter(
          (node) => node.type === "indicator" && node.parentId === group.id,
        )
        .flatMap((indicator) => {
          const results = entries[indicator.id]?.results;
          return [
            {
              id: `${indicator.id}-annual`,
              title: `${indicator.title} — Annual total`,
              description: "Cumulative target and accomplishment.",
              data: createComparisonChartData(
                results?.target,
                results?.accomplishment,
                annualComparisonFields,
                indicator.id,
              ),
            },
            {
              id: `${indicator.id}-quarterly`,
              title: `${indicator.title} — Quarterly performance`,
              description:
                "Target compared with accomplishment for each quarter.",
              data: createComparisonChartData(
                results?.target,
                results?.accomplishment,
                quarterlyComparisonFields,
                indicator.id,
              ),
            },
          ];
        });

      if (charts.length > 0) {
        groups.push({
          id: group.id,
          title: `${section.title} · ${group.title}`,
          charts,
        });
      }
    }
  }

  return groups;
}
