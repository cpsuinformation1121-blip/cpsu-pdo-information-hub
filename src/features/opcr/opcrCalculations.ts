import {
  calculateReportPeriodTotal,
  isReportNumberInputValid,
} from "../reports/reportCalculations";

const halfYearFields = ["h1", "h2"] as const;

type HalfYearValues = Record<(typeof halfYearFields)[number], string>;

export function calculateHalfYearTotal(values: HalfYearValues) {
  return calculateReportPeriodTotal(values, halfYearFields);
}

export function isHalfYearInputValid(value: string) {
  return isReportNumberInputValid(value);
}
