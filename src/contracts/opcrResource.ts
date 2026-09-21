import { z } from "zod";
import { reportAppearanceSchema } from "./reportAppearance.ts";
import {
  inspectReportHierarchy,
  reportChartTypeSchema,
  reportNodeIdSchema,
  reportTreeNodeSchema,
  reportValueSchema,
} from "./reportResource.ts";

const periodEntrySchema = z.object({
  h1: reportValueSchema,
  h2: reportValueSchema,
  total: reportValueSchema,
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
    nodes: z.array(reportTreeNodeSchema).max(250),
    entries: z.record(
      z.string().regex(/^\d{4}$/u),
      z.record(reportNodeIdSchema, indicatorEntrySchema),
    ),
    chartType: reportChartTypeSchema,
    appearance: reportAppearanceSchema.optional(),
  })
  .superRefine((data, context) => {
    const hierarchy = inspectReportHierarchy(data.nodes);
    if (hierarchy.hasDuplicateIds) {
      context.addIssue({
        code: "custom",
        message: "OPCR performance item identifiers must be unique.",
        path: ["nodes"],
      });
    }
    hierarchy.invalidParentIndexes.forEach((index) => {
      context.addIssue({
        code: "custom",
        message: "The OPCR performance hierarchy is invalid.",
        path: ["nodes", index, "parentId"],
      });
    });
  });

export const opcrResourceResponseSchema = z.object({
  data: opcrResourceDataSchema,
});

export type OpcrResourceData = z.infer<typeof opcrResourceDataSchema>;
