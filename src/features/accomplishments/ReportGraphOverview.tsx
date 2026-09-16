import { RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { AppDialog } from "../../components/ui/AppDialog";
import type { AccomplishmentResourceData } from "../../contracts/accomplishmentResource";
import type {
  ReportAppearance,
  ReportLegendItem,
} from "../../contracts/reportAppearance";
import { AccomplishmentDataChart } from "./AccomplishmentChart";
import type { ComparisonDatum } from "./chartData";
import { isBaseLegendCategory } from "./reportAppearance";

type ChartType = AccomplishmentResourceData["chartType"];

export type ReportOverviewChart = {
  id: string;
  title: string;
  description: string;
  data: ComparisonDatum[];
};

export type ReportOverviewGroup = {
  id: string;
  title: string;
  charts: ReportOverviewChart[];
};

const colorInputClass =
  "h-9 w-12 shrink-0 cursor-pointer rounded border border-strong-border bg-surface p-0.5";

function CustomBarColorForm({
  initialColor,
  onSubmit,
}: {
  initialColor: string;
  onSubmit: (color: string, label: string) => void;
}) {
  const [color, setColor] = useState(initialColor);
  const [label, setLabel] = useState("");

  return (
    <form
      className="mt-3 flex flex-wrap items-end gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!label.trim()) return;
        onSubmit(color, label);
        setLabel("");
      }}
    >
      <label className="text-xs font-semibold">
        Custom color
        <input
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value.toLowerCase())}
          aria-label="Custom color"
          className={`${colorInputClass} mt-1 block`}
        />
      </label>
      <label className="text-xs font-semibold">
        New label
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          maxLength={40}
          placeholder="e.g. Exceeded"
          aria-label="Custom label"
          className="mt-1 block min-h-9 w-44 border border-strong-border px-2 text-sm font-normal"
        />
      </label>
      <button
        type="submit"
        disabled={label.trim().length === 0}
        className="min-h-9 cursor-pointer bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        Add label
      </button>
    </form>
  );
}

