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
  q1: reportValueSchema,
  q2: reportValueSchema,
  q3: reportValueSchema,
  q4: reportValueSchema,
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

const currentAccomplishmentResourceDataSchema = z
  .object({
    version: z.literal(2),
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
        message: "Performance item identifiers must be unique.",
        path: ["nodes"],
      });
    }
    hierarchy.invalidParentIndexes.forEach((index) => {
      context.addIssue({
        code: "custom",
        message: "The performance hierarchy is invalid.",
        path: ["nodes", index, "parentId"],
      });
    });
  });

const legacyPeriodEntrySchema = z.object({
  target: reportValueSchema,
  q1: reportValueSchema,
  q2: reportValueSchema,
  q3: reportValueSchema,
  q4: reportValueSchema,
  total: reportValueSchema,
});
const legacyAccomplishmentResourceDataSchema = z.object({
  version: z.literal(1),
  nodes: z.array(reportTreeNodeSchema).max(250),
  entries: z.record(
    z.string().regex(/^\d{4}$/u),
    z.record(
      reportNodeIdSchema,
      z.object({
        results: legacyPeriodEntrySchema,
        rawData: legacyPeriodEntrySchema,
      }),
    ),
  ),
  chartType: reportChartTypeSchema,
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
