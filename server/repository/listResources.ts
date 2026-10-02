import { groupResourcesByYear } from "../../src/utils/groupResourcesByYear.ts";
import { resourceDisplayNameSchema } from "../../src/contracts/adminOperations.ts";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import {
  adminResourceSchema,
  publicResourceSchema,
  type AdminResource,
  type AdminResourceListResponse,
  type PublicResource,
  type PublicResourceListResponse,
  type ResourceQuery,
} from "../../src/contracts/resource.ts";
import { repositoryCategoryById } from "../../src/config/repository.ts";
import { getR2Config, type R2Config } from "../config/r2.ts";
import { InvalidResourceObjectKeyError, parseResourceObjectKey } from "./parseResourceObjectKey.ts";
import {
  createR2Client,
  createR2ObjectLister,
  type ListR2Objects,
  type R2ObjectSummary,
} from "./r2Client.ts";
import { readCachedPublicRepositoryStructure, readRepositoryStructure } from "./repositoryStructureStore.ts";
import { repositorySections } from "../../src/config/repository.ts";
import { createPublicResourceId, decodePublicResourceId } from "./publicResourceId.ts";
import { isR2NotFound } from "./r2Errors.ts";
type StructureSection = {
  id: string;
  title: string;
  categories: readonly { id: string; title: string }[];
};

const r2PageSize = 1000;
const maximumListedObjects = 10_000;
const publicListCacheLifetimeMs = 60_000;
const publicListCache = new Map<string, { expiresAt: number; value: Promise<R2ObjectSummary[]> }>();

export function invalidatePublicResourceCache() {
  publicListCache.clear();
}

export class InvalidResourceCursorError extends Error {
  constructor() {
    super("The repository cursor is invalid.");
    this.name = "InvalidResourceCursorError";
  }
}

export type ListResourcesDependencies = {
  environment?: NodeJS.ProcessEnv;
  config?: R2Config;
  listObjects?: ListR2Objects;
  structure?: readonly StructureSection[];
  headObject?: (bucket: string, key: string) => Promise<{ ContentLength?: number; LastModified?: Date; Metadata?: Record<string, string> }>;
};

function getListPrefix(query: ResourceQuery): string | undefined {
  if (query.section && query.category)
    return `${query.section}/${query.category}/`;
  if (query.section) return `${query.section}/`;

  if (query.category) {
    const category = repositoryCategoryById.get(query.category);
    return category ? `${category.sectionId}/${category.id}/` : undefined;
  }

  return undefined;
}

async function getAllObjectSummaries(
  bucketName: string,
  prefix: string | undefined,
  listObjects: ListR2Objects,
): Promise<R2ObjectSummary[]> {
  const objects: R2ObjectSummary[] = [];
  let continuationToken: string | undefined;
  const continuationTokens = new Set<string>();

  do {
    const page = await listObjects({
      Bucket: bucketName,
      ContinuationToken: continuationToken,
      MaxKeys: r2PageSize,
      Prefix: prefix,
    });

    objects.push(...(page.Contents ?? []));
    if (objects.length > maximumListedObjects) {
      throw new Error(
        "The repository listing exceeds the supported Version 1 limit.",
      );
    }

    continuationToken = page.IsTruncated
      ? page.NextContinuationToken
      : undefined;
    if (page.IsTruncated && (!continuationToken || continuationTokens.has(continuationToken))) {
      throw new Error(
        "The repository returned an incomplete pagination response.",
      );
    }
    if (continuationToken) continuationTokens.add(continuationToken);
  } while (continuationToken);

  return objects;
}

function getCachedPublicObjectSummaries(
  config: R2Config,
  prefix: string | undefined,
  listObjects: ListR2Objects,
) {
  const cacheKey = JSON.stringify([config.accountId, config.bucketName, prefix]);
  const cached = publicListCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const value = getAllObjectSummaries(config.bucketName, prefix, listObjects);
  publicListCache.set(cacheKey, { expiresAt: Date.now() + publicListCacheLifetimeMs, value });
  if (publicListCache.size > 32) {
    publicListCache.delete(publicListCache.keys().next().value!);
  }
  void value.catch(() => {
    if (publicListCache.get(cacheKey)?.value === value) publicListCache.delete(cacheKey);
  });
  return value;
}

