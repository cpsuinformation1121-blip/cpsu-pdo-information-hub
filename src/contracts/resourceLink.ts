import { z } from "zod";
import {
  repositorySectionIdSchema,
  resourceFilenameSchema,
  resourceObjectKeySchema,
  resourceYearSchema,
} from "./resource.ts";

export const maximumResourceLinkPayloadSize = 4 * 1024;

export const resourceLinkNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a link name.")
  .max(170, "The link name is too long.")
  .refine((name) => !name.toLocaleLowerCase().endsWith(".link"), {
    message: "Enter the link name without a file extension.",
  })
  .refine((name) => resourceFilenameSchema.safeParse(`${name}.link`).success, {
    message: "The link name contains unsupported characters.",
  });

export const resourceLinkUrlSchema = z
  .url("Enter a valid web address.")
  .refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  }, "Enter a secure HTTPS address without embedded credentials.");

export const resourceLinkCreateSchema = z.object({
  name: resourceLinkNameSchema,
  url: resourceLinkUrlSchema,
  sectionId: repositorySectionIdSchema,
  categoryId: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u)
    .optional(),
  year: resourceYearSchema,
});

export const resourceLinkPayloadSchema = z.object({
  url: resourceLinkUrlSchema,
});

export const resourceLinkCreateResponseSchema = z.object({
  data: z.object({ key: resourceObjectKeySchema }),
});

export type ResourceLinkCreate = z.infer<typeof resourceLinkCreateSchema>;