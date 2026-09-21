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
  function createWriteCommand(bucketName: string, data: Data) {
    return new PutObjectCommand({
      Bucket: bucketName,
      Key: options.key,
      Body: JSON.stringify(data),
      ContentType: "application/json",
      CacheControl: "no-store",
    });
  }

  async function read(environment: NodeJS.ProcessEnv = process.env) {
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
      return options.schema.parse(JSON.parse(body));
    } catch (error) {
      if (isR2NotFound(error)) return structuredClone(options.defaults);
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

  return { createWriteCommand, read, write };
}