function readDisplayName(metadata: Record<string, string> | undefined): string | undefined {
  try {
    const encoded = metadata?.["display-name"];
    if (!encoded) return undefined;
    const result = resourceDisplayNameSchema.safeParse(decodeURIComponent(encoded));
    return result.success ? result.data : undefined;
  } catch { return undefined; }
}

function mapObjectToResource(
  object: R2ObjectSummary,
  structure: readonly StructureSection[],
  config: R2Config,
): AdminResource | null {
  if (!object.Key || object.Size === undefined || !object.LastModified)
    return null;

  try {
    const parsedKey = parseResourceObjectKey(object.Key, structure);

    return adminResourceSchema.parse({
      id: createPublicResourceId(parsedKey.key, config),
      key: parsedKey.key,
      filename: parsedKey.filename,
      displayName: readDisplayName(object.Metadata) ?? parsedKey.displayName,
      sectionId: parsedKey.sectionId,
      categoryId: parsedKey.categoryId,
      year: parsedKey.year,
      fileType: parsedKey.fileType,
      mimeType: parsedKey.mimeType,
      fileSize: object.Size,
      uploadedAt: object.LastModified.toISOString(),
    });
  } catch {
    return null;
  }
}

function matchesQuery(resource: AdminResource, query: ResourceQuery): boolean {
  if (query.section && resource.sectionId !== query.section) return false;
  if (query.category && resource.categoryId !== query.category) return false;
  if (query.year && resource.year !== query.year) return false;
  if (query.fileType && resource.fileType !== query.fileType) return false;

  if (query.q) {
    const searchValue = query.q.toLocaleLowerCase();
    const searchableText = [
      resource.filename,
      resource.displayName,
      resource.sectionId,
      resource.categoryId,
      String(resource.year),
      resource.fileType,
    ]
      .join(" ")
      .toLocaleLowerCase();

    if (!searchableText.includes(searchValue)) return false;
  }

  return true;
}

function compareByKey(left: AdminResource, right: AdminResource): number {
  return left.key.localeCompare(right.key);
}

function sortResources(
  resources: AdminResource[],
  sort: ResourceQuery["sort"],
): AdminResource[] {
  return resources.sort((left, right) => {
    let comparison = 0;

    switch (sort) {
      case "oldest":
        comparison = left.uploadedAt.localeCompare(right.uploadedAt);
        break;
      case "name-asc":
        comparison = left.displayName.localeCompare(right.displayName);
        break;
      case "name-desc":
        comparison = right.displayName.localeCompare(left.displayName);
        break;
      case "file-size":
        comparison = right.fileSize - left.fileSize;
        break;
      case "file-type":
        comparison = left.fileType.localeCompare(right.fileType);
        break;
      case "newest":
        comparison = right.uploadedAt.localeCompare(left.uploadedAt);
        break;
    }

    return comparison || compareByKey(left, right);
  });
}

function decodeCursor(cursor: string | undefined): number {
  if (!cursor) return 0;

  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    if (!/^\d+$/u.test(decoded)) throw new InvalidResourceCursorError();

    const offset = Number(decoded);
    if (!Number.isSafeInteger(offset) || offset < 0)
      throw new InvalidResourceCursorError();
    return offset;
  } catch (error) {
    if (error instanceof InvalidResourceCursorError) throw error;
    throw new InvalidResourceCursorError();
  }
}

function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), "utf8").toString("base64url");
}

