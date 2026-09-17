import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "firebase/auth";
import {
  ArrowLeftRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { AppDialog } from "../../components/ui/AppDialog";
import type { OpcrResourceData } from "../../contracts/opcrResource";
import { ChartColorLegend } from "../../features/accomplishments/AccomplishmentChart";
import { ReportGraphOverview } from "../../features/accomplishments/ReportGraphOverview";
import {
  resolveReportLegend,
  restoreReportAppearance,
  upsertCustomLegendItem,
  type ReportLegendItem,
} from "../../features/accomplishments/reportAppearance";
import { getAccomplishmentReportYears } from "../../features/accomplishments/reportCalculations";
import { buildOpcrOverviewGroups } from "../../features/opcr/reportOverview";
import {
  calculateHalfYearTotal,
  isHalfYearInputValid,
} from "../../features/opcr/opcrCalculations";
import { useAuth } from "../../features/auth/useAuth";
import {
  getOpcrResource,
  saveOpcrResource,
} from "../../services/opcrResource";

type NodeType = "section" | "group" | "indicator";
type TreeNode = {
  id: string;
  parentId: string | null;
  type: NodeType;
  title: string;
};
type DataRowType = "results" | "rawData";
type ValueType = "target" | "accomplishment";
type PeriodField = "h1" | "h2" | "total";
type PeriodEntry = Record<PeriodField, string>;
type DataRowEntry = Record<ValueType, PeriodEntry>;
type IndicatorEntry = Record<DataRowType, DataRowEntry>;
type EntriesByYear = Record<string, Record<string, IndicatorEntry>>;
type EditorState = {
  mode: "add" | "edit";
  type: NodeType;
  parentId: string | null;
  nodeId?: string;
  value: string;
};

const periodFields = [
  { id: "h1", label: "H1" },
  { id: "h2", label: "H2" },
  { id: "total", label: "Total" },
] as const;
const dataRows = [
  { id: "results", label: "Percentage" },
  { id: "rawData", label: "Raw Data" },
] as const;
const valueGroups = [
  {
    id: "target",
    label: "Target",
    headerClass: "bg-surface-secondary text-foreground",
    quarterClass: "bg-surface-secondary/80 text-muted-foreground",
    cellClass: "bg-surface-secondary/45",
    totalClass: "bg-surface-secondary",
    inputClass: "bg-surface",
  },
  {
    id: "accomplishment",
    label: "Accomplishment",
    headerClass: "bg-primary-soft text-primary",
    quarterClass: "bg-primary-soft/65 text-primary",
    cellClass: "bg-surface",
    totalClass: "bg-primary-soft/55",
    inputClass: "bg-surface",
  },
] as const;
const fieldClass =
  "min-h-10 w-full border border-strong-border px-2 py-1 text-center text-sm font-medium tabular-nums outline-none placeholder:text-xs placeholder:font-normal placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20";
const actionClass =
  "inline-flex min-h-9 cursor-pointer items-center gap-1 px-2 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function emptyPeriodEntry(): PeriodEntry {
  return { h1: "", h2: "", total: "" };
}

function emptyDataRowEntry(): DataRowEntry {
  return { target: emptyPeriodEntry(), accomplishment: emptyPeriodEntry() };
}

function emptyIndicatorEntry(): IndicatorEntry {
  return { results: emptyDataRowEntry(), rawData: emptyDataRowEntry() };
}

function nodeName(type: NodeType) {
  if (type === "section") return "section";
  if (type === "group") return "group";
  return "indicator";
}

function childType(type: NodeType): NodeType | null {
  if (type === "section") return "group";
  if (type === "group") return "indicator";
  return null;
}

function NodeActions({
  node,
  onAdd,
  onEdit,
  onDelete,
}: {
  node: TreeNode;
  onAdd: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <span className="flex shrink-0 items-center">
      {childType(node.type) ? (
        <button
          type="button"
          onClick={onAdd}
          className={actionClass + " text-primary"}
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Add
        </button>
      ) : null}
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${node.title}`}
        className={actionClass + " text-primary"}
      >
        <Pencil className="size-3.5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${node.title}`}
        className={actionClass + " text-danger"}
      >
        <Trash2 className="size-3.5" aria-hidden="true" />
      </button>
    </span>
  );
}