export function ReportGraphOverview({
  chartType,
  groups,
  legend,
  barColors,
  onLegendItemChange,
  onRemoveLegendItem,
  onBarColorChange,
  onCustomBarColor,
  restorableIndicators,
  onRestore,
}: {
  chartType: ChartType;
  groups: ReportOverviewGroup[];
  legend: ReportLegendItem[];
  barColors: Record<string, string>;
  onLegendItemChange: (
    id: string,
    patch: Partial<Pick<ReportLegendItem, "label" | "color">>,
  ) => void;
  onRemoveLegendItem: (id: string) => void;
  onBarColorChange: (colorKey: string, legendId: string | undefined) => void;
  onCustomBarColor: (colorKey: string, color: string, label: string) => void;
  restorableIndicators: Array<{ id: string; title: string }>;
  onRestore: (options: { legend: boolean; indicatorIds: string[] }) => void;
}) {
  const [selectedBar, setSelectedBar] = useState<
    { key: string; label: string; color: string } | undefined
  >();
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreLegend, setRestoreLegend] = useState(true);
  const [restoreIndicatorIds, setRestoreIndicatorIds] = useState<string[]>([]);
  const appearance: ReportAppearance = { legend, barColors };

  function openRestore() {
    setRestoreLegend(true);
    setRestoreIndicatorIds(
      restorableIndicators.map((indicator) => indicator.id),
    );
    setRestoreOpen(true);
  }

  return (
    <section
      aria-labelledby="graph-overview-title"
      className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_10px_28px_rgba(20,83,45,0.05)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-strong-border bg-primary-soft px-5 py-4">
        <div className="min-w-0">
          <h2 id="graph-overview-title" className="text-lg font-semibold">
            Graph overview
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit the legend labels and colors, then select any bar or point to
            change only that bar's color — or give a custom color its own new
            legend label.
          </p>
        </div>
        <button
          type="button"
          onClick={openRestore}
          className="inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-2 border border-strong-border bg-surface px-4 text-sm font-semibold text-primary hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Restore to default
        </button>
      </div>

      <div className="border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold">Legend</h3>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {legend.map((item) => (
            <li key={item.id} className="flex items-center gap-2">
              <input
                type="color"
                value={item.color}
                onChange={(event) =>
                  onLegendItemChange(item.id, {
                    color: event.target.value.toLowerCase(),
                  })
                }
                aria-label={`${item.label} legend color`}
                className={colorInputClass}
              />
              <input
                value={item.label}
                maxLength={40}
                onChange={(event) =>
                  onLegendItemChange(item.id, {
                    label: event.target.value,
                  })
                }
                aria-label={`${item.label} legend label`}
                className="min-h-9 w-full min-w-0 border border-strong-border px-2 text-sm"
              />
              {isBaseLegendCategory(item.id) ? null : (
                <button
                  type="button"
                  onClick={() => onRemoveLegendItem(item.id)}
                  aria-label={`Remove ${item.label} label`}
                  title="Remove label"
                  className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded border border-strong-border text-muted-foreground hover:border-danger hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {selectedBar ? (
        <div
          role="group"
          aria-label="Selected bar color"
          className="fixed bottom-4 left-1/2 z-40 w-[min(48rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-border bg-surface p-4 shadow-[0_18px_50px_rgba(20,83,45,0.24)] sm:p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold">
              Color for {selectedBar.label}
            </p>
            <button
              type="button"
              onClick={() => setSelectedBar(undefined)}
              className="min-h-9 cursor-pointer border border-strong-border bg-surface px-4 text-xs font-semibold hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Done
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {legend.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onBarColorChange(selectedBar.key, item.id)}
                title={item.label}
                className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded border border-strong-border bg-surface px-3 text-xs font-semibold hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span
                  className="size-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onBarColorChange(selectedBar.key, undefined)}
              className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded border border-strong-border bg-surface px-3 text-xs font-semibold text-muted-foreground hover:border-danger hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Reset
            </button>
          </div>
          <CustomBarColorForm
            key={selectedBar.key}
            initialColor={selectedBar.color}
            onSubmit={(color, label) =>
              onCustomBarColor(selectedBar.key, color, label)
            }
          />
        </div>
      ) : null}

      <div className="space-y-8 p-5">
        {groups.map((group) => {
          const singleChart = group.charts.length === 1;
          const showHeading =
            !singleChart || group.title !== group.charts[0].title;

          return (
            <section key={group.id} aria-label={group.title}>
              {showHeading ? (
                <h3 className="mb-3 text-sm font-semibold text-primary">
                  {group.title}
                </h3>
              ) : null}
              <div
                className={`grid gap-4 ${singleChart ? "" : "lg:grid-cols-2"}`}
              >
                {group.charts.map((chart) => (
                  <AccomplishmentDataChart
                    key={chart.id}
                    type={chartType}
                    title={chart.title}
                    description={chart.description}
                    data={chart.data}
                    appearance={appearance}
                    selectedBarKey={selectedBar?.key}
                    onSelectBar={(key, label, color) =>
                      setSelectedBar((previous) =>
                        previous?.key === key
                          ? undefined
                          : { key, label, color },
                      )
                    }
                  />
                ))}
              </div>
            </section>
          );
        })}
        {groups.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Add indicators and values to preview graphs.
          </p>
        ) : null}
      </div>

      {restoreOpen ? (
        <AppDialog
          title="Restore to default"
          description="Choose what to reset to its original state. This cannot be undone."
          onClose={() => setRestoreOpen(false)}
        >
          <div className="p-5 sm:p-6">
            <label className="flex items-center gap-3 text-sm font-semibold">
              <input
                type="checkbox"
                checked={restoreLegend}
                onChange={(event) => setRestoreLegend(event.target.checked)}
                className="size-4 cursor-pointer"
              />
              Legend labels and colors
            </label>

            <fieldset className="mt-5">
              <legend className="text-sm font-semibold">
                Bar colors by indicator
              </legend>
              {restorableIndicators.length > 0 ? (
                <div className="mt-2 max-h-56 space-y-2 overflow-y-auto pr-1">
                  {restorableIndicators.map((indicator) => (
                    <label
                      key={indicator.id}
                      className="flex items-center gap-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={restoreIndicatorIds.includes(indicator.id)}
                        onChange={(event) =>
                          setRestoreIndicatorIds((ids) =>
                            event.target.checked
                              ? [...ids, indicator.id]
                              : ids.filter((id) => id !== indicator.id),
                          )
                        }
                        className="size-4 cursor-pointer"
                      />
                      {indicator.title}
                    </label>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  No indicator has a custom bar color.
                </p>
              )}
            </fieldset>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRestoreOpen(false)}
                className="min-h-11 cursor-pointer border border-strong-border px-5 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!restoreLegend && restoreIndicatorIds.length === 0}
                onClick={() => {
                  onRestore({
                    legend: restoreLegend,
                    indicatorIds: restoreIndicatorIds,
                  });
                  setRestoreOpen(false);
                }}
                className="min-h-11 cursor-pointer bg-primary px-5 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                Restore
              </button>
            </div>
          </div>
        </AppDialog>
      ) : null}
    </section>
  );
}
