import { z } from "zod";

export const reportLegendCategories = [
  "target",
  "met",
  "below",
  "unavailable",
] as const;

export const chartColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/u, "Select a valid chart color.");

export const legendIdSchema = z
  .string()
  .min(1)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u);

export const reportLegendItemSchema = z.object({
  id: legendIdSchema,
  label: z.string().trim().min(1).max(40),
  color: chartColorSchema,
});

export const barColorKeySchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[A-Za-z0-9:_-]+$/u);

// A bar references a legend entry by id, but a direct hex color is still
// accepted so documents saved before custom labels existed keep loading.
export const barColorValueSchema = z.union([chartColorSchema, legendIdSchema]);

export const reportAppearanceSchema = z.object({
  legend: z.array(reportLegendItemSchema).max(12).optional(),
  barColors: z.record(barColorKeySchema, barColorValueSchema).optional(),
});

export type ReportLegendCategory = (typeof reportLegendCategories)[number];
export type ReportLegendItem = z.infer<typeof reportLegendItemSchema>;
export type ReportAppearance = z.infer<typeof reportAppearanceSchema>;
