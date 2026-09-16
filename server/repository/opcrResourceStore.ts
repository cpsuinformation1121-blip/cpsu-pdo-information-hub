import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  opcrResourceDataSchema,
  type OpcrResourceData,
} from "../../src/contracts/opcrResource.ts";
import { getR2Config } from "../config/r2.ts";
import { createR2Client } from "./r2Client.ts";
import { isR2NotFound } from "./r2Errors.ts";

const key = "_system/opcr-resource.json";
const defaults: OpcrResourceData = {
  version: 1,
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
  throw new Error("Invalid OPCR resource body.");
}

export async function readOpcrResource(
  environment: NodeJS.ProcessEnv = process.env,
) {
  const config = getR2Config(environment);
  try {
    const object = await createR2Client(config).send(
      new GetObjectCommand({ Bucket: config.bucketName, Key: key }),
    );
    return opcrResourceDataSchema.parse(
      JSON.parse(await readBody(object.Body)),
    );
  } catch (error) {
    if (isR2NotFound(error)) return structuredClone(defaults);
    throw error;
  }
}

export function createOpcrResourceWriteCommand(
  bucketName: string,
  data: OpcrResourceData,
) {
  return new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: JSON.stringify(data),
    ContentType: "application/json",
    CacheControl: "no-store",
  });
}

export async function writeOpcrResource(
  payload: unknown,
  environment: NodeJS.ProcessEnv = process.env,
) {
  const data = opcrResourceDataSchema.parse(payload);
  const config = getR2Config(environment);
  await createR2Client(config).send(
    createOpcrResourceWriteCommand(config.bucketName, data),
  );
  return data;
}
