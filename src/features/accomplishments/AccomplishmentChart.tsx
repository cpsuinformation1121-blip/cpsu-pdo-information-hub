import type { CSSProperties, KeyboardEvent } from "react";
import type { AccomplishmentResourceData } from "../../contracts/accomplishmentResource";
import {
  chartDataSourceLabel,
  createComparisonChartData,
  getComparisonScaleMax,
  type ChartDataSource,
  type ComparisonDatum,
  type ComparisonField,
  type ComparisonValues,
} from "./chartData";
import {
  reportBarColorKey,
  resolveBarColor,
  resolveReportLegend,
  type ReportAppearance,
  type ReportLegendItem,
} from "./reportAppearance";

type ChartType = AccomplishmentResourceData["chartType"];
type SeriesId = "target" | "accomplishment";

export type ChartInteraction = {
  appearance?: ReportAppearance;
  onSelectBar?: (colorKey: string, label: string, color: string) => void;
  selectedBarKey?: string;
};

function chartValueLabel(display: string, numeric: number | null) {
  return numeric === null ? "—" : display;
}

function chartDescription(title: string, data: ComparisonDatum[]) {
  return `${title} (${chartDataSourceLabel(data)}): ${data
    .map(
      (item) =>
        `${item.label}, target ${item.targetDisplay}, accomplishment ${item.accomplishmentDisplay}`,
    )
    .join("; ")}`;
}

function ChartSourceBadge({ data }: { data: ComparisonDatum[] }) {
  return (
    <span className="inline-flex shrink-0 rounded-full bg-primary-soft px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-primary">
      Showing: {chartDataSourceLabel(data)}
    </span>
  );
}

