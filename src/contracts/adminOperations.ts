import { z } from "zod";
import {
  repositorySectionIdSchema,
  resourceFilenameSchema,
  resourceObjectKeySchema,
  resourceYearSchema,
} from "./resource.ts";

export const resourceDisplayNameSchema = z.string().trim().min(1, "Enter a display name.").max(200).refine(
  (name) => !/[\p{Cc}\p{Cf}]/u.test(name) &&
    !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(name),
  "The display name contains unsupported characters.",
);
export const resourceEditSchema = z.object({
  key: resourceObjectKeySchema,
  displayName: resourceDisplayNameSchema,
  sectionId: repositorySectionIdSchema,
  categoryId: repositorySectionIdSchema.optional(),
  year: resourceYearSchema,
});
export type ResourceEdit = z.infer<typeof resourceEditSchema>;

export const resourceRenameSchema = z.object({
  key: resourceObjectKeySchema,
  filename: resourceFilenameSchema,
});
export const resourceDeleteSchema = z.object({
  key: resourceObjectKeySchema,
  confirmation: resourceFilenameSchema,
});
export const administratorCreateSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(12).max(128),
  displayName: z.string().trim().min(2).max(80),
});
export const administratorUpdateSchema = z.object({
  uid: z.string().min(1),
  displayName: z.string().trim().min(2).max(80),
  disabled: z.boolean(),
});
export const administratorDeleteSchema = z.object({ uid: z.string().min(1) });
export const administratorSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  disabled: z.boolean(),
  createdAt: z.string(),
});
export const administratorListSchema = z.object({
  data: z.array(administratorSchema),
  canManage: z.boolean(),
});
export type Administrator = z.infer<typeof administratorSchema>;