export function AdminOpcrPage() {
  const { user } = useAuth();
  const resourceQuery = useQuery({
    queryKey: ["admin-opcr-resource"],
    queryFn: () => {
      if (!user) throw new Error("Please sign in to load this resource.");
      return getOpcrResource(user);
    },
    enabled: Boolean(user),
    staleTime: Number.POSITIVE_INFINITY,
  });

  if (!user || resourceQuery.isPending)
    return (
      <p className="mt-10 text-muted-foreground" role="status">
        Loading the accomplishment resource...
      </p>
    );
  if (resourceQuery.isError)
    return (
      <p
        className="mt-10 border-l-2 border-danger bg-danger-soft px-4 py-3 text-sm text-danger"
        role="alert"
      >
        {resourceQuery.error instanceof Error
          ? resourceQuery.error.message
          : "The accomplishment resource could not be loaded."}
      </p>
    );

  return (
    <OpcrResourceEditor
      user={user}
      initialData={resourceQuery.data}
    />
  );
}

function OpcrResourceEditor({
  user,
  initialData,
}: {
  user: User;
  initialData: OpcrResourceData;
}) {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const years = getAccomplishmentReportYears(currentYear);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [nodes, setNodes] = useState<TreeNode[]>(initialData.nodes);
  const [entries, setEntries] = useState<EntriesByYear>(initialData.entries);
  const [openNodes, setOpenNodes] = useState<Record<string, boolean>>({});
  const [chartType, setChartType] = useState(initialData.chartType);
  const [legend, setLegend] = useState<ReportLegendItem[]>(() =>
    resolveReportLegend(initialData.appearance?.legend),
  );
  const [barColors, setBarColors] = useState<Record<string, string>>(
    initialData.appearance?.barColors ?? {},
  );
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved">("saved");
  const [saveConfirmationVisible, setSaveConfirmationVisible] = useState(false);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TreeNode | null>(null);

  useEffect(() => {
    if (!saveConfirmationVisible) return;

    const timeout = window.setTimeout(
      () => setSaveConfirmationVisible(false),
      4_000,
    );

    return () => window.clearTimeout(timeout);
  }, [saveConfirmationVisible]);

  function markUnsaved() {
    setSaveStatus("unsaved");
    setSaveConfirmationVisible(false);
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      return saveOpcrResource(user, {
        version: 1,
        nodes,
        entries,
        chartType,
        appearance: { legend, barColors },
      });
    },
    onSuccess: (savedData) => {
      queryClient.setQueryData(["admin-opcr-resource"], savedData);
      void queryClient.invalidateQueries({
        queryKey: ["public-accomplishment-resource"],
      });
      setSaveStatus("saved");
      setSaveConfirmationVisible(true);
    },
  });

  const childrenOf = (parentId: string | null) =>
    nodes.filter((node) => node.parentId === parentId);
  const isOpen = (id: string) => openNodes[id] ?? true;
  const startAdd = (type: NodeType, parentId: string | null) =>
    setEditor({ mode: "add", type, parentId, value: "" });
  const startEdit = (node: TreeNode) =>
    setEditor({
      mode: "edit",
      type: node.type,
      parentId: node.parentId,
      nodeId: node.id,
      value: node.title,
    });

  function saveEditor() {
    if (!editor?.value.trim()) return;
    if (editor.mode === "edit") {
      setNodes((items) =>
        items.map((item) =>
          item.id === editor.nodeId
            ? { ...item, title: editor.value.trim() }
            : item,
        ),
      );
    } else {
      const id = `${editor.type}-${Date.now()}`;
      setNodes((items) => [
        ...items,
        {
          id,
          parentId: editor.parentId,
          type: editor.type,
          title: editor.value.trim(),
        },
      ]);
      if (editor.parentId)
        setOpenNodes((items) => ({ ...items, [editor.parentId as string]: true }));
    }
    markUnsaved();
    setEditor(null);
  }

  function deleteNode(node: TreeNode) {
    const ids = new Set([node.id]);
    let foundChild = true;
    while (foundChild) {
      foundChild = false;
      nodes.forEach((item) => {
        if (item.parentId && ids.has(item.parentId) && !ids.has(item.id)) {
          ids.add(item.id);
          foundChild = true;
        }
      });
    }
    setNodes((items) => items.filter((item) => !ids.has(item.id)));
    setEntries((allEntries) => {
      const nextEntries: EntriesByYear = {};
      Object.entries(allEntries).forEach(([year, yearEntries]) => {
        nextEntries[Number(year)] = Object.fromEntries(
          Object.entries(yearEntries).filter(
            ([indicatorId]) => !ids.has(indicatorId),
          ),
        );
      });
      return nextEntries;
    });
    markUnsaved();
    setPendingDelete(null);
  }

  function updateEntry(
    id: string,
    rowType: DataRowType,
    valueType: ValueType,
    field: PeriodField,
    value: string,
  ) {
    setEntries((allEntries) => ({
      ...allEntries,
      [selectedYear]: {
        ...allEntries[selectedYear],
        [id]: {
          ...(allEntries[selectedYear]?.[id] ?? emptyIndicatorEntry()),
          [rowType]: {
            ...(allEntries[selectedYear]?.[id]?.[rowType] ??
              emptyDataRowEntry()),
            [valueType]: (() => {
              const period = {
                ...(allEntries[selectedYear]?.[id]?.[rowType]?.[valueType] ??
                  emptyPeriodEntry()),
                [field]:
                  rowType === "results"
                    ? value.replace(/%/g, "").trim()
                    : value,
              };

              if (field !== "total") {
                period.total = calculateHalfYearTotal(period);
              }

              return period;
            })(),
          },
        },
      },
    }));
    markUnsaved();
  }

  function updateLegendItem(
    id: string,
    patch: Partial<Pick<ReportLegendItem, "label" | "color">>,
  ) {
    setLegend((items) =>
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
    markUnsaved();
  }

  function removeLegendItem(id: string) {
    setLegend((items) => items.filter((item) => item.id !== id));
    setBarColors((colors) =>
      Object.fromEntries(
        Object.entries(colors).filter(([, legendId]) => legendId !== id),
      ),
    );
    markUnsaved();
  }

  function updateBarColor(colorKey: string, legendId: string | undefined) {
    setBarColors((colors) => {
      const next = { ...colors };
      if (legendId === undefined) delete next[colorKey];
      else next[colorKey] = legendId;
      return next;
    });
    markUnsaved();
  }

  function applyCustomBarColor(
    colorKey: string,
    color: string,
    label: string,
  ) {
    const result = upsertCustomLegendItem(legend, color, label);
    setLegend(result.legend);
    setBarColors((colors) => ({ ...colors, [colorKey]: result.id }));
    markUnsaved();
  }

  function restoreDefaults(options: {
    legend: boolean;
    indicatorIds: string[];
  }) {
    const next = restoreReportAppearance({ legend, barColors }, options);
    setLegend(next.legend);
    setBarColors(next.barColors);
    markUnsaved();
  }

  const overviewGroups = buildOpcrOverviewGroups(
    nodes,
    entries[selectedYear] ?? {},
  );
  const overriddenIndicatorIds = new Set(
    Object.keys(barColors).map((key) => key.split(":")[0]),
  );
  const restorableIndicators = nodes
    .filter(
      (node) =>
        node.type === "indicator" && overriddenIndicatorIds.has(node.id),
    )
    .map((node) => ({ id: node.id, title: node.title }));

  const renderActions = (node: TreeNode) => (
    <NodeActions
      node={node}
      onAdd={() => {
        const type = childType(node.type);
        if (type) startAdd(type, node.id);
      }}
      onEdit={() => startEdit(node)}
      onDelete={() => setPendingDelete(node)}
    />
  );

  return (
    <section className="mt-5" aria-labelledby="accomplishment-title">
      <p className="text-xs font-bold tracking-[0.14em] text-primary">
        ADMIN WORKSPACE
      </p>
      <div className="mt-2 flex flex-col gap-5 border-b border-strong-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            id="accomplishment-title"
            className="font-serif text-3xl tracking-tight sm:whitespace-nowrap sm:text-4xl"
          >
            Office Performance Commitment and Review (OPCR)
          </h1>
          <p className="mt-3 text-muted-foreground">
            Set targets and half-year results by MFO, its PAPs, and their
            performance indicators.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="sm:w-44">
            <span className="block text-sm font-semibold">Year</span>
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              className="mt-2 min-h-12 w-full cursor-pointer border border-strong-border bg-surface px-4"
            >
              {years.map((year) => (
                <option key={year}>{year}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => startAdd("section", null)}
            className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 border border-primary px-4 text-sm font-semibold text-primary hover:bg-primary-soft"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add section
          </button>
          <button
            type="button"
            disabled={
              saveMutation.isPending || saveStatus === "saved"
            }
            onClick={() => saveMutation.mutate()}
            className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="size-4" aria-hidden="true" />
            {saveMutation.isPending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      <div
        className="mt-5 flex items-center gap-2 border-l-2 border-primary bg-primary-soft px-4 py-3 text-sm text-primary"
        aria-live="polite"
      >
        {saveStatus === "saved" ? (
          <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
        ) : null}
        <span>
          {saveStatus === "unsaved"
            ? "Unsaved changes."
            : "Saved."}
        </span>
      </div>
      {saveMutation.isError ? (
        <p
          className="mt-3 border-l-2 border-danger bg-danger-soft px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {saveMutation.error instanceof Error
            ? saveMutation.error.message
            : "The worksheet could not be saved."}
        </p>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_10px_28px_rgba(20,83,45,0.05)]">
        <div
          id="opcr-table-help"
          className="flex items-center gap-2 border-b border-border bg-surface-secondary px-4 py-3 text-xs font-medium text-muted-foreground lg:hidden"
        >
          <ArrowLeftRight
            className="size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
          Scroll to view both half-year periods
        </div>
        <div className="overflow-x-auto">
          <table
            aria-describedby="opcr-table-help"
            className="w-full min-w-[90rem] table-fixed border-collapse text-left"
          >
            <colgroup>
              <col className="w-[22rem]" />
              <col className="w-32" />
              {Array.from({ length: 6 }, (_, index) => (
                <col key={index} className="w-24" />
              ))}
            </colgroup>
            <thead className="bg-surface-secondary text-sm">
              <tr className="border-b border-strong-border">
                <th
                  scope="col"
                  rowSpan={2}
                  className="bg-surface-secondary px-5 py-4 lg:sticky lg:left-0 lg:z-30 lg:shadow-[1px_0_0_var(--strong-border)]"
                >
                  MFO/PAPs
                </th>
                <th
                  scope="col"
                  rowSpan={2}
                  className="border-l border-strong-border bg-surface-secondary px-4 py-4 lg:sticky lg:left-[22rem] lg:z-30 lg:shadow-[1px_0_0_var(--strong-border)]"
                >
                  Data type
                </th>
                {valueGroups.map((group, index) => (
                  <th
                    key={group.id}
                    scope="colgroup"
                    colSpan={3}
                    className={`${index === 1 ? "border-l-2 border-primary/35" : "border-l border-strong-border"} ${group.headerClass} px-5 py-3 text-center`}
                  >
                    <span className="font-semibold">{group.label}</span>
                  </th>
                ))}
              </tr>
              <tr className="border-b border-strong-border">
                {valueGroups.flatMap((group, groupIndex) =>
                  periodFields.map((field) => (
                    <th
                      key={`${group.id}-${field.id}`}
                      scope="col"
                      className={`${groupIndex === 1 && field.id === "h1" ? "border-l-2 border-primary/35" : "border-l border-border"} ${group.quarterClass} ${field.id === "total" ? group.totalClass : ""} px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.1em]`}
                    >
                      {field.label}
                    </th>
                  )),
                )}
              </tr>
            </thead>
            <tbody>
              {childrenOf(null).map((section) => (
                <Fragment key={section.id}>
                  <tr className="border-b border-primary/15 bg-primary-soft">
                    <th className="bg-primary-soft px-5 py-2 lg:sticky lg:left-0 lg:z-20">
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          aria-expanded={isOpen(section.id)}
                          onClick={() =>
                            setOpenNodes((items) => ({
                              ...items,
                              [section.id]: !isOpen(section.id),
                            }))
                          }
                          className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 text-left font-semibold"
                        >
                          {isOpen(section.id) ? (
                            <ChevronDown className="size-4 text-primary" />
                          ) : (
                            <ChevronRight className="size-4 text-primary" />
                          )}
                          <span className="whitespace-normal break-words">
                            {section.title}
                          </span>
                        </button>
                        {renderActions(section)}
                      </div>
                    </th>
                    <td colSpan={7} className="bg-primary-soft" />
                  </tr>
                  {isOpen(section.id)
                    ? childrenOf(section.id).map((group) => (
                        <Fragment key={group.id}>
                          <tr className="border-b border-border bg-surface-secondary/80">
                            <th className="bg-surface-secondary py-2 pl-12 pr-5 lg:sticky lg:left-0 lg:z-20">
                              <div className="flex items-center justify-between gap-3">
                                <button
                                  type="button"
                                  aria-expanded={isOpen(group.id)}
                                  onClick={() =>
                                    setOpenNodes((items) => ({
                                      ...items,
                                      [group.id]: !isOpen(group.id),
                                    }))
                                  }
                                  className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 text-left font-medium"
                                >
                                  {isOpen(group.id) ? (
                                    <ChevronDown className="size-4 text-primary" />
                                  ) : (
                                    <ChevronRight className="size-4 text-primary" />
                                  )}
                                  <span className="whitespace-normal break-words">
                                    {group.title}
                                  </span>
                                </button>
                                {renderActions(group)}
                              </div>
                            </th>
                            <td colSpan={7} className="bg-surface-secondary/80" />
                          </tr>
                          {isOpen(group.id)
                            ? childrenOf(group.id).map((indicator) => {
                                const indicatorEntry =
                                  entries[selectedYear]?.[indicator.id] ??
                                  emptyIndicatorEntry();
                                return (
                                  <Fragment key={indicator.id}>
                                    {dataRows.map((dataRow, rowIndex) => {
                                      const entry =
                                        indicatorEntry[dataRow.id];
                                      return (
                                        <tr
                                          key={dataRow.id}
                                          className={
                                            rowIndex === 0
                                              ? "border-t border-strong-border"
                                              : "border-t border-border"
                                          }
                                        >
                                          {rowIndex === 0 ? (
                                            <th
                                              scope="rowgroup"
                                              rowSpan={2}
                                              className="bg-surface py-4 pl-16 pr-4 text-sm font-semibold lg:sticky lg:left-0 lg:z-10 lg:shadow-[1px_0_0_var(--strong-border)]"
                                            >
                                              <div className="flex items-center justify-between gap-3">
                                                <span className="whitespace-normal break-words">
                                                  {indicator.title}
                                                </span>
                                                {renderActions(indicator)}
                                              </div>
                                            </th>
                                          ) : null}
                                          <th
                                            scope="row"
                                            className={`${dataRow.id === "results" ? "bg-primary-soft text-primary" : "bg-surface-secondary text-foreground"} border-l border-strong-border px-4 py-3 text-sm font-semibold lg:sticky lg:left-[22rem] lg:z-10 lg:shadow-[1px_0_0_var(--strong-border)]`}
                                            style={
                                              dataRow.id === "results"
                                                ? {
                                                    backgroundColor:
                                                      "var(--primary-soft)",
                                                  }
                                                : undefined
                                            }
                                          >
                                            {dataRow.label}
                                          </th>
                                          {valueGroups.flatMap(
                                            (group, groupIndex) =>
                                              periodFields.map((field) => (
                                                <td
                                                  key={`${group.id}-${field.id}`}
                                                  className={`${groupIndex === 1 && field.id === "h1" ? "border-l-2 border-primary/35" : "border-l border-border"} ${field.id === "total" ? group.totalClass : group.cellClass} p-2.5`}
                                                >
                                                  <div className="relative">
                                                    <input
                                                      aria-label={`${dataRow.label} ${field.label} ${group.label.toLowerCase()} for ${indicator.title}`}
                                                      inputMode={
                                                        dataRow.id === "results"
                                                          ? "decimal"
                                                          : "text"
                                                      }
                                                      maxLength={2_000}
                                                      title={
                                                        field.id === "total"
                                                          ? "Automatically calculated from Q1 to Q4. You can edit this total."
                                                          : undefined
                                                      }
                                                      value={
                                                        dataRow.id === "results"
                                                          ? entry[group.id][
                                                              field.id
                                                            ]
                                                              .replace(/%/g, "")
                                                              .trim()
                                                          : entry[group.id][field.id]
                                                      }
                                                      onChange={(event) => {
                                                        if (
                                                          dataRow.id ===
                                                            "results" &&
                                                          field.id !== "total" &&
                                                          !isHalfYearInputValid(
                                                            event.target.value,
                                                          )
                                                        )
                                                          return;

                                                        updateEntry(
                                                          indicator.id,
                                                          dataRow.id,
                                                          group.id,
                                                          field.id,
                                                          event.target.value,
                                                        );
                                                      }}
                                                      placeholder="Enter"
                                                      className={`${fieldClass} ${group.inputClass} ${dataRow.id === "results" ? "pr-7" : ""} ${field.id === "total" ? "font-bold" : ""}`}
                                                    />
                                                    {dataRow.id === "results" ? (
                                                      <span
                                                        className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-medium text-muted-foreground"
                                                        aria-hidden="true"
                                                      >
                                                        %
                                                      </span>
                                                    ) : null}
                                                  </div>
                                                </td>
                                              )),
                                          )}
                                        </tr>
                                      );
                                    })}
                                  </Fragment>
                                );
                              })
                            : null}
                        </Fragment>
                      ))
                    : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {nodes.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            No sections. Add one to begin.
          </p>
        ) : null}

        <div className="flex flex-col gap-4 border-t border-strong-border bg-surface-secondary px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Public chart colors</p>
            <div className="mt-2">
              <ChartColorLegend compact legend={legend} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Accomplishment colors compare each value with its matching target.
            </p>
          </div>
          <label className="flex items-center gap-2">
            <span className="text-sm font-semibold">Chart</span>
            <select
              value={chartType}
              onChange={(event) => {
                const value = event.target.value;
                if (value === "column" || value === "line" || value === "bar")
                  setChartType(value);
                markUnsaved();
              }}
              className="min-h-11 border border-strong-border bg-surface px-3 text-sm"
            >
              <option value="column">Column chart</option>
              <option value="line">Line chart</option>
              <option value="bar">Bar chart</option>
            </select>
          </label>
        </div>
      </div>

      <ReportGraphOverview
        chartType={chartType}
        groups={overviewGroups}
        legend={legend}
        barColors={barColors}
        onLegendItemChange={updateLegendItem}
        onRemoveLegendItem={removeLegendItem}
        onBarColorChange={updateBarColor}
        onCustomBarColor={applyCustomBarColor}
        restorableIndicators={restorableIndicators}
        onRestore={restoreDefaults}
      />

      {editor ? (
        <AppDialog
          title={`${editor.mode === "add" ? "Add" : "Edit"} ${nodeName(editor.type)}`}
          description="Enter a clear name."
          onClose={() => setEditor(null)}
        >
          <form
            className="p-5 sm:p-6"
            onSubmit={(event) => {
              event.preventDefault();
              saveEditor();
            }}
          >
            <label className="text-sm font-semibold">
              Name
              <input
                autoFocus
                required
                minLength={2}
                maxLength={120}
                value={editor.value}
                onChange={(event) =>
                  setEditor({ ...editor, value: event.target.value })
                }
                className="mt-2 min-h-12 w-full border border-strong-border px-4"
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditor(null)}
                className="min-h-11 cursor-pointer border border-strong-border px-5 font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={editor.value.trim().length < 2}
                className="min-h-11 cursor-pointer bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-50"
              >
                {editor.mode === "add" ? "Add" : "Save changes"}
              </button>
            </div>
          </form>
        </AppDialog>
      ) : null}

      {pendingDelete ? (
        <AppDialog
          title={`Delete ${nodeName(pendingDelete.type)}`}
          description={`Delete "${pendingDelete.title}" from this draft?`}
          onClose={() => setPendingDelete(null)}
        >
          <div className="p-5 sm:p-6">
            <p className="text-sm leading-6 text-muted-foreground">
              Nested items will also be deleted.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="min-h-11 cursor-pointer border border-strong-border px-5 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteNode(pendingDelete)}
                className="min-h-11 cursor-pointer bg-danger px-5 font-semibold text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </AppDialog>
      ) : null}

      {saveConfirmationVisible ? (
        <div
          className="fixed bottom-5 right-5 z-50 flex w-[min(22rem,calc(100vw-2.5rem))] items-start gap-3 rounded-xl border border-primary/25 bg-primary px-4 py-4 text-primary-foreground shadow-[0_18px_48px_rgba(20,83,45,0.28)]"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2
            className="mt-0.5 size-5 shrink-0"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Changes saved</p>
            <p className="mt-1 text-sm text-primary-foreground/85">
              The OPCR was updated successfully.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSaveConfirmationVisible(false)}
            aria-label="Dismiss save confirmation"
            className="-mr-1 -mt-1 inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </section>
  );
}
