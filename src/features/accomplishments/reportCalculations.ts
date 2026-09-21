import {
  calculateReportPeriodTotal,
  getReportYears,
  isReportNumberInputValid,
} from "../reports/reportCalculations";

const quarterFields = ["q1", "q2", "q3", "q4"] as const;

type QuarterlyValues = Record<(typeof quarterFields)[number], string>;

export function getAccomplishmentReportYears(currentYear: number) {
  return getReportYears(currentYear);
}

export function calculatePeriodTotal(values: QuarterlyValues) {
  return calculateReportPeriodTotal(values, quarterFields);
}

export function isQuarterInputValid(value: string) {
  return isReportNumberInputValid(value);
}
