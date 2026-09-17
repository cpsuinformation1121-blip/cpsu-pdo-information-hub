import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { publicResourcePreviewRequestSchema } from "../../src/contracts/publicResourcePreview.ts";
import { getR2Config, type R2Config } from "../config/r2.ts";
import {
  findResourceByPublicId,
  type ListResourcesDependencies,
} from "../repository/listResources.ts";
import { createR2Client } from "../repository/r2Client.ts";

const previewLifetimeSeconds = 60;
const headers = {
  "cache-control": "private, no-store",
  "content-type": "application/json; charset=utf-8",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });

type PreviewResource = NonNullable<
  Awaited<ReturnType<typeof findResourceByPublicId>>
>;

type PublicResourcePreviewDependencies = ListResourcesDependencies & {
  config?: R2Config;
  findResource?: (
    id: string,
    dependencies: ListResourcesDependencies,
  ) => Promise<PreviewResource | null>;
  now?: () => Date;
  sign?: (command: GetObjectCommand, expiresIn: number) => Promise<string>;
};

function inlineContentDisposition(filename: string) {
  const utf8Prefix = "UTF-8" + String.fromCharCode(39, 39);
  return "inline; filename*=" + utf8Prefix + encodeURIComponent(filename);
}

export async function handlePublicResourcePreviewRequest(
  request: Request,
  dependencies: PublicResourcePreviewDependencies = {},
) {
  if (request.method !== "POST") {
    return json(
      {
        error: {
          code: "METHOD_NOT_ALLOWED",
          message: "Only POST is supported.",
        },
      },
      405,
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json(
      {
        error: {
          code: "INVALID_REQUEST",
          message: "The request body must be valid JSON.",
        },
      },
      400,
    );
  }

  const result = publicResourcePreviewRequestSchema.safeParse(payload);
  if (!result.success) {
    return json(
      {
        error: {
          code: "INVALID_REQUEST",
          message: "The preview request is invalid.",
        },
      },
      400,
    );
  }

  try {
    const findResource = dependencies.findResource ?? findResourceByPublicId;
    const resource = await findResource(result.data.id, dependencies);

    if (!resource) {
      return json(
        {
          error: {
            code: "RESOURCE_NOT_FOUND",
            message: "The requested resource could not be found.",
          },
        },
        404,
      );
    }

    if (resource.fileType === "xlsx" || resource.fileType === "link") {
      return json(
        {
          error: {
            code: "RESOURCE_NOT_PREVIEWABLE",
            message: "Online file preview is not available for this resource.",
          },
        },
        400,
      );
    }

    const config = dependencies.config ?? getR2Config(dependencies.environment);
    const command = new GetObjectCommand({
      Bucket: config.bucketName,
      Key: resource.key,
      ResponseCacheControl: "private, no-store",
      ResponseContentDisposition: inlineContentDisposition(resource.filename),
      ResponseContentType: resource.mimeType,
    });
    const url = dependencies.sign
      ? await dependencies.sign(command, previewLifetimeSeconds)
      : await getSignedUrl(createR2Client(config), command, {
          expiresIn: previewLifetimeSeconds,
        });
    const now = dependencies.now?.() ?? new Date();

    return json({
      data: {
        url,
        expiresAt: new Date(
          now.getTime() + previewLifetimeSeconds * 1_000,
        ).toISOString(),
      },
    });
  } catch {
    return json(
      {
        error: {
          code: "PREVIEW_UNAVAILABLE",
          message: "The file preview could not be opened. Please try again.",
        },
      },
      503,
    );
  }
}
