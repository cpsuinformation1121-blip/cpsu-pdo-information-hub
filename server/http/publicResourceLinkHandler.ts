import { GetObjectCommand } from "@aws-sdk/client-s3";
import { publicResourceIdSchema } from "../../src/contracts/publicResourcePreview.ts";
import {
  maximumResourceLinkPayloadSize,
  resourceLinkPayloadSchema,
} from "../../src/contracts/resourceLink.ts";
import { getR2Config, type R2Config } from "../config/r2.ts";
import {
  findResourceByPublicId,
  type ListResourcesDependencies,
} from "../repository/listResources.ts";
import { createR2Client } from "../repository/r2Client.ts";

type PublicResourceLinkDependencies = ListResourcesDependencies & {
  config?: R2Config;
  findResource?: typeof findResourceByPublicId;
  readLink?: (bucket: string, key: string) => Promise<string>;
};

const responseHeaders = {
  "cache-control": "private, no-store",
  "referrer-policy": "no-referrer",
  "x-robots-tag": "noindex, nofollow",
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...responseHeaders,
      "content-type": "application/json; charset=utf-8",
    },
  });
}

export async function handlePublicResourceLinkRequest(
  request: Request,
  dependencies: PublicResourceLinkDependencies = {},
) {
  if (request.method !== "GET") {
    return json(
      { error: { code: "METHOD_NOT_ALLOWED", message: "Only GET is supported." } },
      405,
    );
  }

  const idResult = publicResourceIdSchema.safeParse(
    new URL(request.url).searchParams.get("id"),
  );
  if (!idResult.success) {
    return json(
      { error: { code: "INVALID_REQUEST", message: "The link request is invalid." } },
      400,
    );
  }

  try {
    const findResource = dependencies.findResource ?? findResourceByPublicId;
    const resource = await findResource(idResult.data, dependencies);
    if (!resource) {
      return json(
        { error: { code: "RESOURCE_NOT_FOUND", message: "The requested link could not be found." } },
        404,
      );
    }
    if (resource.fileType !== "link" || resource.fileSize > maximumResourceLinkPayloadSize) {
      return json(
        { error: { code: "RESOURCE_NOT_LINK", message: "The requested resource is not a public link." } },
        400,
      );
    }

    const config = dependencies.config ?? getR2Config(dependencies.environment);
    const readLink = dependencies.readLink ?? (async (bucket, key) => {
      const result = await createR2Client(config).send(
        new GetObjectCommand({ Bucket: bucket, Key: key }),
      );
      if (!result.Body) throw new Error("The link resource is empty.");
      return result.Body.transformToString("utf-8");
    });
    const rawPayload = await readLink(config.bucketName, resource.key);
    if (Buffer.byteLength(rawPayload, "utf8") > maximumResourceLinkPayloadSize) {
      throw new Error("The link resource is too large.");
    }
    const payload = resourceLinkPayloadSchema.parse(JSON.parse(rawPayload));

    return new Response(null, {
      status: 302,
      headers: { ...responseHeaders, location: payload.url },
    });
  } catch {
    return json(
      { error: { code: "LINK_UNAVAILABLE", message: "The link could not be opened. Please try again." } },
      503,
    );
  }
}