import { z } from "zod";
import { resourceFilenameSchema, resourceObjectKeySchema } from "./resource.ts";

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
