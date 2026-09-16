import { z } from "zod";
import { reportAppearanceSchema } from "./reportAppearance";

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
  q1: valueSchema,
  q2: valueSchema,
  q3: valueSchema,
  q4: valueSchema,
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

const currentAccomplishmentResourceDataSchema = z
  .object({
    version: z.literal(2),
    nodes: z.array(treeNodeSchema).max(250),
    entries: z.record(
      z.string().regex(/^\d{4}$/u),
      z.record(nodeIdSchema, indicatorEntrySchema),
    ),
    chartType: z.enum(["column", "line", "bar"]),
    appearance: reportAppearanceSchema.optional(),
  })
  .superRefine((data, context) => {
    const nodesById = new Map(data.nodes.map((node) => [node.id, node]));
    if (nodesById.size !== data.nodes.length) {
      context.addIssue({
        code: "custom",
        message: "Performance item identifiers must be unique.",
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
          message: "The performance hierarchy is invalid.",
          path: ["nodes", index, "parentId"],
        });
      }
    });
  });

const legacyPeriodEntrySchema = z.object({
  target: valueSchema,
  q1: valueSchema,
  q2: valueSchema,
  q3: valueSchema,
  q4: valueSchema,
  total: valueSchema,
});
const legacyAccomplishmentResourceDataSchema = z.object({
  version: z.literal(1),
  nodes: z.array(treeNodeSchema).max(250),
  entries: z.record(
    z.string().regex(/^\d{4}$/u),
    z.record(
      nodeIdSchema,
      z.object({
        results: legacyPeriodEntrySchema,
        rawData: legacyPeriodEntrySchema,
      }),
    ),
  ),
  chartType: z.enum(["column", "line", "bar"]),
});

function migrateLegacyData(value: unknown): unknown {
  const legacy = legacyAccomplishmentResourceDataSchema.safeParse(value);
  if (!legacy.success) return value;

  const entries = Object.fromEntries(
    Object.entries(legacy.data.entries).map(([year, yearEntries]) => [
      year,
      Object.fromEntries(
        Object.entries(yearEntries).map(([indicatorId, indicator]) => [
          indicatorId,
          Object.fromEntries(
            Object.entries(indicator).map(([rowType, row]) => [
              rowType,
              {
                target: {
                  q1: "",
                  q2: "",
                  q3: "",
                  q4: "",
                  total: row.target,
                },
                accomplishment: {
                  q1: row.q1,
                  q2: row.q2,
                  q3: row.q3,
                  q4: row.q4,
                  total: row.total,
                },
              },
            ]),
          ),
        ]),
      ),
    ]),
  );

  return { ...legacy.data, version: 2, entries };
}

export const accomplishmentResourceDataSchema = z.preprocess(
  migrateLegacyData,
  currentAccomplishmentResourceDataSchema,
);

export const accomplishmentResourceResponseSchema = z.object({
  data: accomplishmentResourceDataSchema,
});

export type AccomplishmentResourceData = z.infer<
  typeof accomplishmentResourceDataSchema
>;