export function ChartColorLegend({
  compact = false,
  legend,
}: {
  compact?: boolean;
  legend?: readonly ReportLegendItem[];
}) {
  const items = resolveReportLegend(legend);

  return (
    <div
      aria-label="Chart color guide"
      className={`flex flex-wrap items-center ${compact ? "gap-x-4 gap-y-2" : "gap-x-5 gap-y-2"} text-xs text-muted-foreground`}
    >
      {items.map((item) => (
        <span key={item.id} className="inline-flex items-center gap-2">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function SeriesBar({
  datum,
  series,
  seriesLabel,
  appearance,
  onSelectBar,
  selectedBarKey,
  className,
  style,
}: {
  datum: ComparisonDatum;
  series: SeriesId;
  seriesLabel: string;
  className: string;
  style: CSSProperties;
} & ChartInteraction) {
  const color = resolveBarColor(appearance, datum, series);
  const colorKey = reportBarColorKey(datum.colorKey, series);
  const label = `${datum.label} ${seriesLabel}`;
  const selected = Boolean(colorKey && colorKey === selectedBarKey);
  const barStyle = { ...style, backgroundColor: color, borderRadius: 0 };
  const barClass = `${className}${selected ? " ring-2 ring-foreground" : ""}`;

  if (!onSelectBar || !colorKey) {
    return <span className={barClass} style={barStyle} aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      onClick={() => onSelectBar(colorKey, label, color)}
      aria-pressed={selected}
      aria-label={`Change color for ${label}`}
      title={`Change color for ${label}`}
      className={`${barClass} cursor-pointer appearance-none border-0 p-0`}
      style={barStyle}
    />
  );
}

function pointInteraction(
  datum: ComparisonDatum,
  series: SeriesId,
  seriesLabel: string,
  color: string,
  onSelectBar?: (colorKey: string, label: string, color: string) => void,
) {
  const colorKey = reportBarColorKey(datum.colorKey, series);
  if (!onSelectBar || !colorKey) return {};
  const label = `${datum.label} ${seriesLabel}`;
  const select = () => onSelectBar(colorKey, label, color);
  return {
    role: "button" as const,
    tabIndex: 0,
    "aria-label": `Change color for ${label}`,
    onClick: select,
    onKeyDown: (event: KeyboardEvent<SVGCircleElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        select();
      }
    },
    className: "cursor-pointer",
  };
}

function BarChart({
  title,
  data,
  appearance,
  onSelectBar,
  selectedBarKey,
}: { title: string; data: ComparisonDatum[] } & ChartInteraction) {
  const maximum = getComparisonScaleMax(data);
  const interactive = Boolean(onSelectBar);

  return (
    <div
      role={interactive ? "group" : "img"}
      aria-label={chartDescription(title, data)}
      data-chart-type="bar"
      className="space-y-5"
    >
      {data.map((item) => (
        <div key={item.id} className="space-y-2">
          <p className="text-xs font-semibold text-foreground">{item.label}</p>
          {[
            {
              id: "target" as const,
              label: "Target",
              display: item.targetDisplay,
              numeric: item.targetNumeric,
            },
            {
              id: "accomplishment" as const,
              label: "Accomplishment",
              display: item.accomplishmentDisplay,
              numeric: item.accomplishmentNumeric,
            },
          ].map((series) => (
            <div
              key={series.id}
              className="grid grid-cols-[6.6rem_minmax(0,1fr)_3.5rem] items-center gap-2"
            >
              <span className="truncate text-[0.68rem] font-medium text-muted-foreground">
                {series.label}
              </span>
              <span className="h-5 overflow-hidden bg-surface-secondary">
                {series.numeric !== null ? (
                  <SeriesBar
                    datum={item}
                    series={series.id}
                    seriesLabel={series.label}
                    appearance={appearance}
                    onSelectBar={onSelectBar}
                    selectedBarKey={selectedBarKey}
                    className="block h-full min-w-1"
                    style={{ width: `${(series.numeric / maximum) * 100}%` }}
                  />
                ) : null}
              </span>
              <span className="text-right text-[0.68rem] font-semibold tabular-nums">
                {chartValueLabel(series.display, series.numeric)}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function ColumnChart({
  title,
  data,
  appearance,
  onSelectBar,
  selectedBarKey,
}: { title: string; data: ComparisonDatum[] } & ChartInteraction) {
  const maximum = getComparisonScaleMax(data);
  const interactive = Boolean(onSelectBar);

  return (
    <div
      role={interactive ? "group" : "img"}
      aria-label={chartDescription(title, data)}
      data-chart-type="column"
    >
      <div
        className="grid h-60 gap-3 border-b border-strong-border px-2 pt-8"
        style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}
      >
        {data.map((item) => (
          <div key={item.id} className="flex min-w-0 flex-col justify-end">
            <div className="flex h-44 items-end justify-center gap-2">
              {[
                {
                  id: "target" as const,
                  label: "Target",
                  display: item.targetDisplay,
                  numeric: item.targetNumeric,
                },
                {
                  id: "accomplishment" as const,
                  label: "Accomplishment",
                  display: item.accomplishmentDisplay,
                  numeric: item.accomplishmentNumeric,
                },
              ].map((series) => (
                <div
                  key={series.id}
                  className="flex h-full w-9 min-w-0 shrink flex-col justify-end"
                >
                  <span className="mb-2 truncate text-center text-[0.65rem] font-semibold tabular-nums text-foreground">
                    {chartValueLabel(series.display, series.numeric)}
                  </span>
                  {series.numeric !== null ? (
                    <SeriesBar
                      datum={item}
                      series={series.id}
                      seriesLabel={series.label}
                      appearance={appearance}
                      onSelectBar={onSelectBar}
                      selectedBarKey={selectedBarKey}
                      className="mx-auto block w-full max-w-9"
                      style={{
                        height: `${Math.max(3, (series.numeric / maximum) * 100)}%`,
                      }}
                    />
                  ) : null}
                </div>
              ))}
            </div>
            <span
              title={item.label}
              className="line-clamp-2 min-h-8 pt-3 text-center text-xs font-semibold leading-4 text-muted-foreground"
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineChart({
  title,
  data,
  appearance,
  onSelectBar,
  selectedBarKey,
}: { title: string; data: ComparisonDatum[] } & ChartInteraction) {
  const maximum = getComparisonScaleMax(data);
  const interactive = Boolean(onSelectBar);
  const left = 56;
  const right = 604;
  const top = 40;
  const bottom = 190;
  const xFor = (index: number) =>
    data.length === 1
      ? (left + right) / 2
      : left + (index * (right - left)) / (data.length - 1);
  const targetPoints = data.map((item, index) => ({
    x: xFor(index),
    y:
      item.targetNumeric === null
        ? null
        : bottom - (item.targetNumeric / maximum) * (bottom - top),
    item,
  }));
  const accomplishmentPoints = data.map((item, index) => ({
    x: xFor(index),
    y:
      item.accomplishmentNumeric === null
        ? null
        : bottom - (item.accomplishmentNumeric / maximum) * (bottom - top),
    item,
  }));
  const targetColor = resolveBarColor(appearance, data[0], "target");

  return (
    <svg
      viewBox="0 0 640 240"
      role={interactive ? "group" : "img"}
      aria-label={chartDescription(title, data)}
      data-chart-type="line"
      className="h-auto w-full"
    >
      {[0, 0.25, 0.5, 0.75, 1].map((step) => (
        <line
          key={step}
          x1="40"
          x2="620"
          y1={bottom - step * (bottom - top)}
          y2={bottom - step * (bottom - top)}
          stroke="var(--border)"
          strokeWidth="1"
        />
      ))}
      {targetPoints.slice(0, -1).map((point, index) => {
        const next = targetPoints[index + 1];
        return point.y !== null && next.y !== null ? (
          <line
            key={`target-${index}`}
            x1={point.x}
            y1={point.y}
            x2={next.x}
            y2={next.y}
            stroke={targetColor}
            strokeWidth="4"
            strokeLinecap="round"
          />
        ) : null;
      })}
      {accomplishmentPoints.slice(0, -1).map((point, index) => {
        const next = accomplishmentPoints[index + 1];
        return point.y !== null && next.y !== null ? (
          <line
            key={`accomplishment-${index}`}
            x1={point.x}
            y1={point.y}
            x2={next.x}
            y2={next.y}
            stroke={resolveBarColor(appearance, next.item, "accomplishment")}
            strokeWidth="4"
            strokeLinecap="round"
          />
        ) : null;
      })}
      {targetPoints.map((point) => {
        const color = resolveBarColor(appearance, point.item, "target");
        const selected =
          reportBarColorKey(point.item.colorKey, "target") === selectedBarKey;
        return (
          <g key={`target-${point.item.id}`}>
            {point.y !== null ? (
              <>
                <circle
                  cx={point.x - 6}
                  cy={point.y}
                  r="6"
                  fill={color}
                  stroke={selected ? "var(--foreground)" : "white"}
                  strokeWidth={selected ? "4" : "3"}
                  {...pointInteraction(
                    point.item,
                    "target",
                    "Target",
                    color,
                    onSelectBar,
                  )}
                />
                <text
                  x={point.x - 10}
                  y={Math.max(18, point.y - 13)}
                  textAnchor="end"
                  className="fill-foreground text-[0.63rem] font-semibold"
                >
                  {point.item.targetDisplay}
                </text>
              </>
            ) : null}
          </g>
        );
      })}
      {accomplishmentPoints.map((point) => {
        const color = resolveBarColor(
          appearance,
          point.item,
          "accomplishment",
        );
        const selected =
          reportBarColorKey(point.item.colorKey, "accomplishment") ===
          selectedBarKey;
        return (
          <g key={`accomplishment-${point.item.id}`}>
            {point.y !== null ? (
              <>
                <circle
                  cx={point.x + 6}
                  cy={point.y}
                  r="6"
                  fill={color}
                  stroke={selected ? "var(--foreground)" : "white"}
                  strokeWidth={selected ? "4" : "3"}
                  {...pointInteraction(
                    point.item,
                    "accomplishment",
                    "Accomplishment",
                    color,
                    onSelectBar,
                  )}
                />
                <text
                  x={point.x + 10}
                  y={Math.max(18, point.y - 13)}
                  textAnchor="start"
                  className="fill-foreground text-[0.63rem] font-semibold"
                >
                  {point.item.accomplishmentDisplay}
                </text>
              </>
            ) : null}
            <text
              x={point.x}
              y="222"
              textAnchor="middle"
              className="fill-muted-foreground text-[0.68rem] font-semibold"
            >
              {point.item.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ComparisonChartVisual({
  type,
  title,
  data,
  preserveCategoryWidth = false,
  appearance,
  onSelectBar,
  selectedBarKey,
}: {
  type: ChartType;
  title: string;
  data: ComparisonDatum[];
  preserveCategoryWidth?: boolean;
} & ChartInteraction) {
  const interaction = { appearance, onSelectBar, selectedBarKey };
  const chart = (
    <>
      {type === "bar" ? (
        <BarChart title={title} data={data} {...interaction} />
      ) : null}
      {type === "column" ? (
        <ColumnChart title={title} data={data} {...interaction} />
      ) : null}
      {type === "line" ? (
        <LineChart title={title} data={data} {...interaction} />
      ) : null}
    </>
  );

  if (!preserveCategoryWidth || type === "bar") return chart;

  return (
    <div
      role="region"
      aria-label={`${title} horizontal chart scroller`}
      tabIndex={0}
      className="max-w-full overflow-x-scroll overflow-y-hidden pb-3 [scrollbar-gutter:stable]"
    >
      <div
        className="max-w-none"
        style={{ width: `${Math.max(48, data.length * 18)}rem` }}
      >
        {chart}
      </div>
    </div>
  );
}

export function AccomplishmentComparisonChart({
  type,
  title,
  description,
  target,
  accomplishment,
  fields,
  colorKeyPrefix,
  dataSource = "percentage",
  appearance,
  onSelectBar,
  selectedBarKey,
}: {
  type: ChartType;
  title: string;
  description: string;
  target?: ComparisonValues;
  accomplishment?: ComparisonValues;
  fields: ReadonlyArray<{ id: ComparisonField; label: string }>;
  colorKeyPrefix?: string;
  dataSource?: ChartDataSource;
} & ChartInteraction) {
  const data = createComparisonChartData(
    target,
    accomplishment,
    fields,
    colorKeyPrefix,
    dataSource,
  );

  return (
    <figure className="min-w-0 rounded-xl border border-border bg-surface p-4 sm:p-5">
      <figcaption className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h5 className="text-sm font-semibold text-foreground">{title}</h5>
          <ChartSourceBadge data={data} />
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </figcaption>
      <ComparisonChartVisual
        type={type}
        title={title}
        data={data}
        appearance={appearance}
        onSelectBar={onSelectBar}
        selectedBarKey={selectedBarKey}
      />
    </figure>
  );
}

export function AccomplishmentDataChart({
  type,
  title,
  description,
  data,
  appearance,
  onSelectBar,
  selectedBarKey,
}: {
  type: ChartType;
  title: string;
  description: string;
  data: ComparisonDatum[];
} & ChartInteraction) {
  return (
    <figure className="min-w-0 rounded-xl border border-border bg-surface p-4 sm:p-5">
      <figcaption className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h5 className="text-sm font-semibold text-foreground">{title}</h5>
          <ChartSourceBadge data={data} />
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </figcaption>
      <ComparisonChartVisual
        type={type}
        title={title}
        data={data}
        appearance={appearance}
        onSelectBar={onSelectBar}
        selectedBarKey={selectedBarKey}
      />
    </figure>
  );
}

export function AccomplishmentIndicatorSeriesChart({
  type,
  title,
  description,
  data,
  hideCaption = false,
  preserveCategoryWidth = true,
  appearance,
  onSelectBar,
  selectedBarKey,
}: {
  type: ChartType;
  title: string;
  description: string;
  data: ComparisonDatum[];
  hideCaption?: boolean;
  preserveCategoryWidth?: boolean;
} & ChartInteraction) {
  return (
    <figure className="min-w-0 rounded-xl border border-border bg-surface p-4 sm:p-5">
      {!hideCaption ? (
        <figcaption className="mb-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h5 className="text-sm font-semibold text-foreground">{title}</h5>
            <ChartSourceBadge data={data} />
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </figcaption>
      ) : (
        <div className="mb-3 flex justify-end">
          <ChartSourceBadge data={data} />
        </div>
      )}
      <ComparisonChartVisual
        type={type}
        title={title}
        data={data}
        preserveCategoryWidth={preserveCategoryWidth}
        appearance={appearance}
        onSelectBar={onSelectBar}
        selectedBarKey={selectedBarKey}
      />
    </figure>
  );
}
