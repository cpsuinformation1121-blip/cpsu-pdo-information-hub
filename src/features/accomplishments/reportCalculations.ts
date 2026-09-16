const quarterFields = ["q1", "q2", "q3", "q4"] as const;

type QuarterlyValues = Record<(typeof quarterFields)[number], string>;

const firstReportYear = 2021;
const plannedReportEndYear = 2030;

export function getAccomplishmentReportYears(currentYear: number) {
  const lastYear = Math.max(currentYear, plannedReportEndYear);

  return Array.from(
    { length: lastYear - firstReportYear + 1 },
    (_, index) => lastYear - index,
  );
}

export function calculatePeriodTotal(values: QuarterlyValues) {
  let hasValue = false;
  let total = 0;

  for (const field of quarterFields) {
    const value = values[field].replace(/[% ,]/g, "").trim();
    if (!value) continue;

    const number = Number(value);
    if (!Number.isFinite(number)) return "";

    hasValue = true;
    total += number;
  }

  return hasValue ? String(Number(total.toFixed(10))) : "";
}

export function isQuarterInputValid(value: string) {
  const normalizedValue = value.replace(/[% ,]/g, "").trim();

  return /^\d*(?:\.\d{0,2})?$/u.test(normalizedValue);
}
