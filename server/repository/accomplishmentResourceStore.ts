import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  accomplishmentResourceDataSchema,
  type AccomplishmentResourceData,
} from "../../src/contracts/accomplishmentResource.ts";
import { getR2Config } from "../config/r2.ts";
import { createR2Client } from "./r2Client.ts";
import { isR2NotFound } from "./r2Errors.ts";

const key = "_system/accomplishment-resource.json";
const defaults: AccomplishmentResourceData = {
  version: 2,
  nodes: [],
  entries: {},
  chartType: "column",
};

async function readBody(body: unknown) {
  if (
    body &&
    typeof body === "object" &&
    "transformToString" in body &&
    typeof body.transformToString === "function"
  )
    return body.transformToString();
  throw new Error("Invalid accomplishment resource body.");
}

export async function readAccomplishmentResource(
  environment: NodeJS.ProcessEnv = process.env,
) {
  const config = getR2Config(environment);
  try {
    const object = await createR2Client(config).send(
      new GetObjectCommand({ Bucket: config.bucketName, Key: key }),
    );
    return accomplishmentResourceDataSchema.parse(
      JSON.parse(await readBody(object.Body)),
    );
  } catch (error) {
    if (isR2NotFound(error)) return structuredClone(defaults);
    throw error;
  }
}

export function createAccomplishmentResourceWriteCommand(
  bucketName: string,
  data: AccomplishmentResourceData,
) {
  return new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: JSON.stringify(data),
    ContentType: "application/json",
    CacheControl: "no-store",
  });
}

export async function writeAccomplishmentResource(
  payload: unknown,
  environment: NodeJS.ProcessEnv = process.env,
) {
  const data = accomplishmentResourceDataSchema.parse(payload);
  const config = getR2Config(environment);
  await createR2Client(config).send(
    createAccomplishmentResourceWriteCommand(config.bucketName, data),
  );
  return data;
}
