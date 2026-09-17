import { useQueries } from "@tanstack/react-query";
import { ChevronDown, TableProperties } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { AccomplishmentResourceData } from "../contracts/accomplishmentResource";
import {
  AccomplishmentComparisonChart,
  AccomplishmentIndicatorSeriesChart,
  ChartColorLegend,
} from "../features/accomplishments/AccomplishmentChart";
import {
  annualComparisonFields,
  createAnnualIndicatorChartData,
  createAnnualIndicatorSeriesChartData,
  formatPercentageValue,
  quarterlyComparisonFields,
  selectPreferredChartData,
} from "../features/accomplishments/chartData";
import type { ReportAppearance } from "../features/accomplishments/reportAppearance";
import { getAccomplishmentReportYears } from "../features/accomplishments/reportCalculations";
import { getPublicAccomplishmentResource } from "../services/accomplishmentResource";

const rows = [
  { id: "results", label: "Percentage" },
  { id: "rawData", label: "Raw Data" },
] as const;

type IndicatorEntry =
  AccomplishmentResourceData["entries"][string][string];

const periods = [
  { id: "q1", label: "Q1" },
  { id: "q2", label: "Q2" },
  { id: "q3", label: "Q3" },
  { id: "q4", label: "Q4" },
  { id: "total", label: "Total" },
] as const;

function displayValue(value: string | undefined, isPercentage: boolean) {
  const percentageValue = formatPercentageValue(value);
  if (isPercentage && percentageValue) return percentageValue;
  return value?.trim() || "—";
}

