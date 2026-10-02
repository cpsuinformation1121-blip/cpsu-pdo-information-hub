import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getR2Config } from "../config/r2.ts";
import { createR2Client } from "./r2Client.ts";
import { isR2NotFound } from "./r2Errors.ts";

type RuntimeSchema<Data> = {
  parse: (value: unknown) => Data;
};

type JsonResourceStoreOptions<Data> = {
  key: string;
  defaults: Data;
  schema: RuntimeSchema<Data>;
  invalidBodyMessage: string;
};

async function readObjectBody(body: unknown, invalidBodyMessage: string) {
  if (
    body &&
    typeof body === "object" &&
    "transformToString" in body &&
    typeof body.transformToString === "function"
  )
    return body.transformToString();

  throw new Error(invalidBodyMessage);
}

export function createR2JsonResourceStore<Data>(
  options: JsonResourceStoreOptions<Data>,
) {
  function createWriteCommand(bucketName: string, data: Data, revision?: string) {
    return new PutObjectCommand({
      Bucket: bucketName,
      Key: options.key,
      Body: JSON.stringify(data),
      ContentType: "application/json",
      CacheControl: "no-store",
      ...(revision === "missing" ? { IfNoneMatch: "*" } : revision ? { IfMatch: revision } : {}),
    });
  }

  async function readSnapshot(environment: NodeJS.ProcessEnv = process.env) {
    const config = getR2Config(environment);

    try {
      const object = await createR2Client(config).send(
        new GetObjectCommand({
          Bucket: config.bucketName,
          Key: options.key,
        }),
      );
      const body = await readObjectBody(
        object.Body,
        options.invalidBodyMessage,
      );
      return { data: options.schema.parse(JSON.parse(body)), revision: object.ETag ?? "missing" };
    } catch (error) {
      if (isR2NotFound(error)) return { data: structuredClone(options.defaults), revision: "missing" };
      throw error;
    }
  }

  async function write(
    payload: unknown,
    environment: NodeJS.ProcessEnv = process.env,
  ) {
    const data = options.schema.parse(payload);
    const config = getR2Config(environment);
    await createR2Client(config).send(
      createWriteCommand(config.bucketName, data),
    );
    return data;
  }

  async function read(environment: NodeJS.ProcessEnv = process.env) {
    return (await readSnapshot(environment)).data;
  }
  async function writeSnapshot(payload: unknown, environment: NodeJS.ProcessEnv = process.env, revision: string) {
    const data = options.schema.parse(payload);
    const config = getR2Config(environment);
    const object = await createR2Client(config).send(createWriteCommand(config.bucketName, data, revision));
    if (!object.ETag) throw new Error("The report revision is unavailable.");
    return { data, revision: object.ETag };
  }
  return { createWriteCommand, read, write, readSnapshot, writeSnapshot };
}
