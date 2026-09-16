const halfYearFields = ["h1", "h2"] as const;

type HalfYearValues = Record<(typeof halfYearFields)[number], string>;

export function calculateHalfYearTotal(values: HalfYearValues) {
  let hasValue = false;
  let total = 0;

  for (const field of halfYearFields) {
    const value = values[field].replace(/[% ,]/g, "").trim();
    if (!value) continue;

    const number = Number(value);
    if (!Number.isFinite(number)) return "";

    hasValue = true;
    total += number;
  }

  return hasValue ? String(Number(total.toFixed(10))) : "";
}

export function isHalfYearInputValid(value: string) {
  const normalizedValue = value.replace(/[% ,]/g, "").trim();
  return /^\d*(?:\.\d{0,2})?$/u.test(normalizedValue);
}
