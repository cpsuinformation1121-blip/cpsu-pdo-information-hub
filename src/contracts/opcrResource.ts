import { z } from "zod";

const nodeIdSchema = z
  .string()
  .min(2)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u);

const treeNodeSchema = z.object({
  id: nodeIdSchema,
  parentId: nodeIdSchema.nullable(),
  type: z.enum(["section", "group", "indicator"]),
  title: z.string().trim().min(2).max(120),
});

const valueSchema = z.string().max(2_000);
const periodEntrySchema = z.object({
  h1: valueSchema,
  h2: valueSchema,
  total: valueSchema,
});
const dataRowEntrySchema = z.object({
  target: periodEntrySchema,
  accomplishment: periodEntrySchema,
});
const indicatorEntrySchema = z.object({
  results: dataRowEntrySchema,
  rawData: dataRowEntrySchema,
});

export const opcrResourceDataSchema = z
  .object({
    version: z.literal(1),
    nodes: z.array(treeNodeSchema).max(250),
    entries: z.record(
      z.string().regex(/^\d{4}$/u),
      z.record(nodeIdSchema, indicatorEntrySchema),
    ),
    chartType: z.enum(["column", "line", "bar"]),
  })
  .superRefine((data, context) => {
    const nodesById = new Map(data.nodes.map((node) => [node.id, node]));
    if (nodesById.size !== data.nodes.length) {
      context.addIssue({
        code: "custom",
        message: "OPCR performance item identifiers must be unique.",
        path: ["nodes"],
      });
    }
    data.nodes.forEach((node, index) => {
      const parent = node.parentId ? nodesById.get(node.parentId) : undefined;
      const validParent =
        (node.type === "section" && node.parentId === null) ||
        (node.type === "group" && parent?.type === "section") ||
        (node.type === "indicator" && parent?.type === "group");
      if (!validParent) {
        context.addIssue({
          code: "custom",
          message: "The OPCR performance hierarchy is invalid.",
          path: ["nodes", index, "parentId"],
        });
      }
    });
  });

export const opcrResourceResponseSchema = z.object({
  data: opcrResourceDataSchema,
});

export type OpcrResourceData = z.infer<typeof opcrResourceDataSchema>;