async function listResourceRecords(
  query: ResourceQuery,
  dependencies: ListResourcesDependencies = {},
  usePublicCache = false,
): Promise<AdminResourceListResponse> {
  const config = dependencies.config ?? getR2Config(dependencies.environment);
  const structure =
    dependencies.structure ??
    (dependencies.listObjects
      ? repositorySections
      : await (usePublicCache
          ? readCachedPublicRepositoryStructure(dependencies.environment)
          : readRepositoryStructure(dependencies.environment)));
  const client = createR2Client(config);
  const rawListObjects = dependencies.listObjects ?? createR2ObjectLister(client);
  const headObject = dependencies.headObject ?? (dependencies.listObjects
    ? undefined
    : (bucket: string, key: string) => client.send(new HeadObjectCommand({ Bucket: bucket, Key: key })));
  const listObjects: ListR2Objects = async (input) => {
    const page = await rawListObjects(input);
    if (!headObject) return page;
    const objects = page.Contents ?? [];
    // Bound concurrent metadata reads and reuse the existing public listing cache.
    for (let offset = 0; offset < objects.length; offset += 10) {
      await Promise.all(objects.slice(offset, offset + 10).map(async (object) => {
        if (!object.Key || !mapObjectToResource(object, structure, config)) return;
        try {
          const head = await headObject(config.bucketName, object.Key);
          object.Metadata = head.Metadata;
        } catch (error) {
          if (!isR2NotFound(error)) throw error;
          object.Key = undefined;
        }
      }));
    }
    return page;
  };
  const prefix = getListPrefix(query);
  const objectSummaries = await (usePublicCache && !dependencies.listObjects
    ? getCachedPublicObjectSummaries(config, prefix, listObjects)
    : getAllObjectSummaries(config.bucketName, prefix, listObjects));
  const resources = sortResources(
    objectSummaries
      .map((object) => mapObjectToResource(object, structure, config))
      .filter((resource): resource is AdminResource => resource !== null)
      .filter((resource) => matchesQuery(resource, query)),
    query.sort,
  );
  const offset = decodeCursor(query.cursor);
  const groups = query.groupBy === "year" ? groupResourcesByYear(resources) : undefined;
  const pageGroups = groups?.slice(offset, offset + query.limit);
  const data = pageGroups ? pageGroups.flatMap((group) => group.resources) : resources.slice(offset, offset + query.limit);
  const nextOffset = offset + (pageGroups ? pageGroups.length : data.length);

  return {
    data,
    meta: {
      total: resources.length,
      ...(groups ? { groupTotal: groups.length } : {}),
      nextCursor:
        nextOffset < (groups?.length ?? resources.length) ? encodeCursor(nextOffset) : null,
    },
  };
}

export async function listAdminResources(
  query: ResourceQuery,
  dependencies: ListResourcesDependencies = {},
): Promise<AdminResourceListResponse> {
  return listResourceRecords(query, dependencies);
}

export async function findResourceByPublicId(
  id: string,
  dependencies: ListResourcesDependencies = {},
): Promise<AdminResource | null> {
  const config = dependencies.config ?? getR2Config(dependencies.environment);
  const key = decodePublicResourceId(id, config);
  if (!key) return null;
  const structure =
    dependencies.structure ??
    (dependencies.headObject
      ? repositorySections
      : await readCachedPublicRepositoryStructure(dependencies.environment));
  try {
    parseResourceObjectKey(key, structure);
    const headObject = dependencies.headObject ??
      (async (bucket: string, objectKey: string) =>
        createR2Client(config).send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey })));
    const object = await headObject(config.bucketName, key);
    return mapObjectToResource({ Key: key, Size: object.ContentLength, LastModified: object.LastModified, Metadata: object.Metadata }, structure, config);
  } catch (error) {
    if (isR2NotFound(error) || error instanceof InvalidResourceObjectKeyError) return null;
    throw error;
  }
}

export async function listResources(
  query: ResourceQuery,
  dependencies: ListResourcesDependencies = {},
): Promise<PublicResourceListResponse> {
  const result = await listResourceRecords(query, dependencies, true);
  return {
    data: result.data.map((resource): PublicResource =>
      publicResourceSchema.parse(resource),
    ),
    meta: result.meta,
  };
}
