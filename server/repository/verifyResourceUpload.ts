import { hasResourceFileSignature } from "../../src/utils/hasResourceFileSignature.ts";
import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import {
  resourceUploadFileDefinitions,
  type ResourceUploadCompletionRequest,
  type ResourceUploadFileExtension,
} from "../../src/contracts/resourceUpload.ts";
import { getR2Config, type R2Config } from "../config/r2.ts";
import { createR2Client } from "./r2Client.ts";
import { parseResourceObjectKey } from "./parseResourceObjectKey.ts";
import { readRepositoryStructure } from "./repositoryStructureStore.ts";
import { repositorySections } from "../../src/config/repository.ts";

type StructureSection = {
  id: string;
  title: string;
  categories: readonly { id: string; title: string }[];
};

type UploadedObject = {
  ContentLength?: number;
  ContentType?: string;
  LastModified?: Date;
  ETag?: string;
};
type VerificationDependencies = {
  environment?: NodeJS.ProcessEnv;
  config?: R2Config;
  readPrefix?: (bucket: string, key: string, etag?: string) => Promise<Uint8Array>;
  headObject?: (bucket: string, key: string) => Promise<UploadedObject>;
  structure?: readonly StructureSection[];
};

export class ResourceUploadVerificationError extends Error {}

export async function verifyResourceUpload(
  input: ResourceUploadCompletionRequest,
  dependencies: VerificationDependencies = {},
) {
  const structure =
    dependencies.structure ??
    (dependencies.environment
      ? await readRepositoryStructure(dependencies.environment)
      : repositorySections);
  const parsedKey = parseResourceObjectKey(input.key, structure);
  const uploadDefinition =
    resourceUploadFileDefinitions[
      parsedKey.extension as ResourceUploadFileExtension
    ];
  if (!uploadDefinition) {
    throw new ResourceUploadVerificationError(
      "Only PDF documents and images can be uploaded.",
    );
  }
  if (
    uploadDefinition.mimeType !== input.mimeType ||
    parsedKey.mimeType !== input.mimeType
  ) {
    throw new ResourceUploadVerificationError(
      "The uploaded content type does not match the repository key.",
    );
  }
  const config = dependencies.config ?? getR2Config(dependencies.environment);
  const client = createR2Client(config);
  const headObject =
    dependencies.headObject ??
    (async (bucket, key) =>
      client.send(new HeadObjectCommand({ Bucket: bucket, Key: key })));
  let object: UploadedObject;
  try {
    object = await headObject(config.bucketName, parsedKey.key);
  } catch {
    throw new ResourceUploadVerificationError(
      "The uploaded object could not be found in the repository.",
    );
  }

  if (object.ContentLength !== input.fileSize)
    throw new ResourceUploadVerificationError(
      "The uploaded file size does not match the authorized size.",
    );
  if (object.ContentType !== input.mimeType)
    throw new ResourceUploadVerificationError(
      "The uploaded object content type is invalid.",
    );
  if (!object.LastModified)
    throw new ResourceUploadVerificationError(
      "The repository did not provide an upload timestamp.",
    );
  const readPrefix = dependencies.readPrefix ?? (async (bucket, key, etag) => {
    const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key, Range: "bytes=0-11", IfMatch: etag }));
    if (!response.Body) throw new ResourceUploadVerificationError("The uploaded file contents could not be verified.");
    return response.Body.transformToByteArray();
  });
  let bytes: Uint8Array;
  try { bytes = await readPrefix(config.bucketName, parsedKey.key, object.ETag); }
  catch { throw new ResourceUploadVerificationError("The uploaded file contents could not be verified. Please try again."); }
  if (!hasResourceFileSignature(bytes, parsedKey.extension)) {
    throw new ResourceUploadVerificationError("The uploaded file contents do not match the selected file type.");
  }
  return {
    key: parsedKey.key,
    mimeType: object.ContentType,
    fileSize: object.ContentLength,
    uploadedAt: object.LastModified.toISOString(),
  };
}
