import {
  formatPercentageValue,
  getComparisonStatus,
  parseAccomplishmentNumber,
  selectPreferredChartData,
  type ChartDataSource,
  type ComparisonDatum,
} from "../accomplishments/chartData";

export type OpcrPeriodValues = {
  h1: string;
  h2: string;
  total: string;
};

type OpcrEntry = {
  results: { target: OpcrPeriodValues; accomplishment: OpcrPeriodValues };
  rawData: { target: OpcrPeriodValues; accomplishment: OpcrPeriodValues };
};

function formatChartValue(value: string, source: ChartDataSource) {
  if (!value) return "Not reported";
  return source === "percentage" ? formatPercentageValue(value) : value;
}

export function createOpcrComparisonChartData(
  target: OpcrPeriodValues | undefined,
  accomplishment: OpcrPeriodValues | undefined,
  selectedPeriods: ReadonlyArray<"h1" | "h2" | "total"> = ["h1", "h2", "total"],
  colorKeyPrefix?: string,
  dataSource: ChartDataSource = "percentage",
): ComparisonDatum[] {
  const periodLabels = {
    h1: "H1",
    h2: "H2",
    total: "Annual",
  } as const;

  return selectedPeriods.map((id) => {
    const label = periodLabels[id];
    const targetValue = target?.[id]?.trim() ?? "";
    const accomplishmentValue = accomplishment?.[id]?.trim() ?? "";
    const targetNumeric = targetValue
      ? parseAccomplishmentNumber(targetValue)
      : null;
    const accomplishmentNumeric = accomplishmentValue
      ? parseAccomplishmentNumber(accomplishmentValue)
      : null;

    return {
      id,
      label,
      targetDisplay: formatChartValue(targetValue, dataSource),
      targetNumeric,
      accomplishmentDisplay:
        formatChartValue(accomplishmentValue, dataSource),
      accomplishmentNumeric,
      status: getComparisonStatus(targetNumeric, accomplishmentNumeric),
      dataSource,
      colorKey: colorKeyPrefix ? `${colorKeyPrefix}:${id}` : undefined,
    };
  });
}

export function createOpcrAnnualIndicatorChartData(
  indicators: Array<{ id: string; title: string }>,
  entries: Record<string, OpcrEntry>,
): ComparisonDatum[] {
  return indicators.flatMap((indicator) => {
    const selected = selectPreferredChartData(entries[indicator.id], ["total"]);
    if (!selected) return [];
    const targetValue = selected.row.target.total?.trim() ?? "";
    const accomplishmentValue =
      selected.row.accomplishment.total?.trim() ?? "";
    const targetNumeric = targetValue
      ? parseAccomplishmentNumber(targetValue)
      : null;
    const accomplishmentNumeric = accomplishmentValue
      ? parseAccomplishmentNumber(accomplishmentValue)
      : null;
    return [{
      id: indicator.id,
      label: indicator.title,
      targetDisplay: formatChartValue(targetValue, selected.source),
      targetNumeric,
      accomplishmentDisplay:
        formatChartValue(accomplishmentValue, selected.source),
      accomplishmentNumeric,
      status: getComparisonStatus(targetNumeric, accomplishmentNumeric),
      dataSource: selected.source,
      colorKey: `${indicator.id}:total`,
    }];
  });
}

export function createOpcrAnnualIndicatorSeriesChartData(
  indicatorId: string,
  yearData: Array<{ year: number; entries: Record<string, OpcrEntry> }>,
): ComparisonDatum[] {
  return yearData.flatMap(({ year, entries }) => {
    const selected = selectPreferredChartData(entries[indicatorId], ["total"]);
    if (!selected) return [];
    const targetValue = selected.row.target.total?.trim() ?? "";
    const accomplishmentValue =
      selected.row.accomplishment.total?.trim() ?? "";
    const targetNumeric = targetValue
      ? parseAccomplishmentNumber(targetValue)
      : null;
    const accomplishmentNumeric = accomplishmentValue
      ? parseAccomplishmentNumber(accomplishmentValue)
      : null;
    return [{
      id: String(year),
      label: String(year),
      targetDisplay: formatChartValue(targetValue, selected.source),
      targetNumeric,
      accomplishmentDisplay:
        formatChartValue(accomplishmentValue, selected.source),
      accomplishmentNumeric,
      status: getComparisonStatus(targetNumeric, accomplishmentNumeric),
      dataSource: selected.source,
      colorKey: `${indicatorId}:${year}:total`,
    }];
  });
}
