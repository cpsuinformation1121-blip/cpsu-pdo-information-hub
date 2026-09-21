export type ReportNodeType = "section" | "group" | "indicator";

export type ReportTreeNode = {
  id: string;
  parentId: string | null;
  type: ReportNodeType;
  title: string;
};

export type ReportDataRowType = "results" | "rawData";
export type ReportValueType = "target" | "accomplishment";

export type ReportEditorState = {
  mode: "add" | "edit";
  type: ReportNodeType;
  parentId: string | null;
  nodeId?: string;
  value: string;
};

export function reportNodeName(type: ReportNodeType) {
  if (type === "section") return "section";
  if (type === "group") return "group";
  return "indicator";
}

export function reportChildType(
  type: ReportNodeType,
): ReportNodeType | null {
  if (type === "section") return "group";
  if (type === "group") return "indicator";
  return null;
}
