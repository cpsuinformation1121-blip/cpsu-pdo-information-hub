import {
  formatPercentageValue,
  getComparisonStatus,
  parseAccomplishmentNumber,
  type ComparisonDatum,
} from "../accomplishments/chartData";

export type OpcrPeriodValues = {
  h1: string;
  h2: string;
  total: string;
};

type OpcrEntry = {
  results: {
    target: OpcrPeriodValues;
    accomplishment: OpcrPeriodValues;
  };
};

export function createOpcrComparisonChartData(
  target: OpcrPeriodValues | undefined,
  accomplishment: OpcrPeriodValues | undefined,
  selectedPeriods: ReadonlyArray<"h1" | "h2" | "total"> = ["h1", "h2", "total"],
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
      targetDisplay: formatPercentageValue(targetValue) || "Not reported",
      targetNumeric,
      accomplishmentDisplay:
        formatPercentageValue(accomplishmentValue) || "Not reported",
      accomplishmentNumeric,
      status: getComparisonStatus(targetNumeric, accomplishmentNumeric),
    };
  });
}

export function createOpcrAnnualIndicatorChartData(
  indicators: Array<{ id: string; title: string }>,
  entries: Record<string, OpcrEntry>,
): ComparisonDatum[] {
  return indicators.flatMap((indicator) => {
    const targetValue = entries[indicator.id]?.results.target.total.trim() ?? "";
    const accomplishmentValue =
      entries[indicator.id]?.results.accomplishment.total.trim() ?? "";
    if (!targetValue && !accomplishmentValue) return [];
    const targetNumeric = targetValue
      ? parseAccomplishmentNumber(targetValue)
      : null;
    const accomplishmentNumeric = accomplishmentValue
      ? parseAccomplishmentNumber(accomplishmentValue)
      : null;
    return [{
      id: indicator.id,
      label: indicator.title,
      targetDisplay: formatPercentageValue(targetValue) || "Not reported",
      targetNumeric,
      accomplishmentDisplay:
        formatPercentageValue(accomplishmentValue) || "Not reported",
      accomplishmentNumeric,
      status: getComparisonStatus(targetNumeric, accomplishmentNumeric),
    }];
  });
}

export function createOpcrAnnualIndicatorSeriesChartData(
  indicatorId: string,
  yearData: Array<{ year: number; entries: Record<string, OpcrEntry> }>,
): ComparisonDatum[] {
  return yearData.map(({ year, entries }) => {
    const targetValue = entries[indicatorId]?.results.target.total.trim() ?? "";
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
