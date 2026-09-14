import type { AccomplishmentResourceData } from "../../contracts/accomplishmentResource";
import {
  createComparisonChartData,
  getComparisonScaleMax,
  type ComparisonDatum,
  type ComparisonField,
  type ComparisonStatus,
  type ComparisonValues,
} from "./chartData";

type ChartType = AccomplishmentResourceData["chartType"];

const targetColor = "var(--chart-target)";

function accomplishmentColor(status: ComparisonStatus) {
  if (status === "met") return "var(--primary)";
  if (status === "below") return "var(--danger)";
  return "var(--muted-foreground)";
}

function chartValueLabel(display: string, numeric: number | null) {
  return numeric === null ? "—" : display;
}

function chartDescription(title: string, data: ComparisonDatum[]) {
  return `${title}: ${data
    .map(
      (item) =>
        `${item.label}, target ${item.targetDisplay}, accomplishment ${item.accomplishmentDisplay}`,
    )
    .join("; ")}`;
}

export function ChartColorLegend({ compact = false }: { compact?: boolean }) {
  const items = [
    { label: "Target", color: targetColor },
    { label: "Met target", color: "var(--primary)" },
    { label: "Below target", color: "var(--danger)" },
    { label: "No comparison", color: "var(--muted-foreground)" },
  ];

  return (
    <div
      aria-label="Chart color guide"
      className={`flex flex-wrap items-center ${compact ? "gap-x-4 gap-y-2" : "gap-x-5 gap-y-2"} text-xs text-muted-foreground`}
    >
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-2">
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

function BarChart({ title, data }: { title: string; data: ComparisonDatum[] }) {
  const maximum = getComparisonScaleMax(data);

  return (
    <div
      role="img"
      aria-label={chartDescription(title, data)}
      data-chart-type="bar"
      className="space-y-5"
    >
      {data.map((item) => (
        <div key={item.id} className="space-y-2">
          <p className="text-xs font-semibold text-foreground">{item.label}</p>
          {[
            {
              label: "Target",
              display: item.targetDisplay,
              numeric: item.targetNumeric,
              color: targetColor,
            },
            {
              label: "Accomplishment",
              display: item.accomplishmentDisplay,
              numeric: item.accomplishmentNumeric,
              color: accomplishmentColor(item.status),
            },
          ].map((series) => (
            <div
              key={series.label}
              className="grid grid-cols-[6.6rem_minmax(0,1fr)_3.5rem] items-center gap-2"
            >
              <span className="truncate text-[0.68rem] font-medium text-muted-foreground">
                {series.label}
              </span>
              <span className="h-5 overflow-hidden rounded bg-surface-secondary">
                {series.numeric !== null ? (
                  <span
                    className="block h-full min-w-1 rounded"
                    style={{
                      backgroundColor: series.color,
                      width: `${(series.numeric / maximum) * 100}%`,
                    }}
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
}: {
  title: string;
  data: ComparisonDatum[];
}) {
  const maximum = getComparisonScaleMax(data);

  return (
    <div
      role="img"
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
                  label: "Target",
                  display: item.targetDisplay,
                  numeric: item.targetNumeric,
                  color: targetColor,
                },
                {
                  label: "Accomplishment",
                  display: item.accomplishmentDisplay,
                  numeric: item.accomplishmentNumeric,
                  color: accomplishmentColor(item.status),
                },
              ].map((series) => (
                <div
                  key={series.label}
                  className="flex h-full w-9 min-w-0 shrink flex-col justify-end"
                >
                  <span className="mb-2 truncate text-center text-[0.65rem] font-semibold tabular-nums text-foreground">
                    {chartValueLabel(series.display, series.numeric)}
                  </span>
                  {series.numeric !== null ? (
                    <span
                      className="mx-auto block w-full max-w-9 rounded-t"
                      style={{
                        backgroundColor: series.color,
                        height: `${Math.max(3, (series.numeric / maximum) * 100)}%`,
                      }}
                    />
                  ) : null}
                </div>
              ))}
            </div>
            <span className="pt-3 text-center text-xs font-semibold text-muted-foreground">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineChart({ title, data }: { title: string; data: ComparisonDatum[] }) {
  const maximum = getComparisonScaleMax(data);
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

  return (
    <svg
      viewBox="0 0 640 240"
      role="img"
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
            stroke={accomplishmentColor(next.item.status)}
            strokeWidth="4"
            strokeLinecap="round"
          />
        ) : null;
      })}
      {targetPoints.map((point) => (
        <g key={`target-${point.item.id}`}>
          {point.y !== null ? (
            <>
              <circle
                cx={point.x - 6}
                cy={point.y}
                r="6"
                fill={targetColor}
                stroke="white"
                strokeWidth="3"
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
      ))}
      {accomplishmentPoints.map((point) => (
        <g key={`accomplishment-${point.item.id}`}>
          {point.y !== null ? (
            <>
              <circle
                cx={point.x + 6}
                cy={point.y}
                r="6"
                fill={accomplishmentColor(point.item.status)}
                stroke="white"
                strokeWidth="3"
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
      ))}
    </svg>
  );
}

export function AccomplishmentComparisonChart({
  type,
  title,
  description,
  target,
  accomplishment,
  fields,
}: {
  type: ChartType;
  title: string;
  description: string;
  target?: ComparisonValues;
  accomplishment?: ComparisonValues;
  fields: ReadonlyArray<{ id: ComparisonField; label: string }>;
}) {
  const data = createComparisonChartData(target, accomplishment, fields);

  return (
    <figure className="min-w-0 rounded-xl border border-border bg-surface p-4 sm:p-5">
      <figcaption className="mb-5">
        <h5 className="text-sm font-semibold text-foreground">{title}</h5>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </figcaption>
      {type === "bar" ? <BarChart title={title} data={data} /> : null}
      {type === "column" ? <ColumnChart title={title} data={data} /> : null}
      {type === "line" ? <LineChart title={title} data={data} /> : null}
    </figure>
  );
}
