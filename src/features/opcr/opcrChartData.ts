import {
  createAnnualIndicatorChartData,
  createAnnualIndicatorSeriesChartData,
  createComparisonChartData,
  type ChartDataSource,
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
  rawData: {
    target: OpcrPeriodValues;
    accomplishment: OpcrPeriodValues;
  };
};

const periodLabels = {
  h1: "H1",
  h2: "H2",
  total: "Annual",
} as const;

export function createOpcrComparisonChartData(
  target: OpcrPeriodValues | undefined,
  accomplishment: OpcrPeriodValues | undefined,
  selectedPeriods: ReadonlyArray<keyof OpcrPeriodValues> = [
    "h1",
    "h2",
    "total",
  ],
  colorKeyPrefix?: string,
  dataSource: ChartDataSource = "percentage",
): ComparisonDatum[] {
  return createComparisonChartData(
    target,
    accomplishment,
    selectedPeriods.map((id) => ({ id, label: periodLabels[id] })),
    colorKeyPrefix,
    dataSource,
  );
}

export function createOpcrAnnualIndicatorChartData(
  indicators: Array<{ id: string; title: string }>,
  entries: Record<string, OpcrEntry>,
) {
  return createAnnualIndicatorChartData(indicators, entries);
}

export function createOpcrAnnualIndicatorSeriesChartData(
  indicatorId: string,
  yearData: Array<{ year: number; entries: Record<string, OpcrEntry> }>,
) {
  return createAnnualIndicatorSeriesChartData(indicatorId, yearData);
}
