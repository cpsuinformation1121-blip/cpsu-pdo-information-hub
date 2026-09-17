export const quarterlyComparisonFields = [
  { id: "q1", label: "Q1" },
  { id: "q2", label: "Q2" },
  { id: "q3", label: "Q3" },
  { id: "q4", label: "Q4" },
] as const;

export const annualComparisonFields = [
  { id: "total", label: "Annual" },
] as const;

export type ComparisonField = "q1" | "q2" | "q3" | "q4" | "total";
export type ComparisonValues = Record<ComparisonField, string>;
export type ComparisonStatus = "met" | "below" | "unavailable";
export type ChartDataSource = "percentage" | "rawData";

type ChartDataRow<TValues> = {
  target: TValues;
  accomplishment: TValues;
};

type ChartEntry<TValues> = {
  results?: ChartDataRow<TValues>;
  rawData?: ChartDataRow<TValues>;
};

export type SelectedChartData<TValues> = {
  source: ChartDataSource;
  row: ChartDataRow<TValues>;
};

export type ComparisonDatum = {
  id: string;
  label: string;
  targetDisplay: string;
  targetNumeric: number | null;
  accomplishmentDisplay: string;
  accomplishmentNumeric: number | null;
  status: ComparisonStatus;
  dataSource: ChartDataSource;
  colorKey?: string;
};

type AnnualPerformanceEntry = {
  results: ChartDataRow<ComparisonValues>;
  rawData?: ChartDataRow<ComparisonValues>;
};

type AnnualPerformanceIndicator = {
  id: string;
  title: string;
};

export type AnnualIndicatorYearData = {
  year: number;
  entries: Record<string, AnnualPerformanceEntry>;
};

function hasValues<TValues>(
  row: ChartDataRow<TValues> | undefined,
  fields: readonly string[],
) {
  const target = row?.target as Record<string, string> | undefined;
  const accomplishment = row?.accomplishment as
    | Record<string, string>
    | undefined;
  return Boolean(
    row &&
      fields.some(
        (field) =>
          target?.[field]?.trim() || accomplishment?.[field]?.trim(),
      ),
  );
}

export function selectPreferredChartData<TValues>(
  entry: ChartEntry<TValues> | undefined,
  fields: readonly string[],
): SelectedChartData<TValues> | undefined {
  const results = entry?.results;
  if (hasValues(results, fields)) {
    return { source: "percentage", row: results! };
  }
  const rawData = entry?.rawData;
  if (hasValues(rawData, fields)) {
    return { source: "rawData", row: rawData! };
  }
  return undefined;
}

export function chartDataSourceLabel(data: readonly ComparisonDatum[]) {
  const sources = new Set(data.map((item) => item.dataSource));
  if (sources.size === 0) return "No data";
  if (sources.size > 1) return "Percentage + Raw Data";
  return sources.has("rawData") ? "Raw Data" : "Percentage";
}

export function parseAccomplishmentNumber(value: string) {
  const numericTokens = value.match(
    /[+-]?(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?|\.\d+)/gu,
  );
  if (numericTokens?.length !== 1) return null;

  const number = Number(numericTokens[0].replaceAll(",", ""));
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function formatPercentageValue(value: string | undefined) {
  const normalized = value?.trim() ?? "";
  if (!normalized || normalized.endsWith("%")) return normalized;
  return `${normalized}%`;
}

function formatChartValue(value: string, source: ChartDataSource) {
  if (!value) return "Not reported";
  return source === "percentage" ? formatPercentageValue(value) : value;
}

export function createAnnualIndicatorChartData(
  indicators: AnnualPerformanceIndicator[],
  entries: Record<string, AnnualPerformanceEntry>,
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

    return [
      {
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
      },
    ];
  });
}

export function createAnnualIndicatorSeriesChartData(
  indicatorId: string,
  yearData: AnnualIndicatorYearData[],
): ComparisonDatum[] {
  const orderedYearData = [...yearData].sort((a, b) => a.year - b.year);
  return orderedYearData.flatMap(({ year, entries }) => {
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

export function getComparisonStatus(
  target: number | null,
  accomplishment: number | null,
): ComparisonStatus {
  if (target === null || accomplishment === null) return "unavailable";
  return accomplishment >= target ? "met" : "below";
}

export function createComparisonChartData(
  target: ComparisonValues | undefined,
  accomplishment: ComparisonValues | undefined,
  fields: ReadonlyArray<{ id: ComparisonField; label: string }>,
  colorKeyPrefix?: string,
  dataSource: ChartDataSource = "percentage",
): ComparisonDatum[] {
  return fields.map((field) => {
    const targetValue = target?.[field.id]?.trim() ?? "";
    const accomplishmentValue = accomplishment?.[field.id]?.trim() ?? "";
    const targetNumeric = targetValue
      ? parseAccomplishmentNumber(targetValue)
      : null;
    const accomplishmentNumeric = accomplishmentValue
      ? parseAccomplishmentNumber(accomplishmentValue)
      : null;

    return {
      ...field,
      targetDisplay: formatChartValue(targetValue, dataSource),
      targetNumeric,
      accomplishmentDisplay:
        formatChartValue(accomplishmentValue, dataSource),
      accomplishmentNumeric,
      status: getComparisonStatus(targetNumeric, accomplishmentNumeric),
      dataSource,
      colorKey: colorKeyPrefix ? `${colorKeyPrefix}:${field.id}` : undefined,
    };
  });
}

export function getComparisonScaleMax(data: ComparisonDatum[]) {
  let maximum = 0;

  for (const item of data) {
    if (item.targetNumeric !== null && item.targetNumeric > maximum)
      maximum = item.targetNumeric;
    if (
      item.accomplishmentNumeric !== null &&
      item.accomplishmentNumeric > maximum
    )
      maximum = item.accomplishmentNumeric;
  }

  return maximum || 1;
}
