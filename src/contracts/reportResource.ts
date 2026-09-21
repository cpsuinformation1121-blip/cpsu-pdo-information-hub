import { z } from "zod";

export const reportNodeIdSchema = z
  .string()
  .min(2)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u);

export const reportTreeNodeSchema = z.object({
  id: reportNodeIdSchema,
  parentId: reportNodeIdSchema.nullable(),
  type: z.enum(["section", "group", "indicator"]),
  title: z.string().trim().min(2).max(120),
});

export const reportValueSchema = z.string().max(2_000);
export const reportChartTypeSchema = z.enum(["column", "line", "bar"]);

export type ReportTreeNode = z.infer<typeof reportTreeNodeSchema>;

export function inspectReportHierarchy(nodes: ReportTreeNode[]) {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const invalidParentIndexes: number[] = [];

  nodes.forEach((node, index) => {
    const parent = node.parentId ? nodesById.get(node.parentId) : undefined;
    const validParent =
      (node.type === "section" && node.parentId === null) ||
      (node.type === "group" && parent?.type === "section") ||
      (node.type === "indicator" && parent?.type === "group");

    if (!validParent) invalidParentIndexes.push(index);
  });

  return {
    hasDuplicateIds: nodesById.size !== nodes.length,
    invalidParentIndexes,
  };
}