function IndicatorDataTable({
  title,
  entry,
}: {
  title: string;
  entry?: IndicatorEntry;
}) {
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
                <th colSpan={5} scope="colgroup" className="border-l border-strong-border px-3 py-2 text-center">
                  Target
                </th>
                <th colSpan={5} scope="colgroup" className="border-l-2 border-primary/30 bg-primary-soft px-3 py-2 text-center text-primary">
                  Accomplishment
                </th>
              </tr>
              <tr className="border-b border-strong-border bg-surface-secondary text-xs uppercase tracking-[0.08em] text-muted-foreground">
                {["target", "accomplishment"].flatMap((group) =>
                  periods.map((period) => (
                    <th
                      key={`${group}-${period.id}`}
                      scope="col"
                      className={`${group === "accomplishment" && period.id === "q1" ? "border-l-2 border-primary/30" : "border-l border-border"} ${period.id === "total" ? "font-bold text-foreground" : ""} px-3 py-2.5 text-center`}
                    >
                      {period.label}
                    </th>
                  )),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-b-0">
                  <th scope="row" className="bg-surface-secondary px-3 py-3 text-left font-semibold">
                    {row.label}
                  </th>
                  {["target", "accomplishment"].flatMap((group) =>
                    periods.map((period) => (
                      <td
                        key={`${group}-${period.id}`}
                        className={`${group === "accomplishment" && period.id === "q1" ? "border-l-2 border-primary/30" : "border-l border-border"} ${period.id === "total" ? "bg-primary-soft/50 font-semibold" : ""} px-3 py-3 text-center tabular-nums`}
                      >
                        {displayValue(
                          entry?.[row.id][
                            group as "target" | "accomplishment"
                          ][period.id],
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

function IndicatorResults({
  title,
  entry,
  chartType,
  appearance,
}: {
  title: string;
  entry?: IndicatorEntry;
  chartType: AccomplishmentResourceData["chartType"];
  appearance?: ReportAppearance;
}) {
  const annual = selectPreferredChartData(entry, ["total"]);
  const quarterly = selectPreferredChartData(entry, [
    "q1",
    "q2",
    "q3",
    "q4",
  ]);

  return (
    <article className="border-t border-border first:border-t-0">
      <div className="px-4 py-4 sm:px-5">
        <h4 className="text-sm font-semibold sm:text-base">{title}</h4>
        <div className="mt-3">
          <ChartColorLegend compact legend={appearance?.legend} />
        </div>
      </div>

      <div className={`grid gap-4 border-t border-border bg-surface-secondary/45 p-4 sm:p-5 ${annual && quarterly ? "lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,2.2fr)]" : ""}`}>
        {annual ? <AccomplishmentComparisonChart
          type={chartType}
          title="Annual total"
          description="Cumulative target and accomplishment."
          target={annual.row.target}
          accomplishment={annual.row.accomplishment}
          fields={annualComparisonFields}
          dataSource={annual.source}
          appearance={appearance}
        /> : null}
        {quarterly ? <AccomplishmentComparisonChart
          type={chartType}
          title="Quarterly performance"
          description="Target compared with accomplishment for each quarter."
          target={quarterly.row.target}
          accomplishment={quarterly.row.accomplishment}
          fields={quarterlyComparisonFields}
          dataSource={quarterly.source}
          appearance={appearance}
        /> : null}
      </div>

      <IndicatorDataTable title={title} entry={entry} />
    </article>
  );
}

export function AccomplishmentsPage() {
  const currentYear = new Date().getFullYear();
  const years = getAccomplishmentReportYears(currentYear);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedIndicatorId, setSelectedIndicatorId] = useState("");
  const resourceQueries = useQueries({
    queries: years.map((year) => ({
      queryKey: ["public-accomplishment-resource", year],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        getPublicAccomplishmentResource(year, signal),
      staleTime: 0,
      refetchOnMount: "always" as const,
      refetchOnWindowFocus: true,
    })),
  });
  const selectedQuery = resourceQueries[years.indexOf(selectedYear)];
  const data = selectedQuery?.data;
  const entries = data?.entries[String(selectedYear)] ?? {};
  const sections =
    data?.nodes.filter((node) => node.type === "section") ?? [];
  const groupsFor = (sectionId: string) =>
    data?.nodes.filter(
      (node) => node.type === "group" && node.parentId === sectionId,
    ) ?? [];
  const indicatorsFor = (groupId: string) =>
    data?.nodes.filter(
      (node) => node.type === "indicator" && node.parentId === groupId,
    ) ?? [];
  const indicators =
    data?.nodes.filter((node) => node.type === "indicator") ?? [];
  const indicatorCount = indicators.length;
  const activeIndicatorId = indicators.some(
    (indicator) => indicator.id === selectedIndicatorId,
  )
    ? selectedIndicatorId
    : (indicators[0]?.id ?? "");
  const activeIndicator = indicators.find(
    (indicator) => indicator.id === activeIndicatorId,
  );
  const annualIndicatorData = createAnnualIndicatorSeriesChartData(
    activeIndicatorId,
    years.map((year, index) => ({
      year,
      entries:
        resourceQueries[index]?.data?.entries[String(year)] ?? {},
    })),
  );
  const annualOverviewData = createAnnualIndicatorChartData(indicators, entries);

  return (
    <section aria-labelledby="accomplishments-title">
      <div className="border-b border-border bg-surface-secondary/45">
        <div className="mx-auto max-w-content px-5 py-8 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
          <nav
            aria-label="Breadcrumb"
            className="text-sm text-muted-foreground"
          >
            <Link className="hover:text-primary hover:underline" to="/">
              Home
            </Link>
            <span className="mx-2" aria-hidden="true">
              /
            </span>
            <span aria-current="page">Accomplishment Report</span>
          </nav>

          <div className="mt-6 grid gap-6 sm:grid-cols-3 sm:items-end lg:grid-cols-4">
            <div className="max-w-3xl border-l-2 border-primary pl-4 sm:col-span-2 sm:pl-5 lg:col-span-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Our performance
              </p>
              <h1
                id="accomplishments-title"
                className="mt-2 font-serif text-3xl tracking-tight sm:text-[2.5rem]"
              >
                Accomplishment Report
              </h1>
              <p className="mt-3 text-base leading-7 text-muted-foreground">
                View annual targets and quarterly results.
              </p>
            </div>

            <label className="w-full">
              <span className="block text-sm font-semibold">Year</span>
              <select
                value={selectedYear}
                onChange={(event) =>
                  setSelectedYear(Number(event.target.value))
                }
                className="mt-2 min-h-12 w-full cursor-pointer border border-strong-border bg-surface px-4"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-content px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        {selectedQuery?.isPending ? (
          <div
            className="rounded-2xl border border-border bg-surface px-5 py-10 text-center text-sm text-muted-foreground"
            role="status"
          >
            Loading accomplishments...
          </div>
        ) : null}

        {selectedQuery?.isError ? (
          <div
            className="rounded-2xl border border-danger/25 bg-danger-soft px-5 py-8 text-center"
            role="alert"
          >
            <p className="text-sm text-danger">
              {selectedQuery.error instanceof Error
                ? selectedQuery.error.message
                : "The accomplishment data could not be loaded."}
            </p>
            <button
              type="button"
              onClick={() => void selectedQuery.refetch()}
              className="mt-4 min-h-11 cursor-pointer border border-danger px-5 text-sm font-semibold text-danger hover:bg-surface"
            >
              Try again
            </button>
          </div>
        ) : null}

        {data && indicatorCount === 0 ? (
          <div className="rounded-2xl border border-border bg-surface px-5 py-10 text-center">
            <h2 className="font-semibold">No accomplishments available</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              No performance areas are available for {selectedYear}.
            </p>
          </div>
        ) : null}

        {data && indicatorCount > 0 ? (
          <div className="space-y-6">
            {annualIndicatorData.length > 0 ? (
              <section
                aria-labelledby="annual-physical-performance-title"
                className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_10px_28px_rgba(20,83,45,0.05)]"
              >
                <div className="border-b border-strong-border bg-primary-soft px-4 py-5 text-center sm:px-5">
                  <h2
                    id="annual-physical-performance-title"
                    className="text-lg font-semibold text-foreground"
                  >
                    Annual Physical Performance Accomplishment
                  </h2>
                  <div className="mt-3 flex justify-center">
                    <ChartColorLegend compact legend={data.appearance?.legend} />
                  </div>
                </div>
                <div className="bg-surface-secondary/45 p-4 sm:p-5">
                  <AccomplishmentIndicatorSeriesChart
                    type={data.chartType}
                    title="Annual performance by indicator"
                    description="Annual target and accomplishment totals for the selected report year."
                    data={annualOverviewData}
                    hideCaption
                    preserveCategoryWidth
                    appearance={data.appearance}
                  />
                </div>
                <details className="group border-t border-border bg-surface">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-semibold text-primary outline-none hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:px-5 [&::-webkit-details-marker]:hidden">
                    <span>View annual data by indicator</span>
                    <ChevronDown
                      className="size-4 transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <div className="border-t border-border bg-surface-secondary/45 p-4 sm:p-5">
                    <label className="mx-auto block max-w-sm">
                      <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        Indicator
                      </span>
                      <select
                        aria-label="Annual indicator"
                        value={activeIndicatorId}
                        onChange={(event) =>
                          setSelectedIndicatorId(event.target.value)
                        }
                        className="mt-1 min-h-11 w-full cursor-pointer border border-strong-border bg-surface px-3 text-sm font-medium"
                      >
                        {indicators.map((indicator) => (
                          <option key={indicator.id} value={indicator.id}>
                            {indicator.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="mt-4">
                      <AccomplishmentIndicatorSeriesChart
                        type={data.chartType}
                        title={`${activeIndicator?.title ?? "Indicator"} annual performance by year`}
                        description="Annual target and accomplishment totals by report year."
                        data={annualIndicatorData}
                        hideCaption
                        preserveCategoryWidth
                        appearance={data.appearance}
                      />
                    </div>
                  </div>
                </details>
              </section>
            ) : null}

            {sections.map((section) => (
              <section
                key={section.id}
                aria-labelledby={`section-${section.id}`}
                className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_10px_28px_rgba(20,83,45,0.05)]"
              >
                <div className="border-b border-strong-border bg-primary-soft px-4 py-4 sm:px-5">
                  <h2
                    id={`section-${section.id}`}
                    className="text-lg font-semibold"
                  >
                    {section.title}
                  </h2>
                </div>

                {groupsFor(section.id).map((group) => (
                  <section
                    key={group.id}
                    aria-labelledby={`group-${group.id}`}
                    className="border-b border-strong-border last:border-b-0"
                  >
                    <h3
                      id={`group-${group.id}`}
                      className="border-b border-border px-4 py-4 text-base font-semibold text-primary sm:px-5"
                    >
                      {group.title}
                    </h3>
                    {indicatorsFor(group.id).map((indicator) => (
                      <IndicatorResults
                        key={indicator.id}
                        title={indicator.title}
                        entry={entries[indicator.id]}
                        chartType={data.chartType}
                        appearance={data.appearance}
                      />
                    ))}
                  </section>
                ))}
              </section>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
