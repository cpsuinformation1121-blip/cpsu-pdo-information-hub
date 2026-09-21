import { ChevronDown, TableProperties } from "lucide-react";
import { formatPercentageValue } from "../accomplishments/chartData";

type ReportDataRow = "results" | "rawData";
type ReportValueGroup = "target" | "accomplishment";

type ReportDataTableEntry<Period extends string> = Record<
  ReportDataRow,
  Record<ReportValueGroup, Record<Period, string>>
>;

const rows = [
  { id: "results", label: "Percentage" },
  { id: "rawData", label: "Raw Data" },
] as const;

function displayValue(value: string | undefined, isPercentage: boolean) {
  const percentageValue = formatPercentageValue(value);
  if (isPercentage && percentageValue) return percentageValue;
  return value?.trim() || "—";
}

export function ReportIndicatorDataTable<Period extends string>({
  title,
  entry,
  periods,
}: {
  title: string;
  entry?: ReportDataTableEntry<Period>;
  periods: readonly { id: Period; label: string }[];
}) {
  const firstPeriodId = periods[0]?.id;

  return (
    <details className="group border-t border-border bg-surface">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-semibold text-primary outline-none hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2.5">
          <TableProperties className="size-4" aria-hidden="true" />
          View data table
        </span>
        <ChevronDown
          className="size-4 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="border-t border-border">
        <p className="px-4 pt-4 text-xs text-muted-foreground sm:px-5">
          Detailed values for {title}. Scroll sideways on smaller screens.
        </p>
        <div className="overflow-x-auto p-4 pt-3 sm:p-5 sm:pt-3">
          <table className="w-full min-w-[52rem] border-collapse text-sm">
            <thead>
              <tr className="border-y border-strong-border bg-surface-secondary">
                <th rowSpan={2} scope="col" className="px-3 py-3 text-left">
                  Data type
                </th>
                <th
                  colSpan={periods.length}
                  scope="colgroup"
                  className="border-l border-strong-border px-3 py-2 text-center"
                >
                  Target
                </th>
                <th
                  colSpan={periods.length}
                  scope="colgroup"
                  className="border-l-2 border-primary/30 bg-primary-soft px-3 py-2 text-center text-primary"
                >
                  Accomplishment
                </th>
              </tr>
              <tr className="border-b border-strong-border bg-surface-secondary text-xs uppercase tracking-[0.08em] text-muted-foreground">
                {(["target", "accomplishment"] as const).flatMap((group) =>
                  periods.map((period) => (
                    <th
                      key={`${group}-${period.id}`}
                      scope="col"
                      className={`${group === "accomplishment" && period.id === firstPeriodId ? "border-l-2 border-primary/30" : "border-l border-border"} ${period.id === "total" ? "font-bold text-foreground" : ""} px-3 py-2.5 text-center`}
                    >
                      {period.label}
                    </th>
                  )),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border last:border-b-0"
                >
                  <th
                    scope="row"
                    className="bg-surface-secondary px-3 py-3 text-left font-semibold"
                  >
                    {row.label}
                  </th>
                  {(["target", "accomplishment"] as const).flatMap((group) =>
                    periods.map((period) => (
                      <td
                        key={`${group}-${period.id}`}
                        className={`${group === "accomplishment" && period.id === firstPeriodId ? "border-l-2 border-primary/30" : "border-l border-border"} ${period.id === "total" ? "bg-primary-soft/50 font-semibold" : ""} px-3 py-3 text-center tabular-nums`}
                      >
                        {displayValue(
                          entry?.[row.id][group][period.id],
                          row.id === "results",
                        )}
                      </td>
                    )),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}
