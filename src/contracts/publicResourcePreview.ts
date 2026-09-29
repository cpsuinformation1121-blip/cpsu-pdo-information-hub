import { z } from "zod";

export const publicResourceIdSchema = z.string().regex(/^(?:[A-Za-z0-9_-]{43}|v1_[A-Za-z0-9_-]{40,6000})$/u);

export const publicResourcePreviewRequestSchema = z.object({
  id: publicResourceIdSchema,
});

export const publicResourcePreviewResponseSchema = z.object({
  data: z.object({
    url: z.url(),
    expiresAt: z.iso.datetime({ offset: true }),
  }),
});

export type PublicResourcePreviewResponse = z.infer<
  typeof publicResourcePreviewResponseSchema
>;
