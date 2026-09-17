import { z } from "zod";

export const repositorySectionIds = [
  "statistical-profile",
  "higher-education-performance",
  "research-extension",
  "financial-performance",
  "planning-documents",
  "other-resources",
  "forms",
] as const;

export const resourceFileTypes = ["pdf", "xlsx", "image"] as const;

export const resourceFileDefinitions = {
  pdf: { fileType: "pdf", mimeType: "application/pdf" },
  xlsx: {
    fileType: "xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  jpg: { fileType: "image", mimeType: "image/jpeg" },
  jpeg: { fileType: "image", mimeType: "image/jpeg" },
  png: { fileType: "image", mimeType: "image/png" },
  webp: { fileType: "image", mimeType: "image/webp" },
} as const;

export const resourceSortOptions = [
  "newest",
  "oldest",
  "name-asc",
  "name-desc",
  "file-size",
  "file-type",
] as const;

export const schoolYearSchema = z
  .string()
  .regex(/^\d{4}-\d{4}$/u, "Select a valid school year.")
  .refine(
    (value) => Number(value.slice(5)) === Number(value.slice(0, 4)) + 1,
    "Select a valid school year.",
  );
export const resourceYearSchema = z.union([
  z.number().int().min(1900).max(2200),
  schoolYearSchema,
]);

export const repositorySectionIdSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u);
export const resourceFileTypeSchema = z.enum(resourceFileTypes);
export const resourceSortSchema = z.enum(resourceSortOptions);

export const resourceObjectKeySchema = z
  .string()
  .min(1)
  .max(1024)
  .refine(
    (key) => !key.startsWith("/") && !key.includes("..") && !key.includes("\\"),
    {
      message: "Resource keys must use safe R2-style prefixes.",
    },
  );

export const resourceFilenameSchema = z
  .string()
  .min(1)
  .max(180)
  .refine(
    (filename) =>
      filename === filename.normalize("NFKC") &&
      filename !== "." &&
      filename !== ".." &&
      !/[. ]$/u.test(filename) &&
      !filename.includes("/") &&
      !filename.includes("\\") &&
      !/[\p{Cc}\p{Cf}]/u.test(filename) &&
      !/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu.test(filename),
    {
      message: "Filename contains unsupported characters.",
    },
  );

const resourceMetadataSchema = z
  .object({
    id: z.string().regex(/^[A-Za-z0-9_-]{43}$/u),
    filename: resourceFilenameSchema,
    displayName: z.string().min(1).max(200),
    sectionId: repositorySectionIdSchema,
    categoryId: z
      .string()
      .min(1)
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u)
      .optional(),
    year: resourceYearSchema,
    fileType: resourceFileTypeSchema,
    mimeType: z.string().min(1).max(120),
    fileSize: z.number().int().nonnegative(),
    uploadedAt: z.iso.datetime({ offset: true }),
  })
  .superRefine((resource, context) => {
    const extension = resource.filename.split(".").pop()?.toLowerCase();
    const definition = extension
      ? resourceFileDefinitions[
          extension as keyof typeof resourceFileDefinitions
        ]
      : undefined;

    if (!definition || definition.fileType !== resource.fileType) {
      context.addIssue({
        code: "custom",
        path: ["fileType"],
        message: "File type does not match the supported filename extension.",
      });
    }

    if (!definition || definition.mimeType !== resource.mimeType) {
      context.addIssue({
        code: "custom",
        path: ["mimeType"],
        message: "MIME type does not match the supported filename extension.",
      });
    }
  });

export const publicResourceSchema = resourceMetadataSchema;
export const adminResourceSchema = resourceMetadataSchema.safeExtend({
  key: resourceObjectKeySchema,
});

export const resourceQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  section: repositorySectionIdSchema.optional(),
  category: z.string().trim().max(80).optional(),
  year: z.union([z.coerce.number().int().min(1900).max(2200), schoolYearSchema]).optional(),
  fileType: resourceFileTypeSchema.optional(),
  sort: resourceSortSchema.default("newest"),
  cursor: z.string().trim().max(512).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const resourceListMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  nextCursor: z.string().nullable(),
});

export const publicResourceListResponseSchema = z.object({
  data: z.array(publicResourceSchema),
  meta: resourceListMetaSchema,
});

export const adminResourceListResponseSchema = z.object({
  data: z.array(adminResourceSchema),
  meta: resourceListMetaSchema,
});

export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z
      .array(z.object({ field: z.string(), message: z.string() }))
      .optional(),
  }),
});

export type RepositorySectionId = z.infer<typeof repositorySectionIdSchema>;
export type ResourceFileType = z.infer<typeof resourceFileTypeSchema>;
export type ResourceFileExtension = keyof typeof resourceFileDefinitions;
export type ResourceSort = z.infer<typeof resourceSortSchema>;
export type PublicResource = z.infer<typeof publicResourceSchema>;
export type AdminResource = z.infer<typeof adminResourceSchema>;
export type ResourceQuery = z.infer<typeof resourceQuerySchema>;
export type PublicResourceListResponse = z.infer<
  typeof publicResourceListResponseSchema
>;
export type AdminResourceListResponse = z.infer<
  typeof adminResourceListResponseSchema
>;
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
