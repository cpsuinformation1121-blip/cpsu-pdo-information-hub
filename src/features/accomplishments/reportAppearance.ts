import {
  reportLegendCategories,
  type ReportAppearance,
  type ReportLegendCategory,
  type ReportLegendItem,
} from "../../contracts/reportAppearance";
import type { ComparisonDatum } from "./chartData";

export type { ReportAppearance, ReportLegendCategory, ReportLegendItem };

export const defaultReportLegend: readonly ReportLegendItem[] = [
  { id: "target", label: "Target", color: "#46647a" },
  { id: "met", label: "Met target", color: "#14532d" },
  { id: "below", label: "Below target", color: "#9f2d2d" },
  { id: "unavailable", label: "No comparison", color: "#4b574f" },
];

export function isBaseLegendCategory(id: string): id is ReportLegendCategory {
  return (reportLegendCategories as readonly string[]).includes(id);
}

export function resolveReportLegend(
  legend?: readonly ReportLegendItem[],
): ReportLegendItem[] {
  const base = defaultReportLegend.map((fallback) => {
    const override = legend?.find((item) => item.id === fallback.id);
    return override ? { ...fallback, ...override } : { ...fallback };
  });
  const custom = (legend ?? []).filter(
    (item) => !isBaseLegendCategory(item.id),
  );

  return [...base, ...custom];
}

export function reportBarColorKey(
  colorKey: string | undefined,
  series: "target" | "accomplishment",
) {
  return colorKey ? `${colorKey}:${series}` : undefined;
}

export function resolveBarColor(
  appearance: ReportAppearance | undefined,
  datum: ComparisonDatum,
  series: "target" | "accomplishment",
): string {
  const legend = resolveReportLegend(appearance?.legend);
  const key = reportBarColorKey(datum.colorKey, series);
  const overrideId = key ? appearance?.barColors?.[key] : undefined;
  if (overrideId?.startsWith("#")) return overrideId;

  const override = overrideId
    ? legend.find((item) => item.id === overrideId)
    : undefined;
  if (override) return override.color;

  const category: ReportLegendCategory =
    series === "target" ? "target" : datum.status;

  return (
    legend.find((item) => item.id === category)?.color ??
    defaultReportLegend[0].color
  );
}

function slugifyLabel(label: string) {
  const slug = label
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 40);

  return slug || "custom";
}

export function createCustomLegendId(
  label: string,
  legend: readonly ReportLegendItem[],
) {
  const base = `custom-${slugifyLabel(label)}`.slice(0, 56);
  const used = new Set(legend.map((item) => item.id));
  if (!used.has(base)) return base;

  let index = 2;
  while (used.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

export function restoreReportAppearance(
  appearance: { legend: ReportLegendItem[]; barColors: Record<string, string> },
  options: { legend: boolean; indicatorIds: string[] },
): { legend: ReportLegendItem[]; barColors: Record<string, string> } {
  const barColors = { ...appearance.barColors };
  for (const indicatorId of options.indicatorIds) {
    for (const key of Object.keys(barColors)) {
      if (key.startsWith(`${indicatorId}:`)) delete barColors[key];
    }
  }

  const baseLegend = options.legend
    ? defaultReportLegend.map((item) => ({ ...item }))
    : appearance.legend;

  // Drop custom legend entries that no remaining bar references.
  const referenced = new Set(Object.values(barColors));
  const legend = baseLegend.filter(
    (item) => isBaseLegendCategory(item.id) || referenced.has(item.id),
  );

  // Drop bar references to legend entries that no longer exist.
  const availableIds = new Set(legend.map((item) => item.id));
  for (const key of Object.keys(barColors)) {
    const value = barColors[key];
    if (!value.startsWith("#") && !availableIds.has(value)) {
      delete barColors[key];
    }
  }

  return { legend, barColors };
}

export function upsertCustomLegendItem(
  legend: ReportLegendItem[],
  color: string,
  label: string,
): { legend: ReportLegendItem[]; id: string } {
  const trimmed = label.trim();
  const existing = legend.find(
    (item) =>
      !isBaseLegendCategory(item.id) &&
      item.label.toLowerCase() === trimmed.toLowerCase(),
  );

  if (existing) {
    return {
      legend: legend.map((item) =>
        item.id === existing.id ? { ...item, label: trimmed, color } : item,
      ),
      id: existing.id,
    };
  }

  const id = createCustomLegendId(trimmed, legend);
  return { legend: [...legend, { id, label: trimmed, color }], id };
}
