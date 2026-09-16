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

export type ComparisonDatum = {
  id: string;
  label: string;
  targetDisplay: string;
  targetNumeric: number | null;
  accomplishmentDisplay: string;
  accomplishmentNumeric: number | null;
  status: ComparisonStatus;
};

type AnnualPerformanceEntry = {
  results: {
    target: ComparisonValues;
    accomplishment: ComparisonValues;
  };
};

type AnnualPerformanceIndicator = {
  id: string;
  title: string;
};

export type AnnualIndicatorYearData = {
  year: number;
  entries: Record<string, AnnualPerformanceEntry>;
};

export function parseAccomplishmentNumber(value: string) {
  const normalized = value
    .trim()
    .replaceAll(",", "")
    .replace(/%$/u, "")
    .trim();

  if (!/^(?:\d+\.?\d*|\.\d+)$/u.test(normalized)) return null;

  const number = Number(normalized);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function formatPercentageValue(value: string | undefined) {
  const normalized = value?.trim() ?? "";
  if (!normalized || normalized.endsWith("%")) return normalized;
  return `${normalized}%`;
}

export function createAnnualIndicatorChartData(
  indicators: AnnualPerformanceIndicator[],
  entries: Record<string, AnnualPerformanceEntry>,
): ComparisonDatum[] {
  return indicators.flatMap((indicator) => {
    const targetValue =
      entries[indicator.id]?.results.target.total.trim() ?? "";
    const accomplishmentValue =
      entries[indicator.id]?.results.accomplishment.total.trim() ?? "";

    if (!targetValue && !accomplishmentValue) return [];

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
        targetDisplay: formatPercentageValue(targetValue) || "Not reported",
        targetNumeric,
        accomplishmentDisplay:
          formatPercentageValue(accomplishmentValue) || "Not reported",
        accomplishmentNumeric,
        status: getComparisonStatus(targetNumeric, accomplishmentNumeric),
      },
    ];
  });
}

export function createAnnualIndicatorSeriesChartData(
  indicatorId: string,
  yearData: AnnualIndicatorYearData[],
): ComparisonDatum[] {
  return yearData.map(({ year, entries }) => {
    const targetValue =
      entries[indicatorId]?.results.target.total.trim() ?? "";
    const accomplishmentValue =
      entries[indicatorId]?.results.accomplishment.total.trim() ?? "";
    const targetNumeric = targetValue
      ? parseAccomplishmentNumber(targetValue)
      : null;
    const accomplishmentNumeric = accomplishmentValue
      ? parseAccomplishmentNumber(accomplishmentValue)
      : null;

    return {
      id: String(year),
      label: String(year),
      targetDisplay: formatPercentageValue(targetValue) || "Not reported",
      targetNumeric,
      accomplishmentDisplay:
        formatPercentageValue(accomplishmentValue) || "Not reported",
      accomplishmentNumeric,
      status: getComparisonStatus(targetNumeric, accomplishmentNumeric),
    };
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
      targetDisplay: formatPercentageValue(targetValue) || "Not reported",
      targetNumeric,
      accomplishmentDisplay:
        formatPercentageValue(accomplishmentValue) || "Not reported",
      accomplishmentNumeric,
      status: getComparisonStatus(targetNumeric, accomplishmentNumeric),
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
