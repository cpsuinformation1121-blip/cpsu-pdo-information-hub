import type { OpcrResourceData } from "../../contracts/opcrResource";
import type { ReportOverviewGroup } from "../accomplishments/ReportGraphOverview";
import {
  createOpcrAnnualIndicatorChartData,
  createOpcrComparisonChartData,
} from "./opcrChartData";

type OverviewNode = OpcrResourceData["nodes"][number];
type OverviewEntries = OpcrResourceData["entries"][string];

export function buildOpcrOverviewGroups(
  nodes: readonly OverviewNode[],
  entries: OverviewEntries,
): ReportOverviewGroup[] {
  const indicators = nodes.filter((node) => node.type === "indicator");
  const groups: ReportOverviewGroup[] = [];
  const annualOverview = createOpcrAnnualIndicatorChartData(indicators, entries);

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
              data: createOpcrComparisonChartData(
                results?.target,
                results?.accomplishment,
                ["total"],
                indicator.id,
              ),
            },
            {
              id: `${indicator.id}-half`,
              title: `${indicator.title} — Half-year performance`,
              description:
                "Target compared with accomplishment for each half-year period.",
              data: createOpcrComparisonChartData(
                results?.target,
                results?.accomplishment,
                ["h1", "h2"],
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
