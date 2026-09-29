// server/http/adminResourceAccessHandler.ts
import { GetObjectCommand as GetObjectCommand2 } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// src/contracts/adminResourceAccess.ts
import { z as z3 } from "zod";

// src/contracts/resource.ts
import { z as z2 } from "zod";

// src/contracts/publicResourcePreview.ts
import { z } from "zod";
var publicResourceIdSchema = z.string().regex(/^(?:[A-Za-z0-9_-]{43}|v1_[A-Za-z0-9_-]{40,6000})$/u);
var publicResourcePreviewRequestSchema = z.object({
  id: publicResourceIdSchema
});
var publicResourcePreviewResponseSchema = z.object({
  data: z.object({
    url: z.url(),
    expiresAt: z.iso.datetime({ offset: true })
  })
});

// src/contracts/resource.ts
var resourceFileTypes = ["pdf", "xlsx", "image", "link"];
var resourceFileDefinitions = {
  pdf: { fileType: "pdf", mimeType: "application/pdf" },
  xlsx: {
    fileType: "xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  },
  jpg: { fileType: "image", mimeType: "image/jpeg" },
  jpeg: { fileType: "image", mimeType: "image/jpeg" },
  png: { fileType: "image", mimeType: "image/png" },
  webp: { fileType: "image", mimeType: "image/webp" },
  link: {
    fileType: "link",
    mimeType: "application/vnd.cpsu.repository-link+json"
  }
};
var resourceSortOptions = [
  "newest",
  "oldest",
  "name-asc",
  "name-desc",
  "file-size",
  "file-type"
];
var schoolYearSchema = z2.string().regex(/^\d{4}-\d{4}$/u, "Select a valid school year.").refine(
  (value) => Number(value.slice(5)) === Number(value.slice(0, 4)) + 1,
  "Select a valid school year."
);
var resourceYearSchema = z2.union([
  z2.number().int().min(1900).max(2200),
  schoolYearSchema
]);
var repositorySectionIdSchema = z2.string().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u);
var resourceFileTypeSchema = z2.enum(resourceFileTypes);
var resourceSortSchema = z2.enum(resourceSortOptions);
var resourceObjectKeySchema = z2.string().min(1).max(1024).refine(
  (key2) => !key2.startsWith("/") && !key2.includes("..") && !key2.includes("\\"),
  {
    message: "Resource keys must use safe R2-style prefixes."
  }
);
var resourceFilenameSchema = z2.string().min(1).max(180).refine(
  (filename) => filename === filename.normalize("NFKC") && filename !== "." && filename !== ".." && !/[. ]$/u.test(filename) && !filename.includes("/") && !filename.includes("\\") && !/[\p{Cc}\p{Cf}]/u.test(filename) && !/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu.test(filename),
  {
    message: "Filename contains unsupported characters."
  }
);
var resourceMetadataSchema = z2.object({
  id: publicResourceIdSchema,
  filename: resourceFilenameSchema,
  displayName: z2.string().min(1).max(200),
  sectionId: repositorySectionIdSchema,
  categoryId: z2.string().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u).optional(),
  year: resourceYearSchema,
  fileType: resourceFileTypeSchema,
  mimeType: z2.string().min(1).max(120),
  fileSize: z2.number().int().nonnegative(),
  uploadedAt: z2.iso.datetime({ offset: true })
}).superRefine((resource, context) => {
  const extension = resource.filename.split(".").pop()?.toLowerCase();
  const definition = extension ? resourceFileDefinitions[extension] : void 0;
  if (!definition || definition.fileType !== resource.fileType) {
    context.addIssue({
      code: "custom",
      path: ["fileType"],
      message: "File type does not match the supported filename extension."
    });
  }
  if (!definition || definition.mimeType !== resource.mimeType) {
    context.addIssue({
      code: "custom",
      path: ["mimeType"],
      message: "MIME type does not match the supported filename extension."
    });
  }
});
var publicResourceSchema = resourceMetadataSchema;
var adminResourceSchema = resourceMetadataSchema.safeExtend({
  key: resourceObjectKeySchema
});
var resourceQuerySchema = z2.object({
  q: z2.string().trim().max(100).optional(),
  section: repositorySectionIdSchema.optional(),
  category: z2.string().trim().max(80).optional(),
  year: z2.union([z2.coerce.number().int().min(1900).max(2200), schoolYearSchema]).optional(),
  fileType: resourceFileTypeSchema.optional(),
  sort: resourceSortSchema.default("newest"),
  cursor: z2.string().trim().max(512).optional(),
  limit: z2.coerce.number().int().min(1).max(100).default(50)
});
var resourceListMetaSchema = z2.object({
  total: z2.number().int().nonnegative(),
  nextCursor: z2.string().nullable()
});
var publicResourceListResponseSchema = z2.object({
  data: z2.array(publicResourceSchema),
  meta: resourceListMetaSchema
});
var adminResourceListResponseSchema = z2.object({
  data: z2.array(adminResourceSchema),
  meta: resourceListMetaSchema
});
var apiErrorResponseSchema = z2.object({
  error: z2.object({
    code: z2.string(),
    message: z2.string(),
    details: z2.array(z2.object({ field: z2.string(), message: z2.string() })).optional()
  })
});

// src/contracts/adminResourceAccess.ts
var adminResourceAccessModeSchema = z3.enum(["preview", "download"]);
var adminResourceAccessRequestSchema = z3.object({
  key: resourceObjectKeySchema,
  mode: adminResourceAccessModeSchema
});
var adminResourceAccessResponseSchema = z3.object({
  data: z3.object({
    url: z3.url(),
    expiresAt: z3.iso.datetime({ offset: true })
  })
});

// server/auth/bearerToken.ts
var bearerTokenPattern = /^Bearer ([^\s,]+)$/u;
var maximumTokenLength = 8192;
function parseBearerToken(authorizationHeader) {
  if (!authorizationHeader || authorizationHeader.length > maximumTokenLength) return null;
  return bearerTokenPattern.exec(authorizationHeader)?.[1] ?? null;
}

// server/auth/verifyFirebaseIdToken.ts
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// server/config/firebaseAdmin.ts
import { z as z4 } from "zod";
var firebaseAdminEnvironmentSchema = z4.object({
  FIREBASE_ADMIN_PROJECT_ID: z4.string().trim().min(1),
  FIREBASE_ADMIN_CLIENT_EMAIL: z4.string().trim().email(),
  FIREBASE_ADMIN_PRIVATE_KEY: z4.string().trim().min(1)
});
var FirebaseAdminConfigurationError = class extends Error {
  constructor() {
    super("Firebase Admin server configuration is incomplete or invalid.");
    this.name = "FirebaseAdminConfigurationError";
  }
};
function getFirebaseAdminConfig(environment = process.env) {
  const result = firebaseAdminEnvironmentSchema.safeParse(environment);
  if (!result.success) throw new FirebaseAdminConfigurationError();
  return {
    projectId: result.data.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: result.data.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: result.data.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/gu, "\n")
  };
}

// server/auth/verifyFirebaseIdToken.ts
var firebaseAdminAppName = "cpsu-pdo-server";
function getFirebaseAdminApp(config) {
  const existingApp = getApps().find((app) => app.name === firebaseAdminAppName);
  if (existingApp) return getApp(firebaseAdminAppName);
  return initializeApp(
    {
      credential: cert({
        projectId: config.projectId,
        clientEmail: config.clientEmail,
        privateKey: config.privateKey
      }),
      projectId: config.projectId
    },
    firebaseAdminAppName
  );
}
async function verifyFirebaseIdToken(token, environment = process.env) {
  const app = getFirebaseAdminApp(getFirebaseAdminConfig(environment));
  return getAuth(app).verifyIdToken(token, true);
}

// server/auth/authenticateAdminRequest.ts
var AdminAuthenticationError = class extends Error {
  constructor() {
    super("The administrator session is invalid or expired.");
    this.name = "AdminAuthenticationError";
  }
};
var AdminAuthorizationError = class extends Error {
  constructor() {
    super("This account does not have administrator access.");
    this.name = "AdminAuthorizationError";
  }
};
function hasAdministratorAccess(identity, environment = process.env) {
  const bootstrapUid = environment.FIREBASE_BOOTSTRAP_ADMIN_UID?.trim();
  return identity.admin === true || identity.customClaims?.admin === true || Boolean(bootstrapUid && identity.uid === bootstrapUid);
}
async function authenticateAdminRequest(request, dependencies = {}) {
  const token = parseBearerToken(request.headers.get("authorization"));
  if (!token) throw new AdminAuthenticationError();
  let identity;
  try {
    identity = await (dependencies.verifyIdToken ?? verifyFirebaseIdToken)(
      token,
      dependencies.environment
    );
  } catch {
    throw new AdminAuthenticationError();
  }
  if (!hasAdministratorAccess(identity, dependencies.environment ?? process.env)) {
    throw new AdminAuthorizationError();
  }
  return identity;
}

// server/config/r2.ts
import { z as z5 } from "zod";
var serverUrlSchema = z5.url().refine((value) => {
  const url = new URL(value);
  return url.protocol === "https:" || url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
}, "URL must use HTTPS. HTTP is allowed only for local development.");
var optionalServerUrlSchema = z5.preprocess(
  (value) => value === "" ? void 0 : value,
  serverUrlSchema.optional()
);
var r2EnvironmentSchema = z5.object({
  R2_ACCOUNT_ID: z5.string().trim().min(1),
  R2_ACCESS_KEY_ID: z5.string().trim().min(1),
  R2_SECRET_ACCESS_KEY: z5.string().trim().min(1),
  R2_BUCKET_NAME: z5.string().trim().min(1),
  R2_ENDPOINT: optionalServerUrlSchema
});
var R2ConfigurationError = class extends Error {
  constructor() {
    super("Cloudflare R2 server configuration is incomplete or invalid.");
    this.name = "R2ConfigurationError";
  }
};
function getR2Config(environment = process.env) {
  const result = r2EnvironmentSchema.safeParse(environment);
  if (!result.success) throw new R2ConfigurationError();
  const endpoint = result.data.R2_ENDPOINT ?? `https://${result.data.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const production = environment.VERCEL_ENV === "production" || environment.NODE_ENV === "production";
  if (production && new URL(endpoint).protocol !== "https:") {
    throw new R2ConfigurationError();
  }
  return {
    accountId: result.data.R2_ACCOUNT_ID,
    accessKeyId: result.data.R2_ACCESS_KEY_ID,
    secretAccessKey: result.data.R2_SECRET_ACCESS_KEY,
    bucketName: result.data.R2_BUCKET_NAME,
    endpoint
  };
}

// server/repository/r2Client.ts
import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
function createR2Client(config) {
  return new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    }
  });
}
function createR2ObjectLister(client) {
  return async (input) => client.send(new ListObjectsV2Command(input));
}

// src/config/repository.ts
var repositorySections = [
  {
    id: "statistical-profile",
    code: "A",
    title: "Statistical Profile",
    description: "Institutional population, student profile, and human resource records.",
    path: "/repository?section=statistical-profile",
    categories: [
      { id: "student-population", title: "Student Population" },
      { id: "student-profile", title: "Student Profile" },
      { id: "human-resources", title: "Human Resources" },
      { id: "faculty-to-student-ratio", title: "Faculty-to-Student Ratio" }
    ]
  },
  {
    id: "higher-education-performance",
    code: "B",
    title: "Higher Education Performance",
    description: "Program compliance, accreditation, licensure, and employability records.",
    path: "/repository?section=higher-education-performance",
    categories: [
      {
        id: "certificate-of-program-compliance",
        title: "Certificate of Program Compliance"
      },
      { id: "accreditation", title: "Accreditation" },
      {
        id: "licensure-examination-performance",
        title: "Licensure Examination Performance"
      },
      { id: "graduate-employability", title: "Graduate Employability" }
    ]
  },
  {
    id: "research-extension",
    code: "C",
    title: "Research & Extension",
    description: "Research and extension resources maintained by the office.",
    path: "/repository?section=research-extension",
    categories: [
      { id: "research", title: "Research" },
      { id: "extension", title: "Extension" }
    ]
  },
  {
    id: "financial-performance",
    code: "D",
    title: "Financial Performance",
    description: "Budget, annual financial, and supporting performance records.",
    path: "/repository?section=financial-performance",
    categories: [
      { id: "financial-performance", title: "Financial Performance" }
    ]
  },
  {
    id: "planning-documents",
    code: "E",
    title: "Planning Documents",
    description: "Institutional plans and related planning records.",
    path: "/repository?section=planning-documents",
    categories: [{ id: "planning-documents", title: "Planning Documents" }]
  },
  {
    id: "other-resources",
    code: "F",
    title: "Other Resources",
    description: "Other published resources maintained by the office.",
    path: "/repository?section=other-resources",
    categories: [{ id: "other-resources", title: "Other Resources" }]
  },
  {
    id: "forms",
    code: "G",
    title: "Forms",
    description: "Official downloadable forms maintained by the office.",
    path: "/repository?section=forms",
    categories: [{ id: "excel", title: "Excel" }]
  }
];
var protectedRepositorySectionIds = /* @__PURE__ */ new Set([
  "forms"
]);
var repositorySectionById = new Map(
  repositorySections.map((section) => [section.id, section])
);
var repositoryCategoryIds = new Set(
  repositorySections.flatMap(
    (section) => section.categories.map((category) => category.id)
  )
);
var repositoryCategoryById = new Map(
  repositorySections.flatMap(
    (section) => section.categories.map(
      (category) => [category.id, { ...category, sectionId: section.id }]
    )
  )
);

// server/repository/parseResourceObjectKey.ts
var repositoryPathSegmentPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
var repositoryYearPattern = /^\d{4}(?:-\d{4})?$/u;
var InvalidResourceObjectKeyError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidResourceObjectKeyError";
  }
};
function invalidKey(message) {
  throw new InvalidResourceObjectKeyError(message);
}
function createFallbackDisplayName(filename) {
  const extensionStart = filename.lastIndexOf(".");
  const nameWithoutExtension = extensionStart > 0 ? filename.slice(0, extensionStart) : filename;
  const normalizedName = nameWithoutExtension.replace(/[-_]+/gu, " ").replace(/\s+/gu, " ").trim();
  if (!normalizedName) invalidKey("The resource filename must include a descriptive name.");
  return normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1);
}
function parseResourceObjectKey(rawKey, sections = repositorySections) {
  const keyResult = resourceObjectKeySchema.safeParse(rawKey);
  if (!keyResult.success) invalidKey("The resource object key is unsafe.");
  const segments = keyResult.data.split("/");
  if (segments.length < 3 || segments.some((segment) => segment.length === 0)) {
    invalidKey("The resource object key does not follow the repository hierarchy.");
  }
  const sectionValue = segments[0];
  const categoryPath = segments.slice(1, -2);
  const categoryId = categoryPath[0];
  const yearValue = segments.at(-2);
  const filenameValue = segments.at(-1);
  const section = sections.find((item) => item.id === sectionValue);
  if (!section) invalidKey("The resource object key uses an unknown repository section.");
  if (categoryPath.some((segment) => !repositoryPathSegmentPattern.test(segment)) || categoryId && !section.categories.some((category) => category.id === categoryId)) {
    invalidKey("The resource object key uses an invalid category hierarchy.");
  }
  if (!yearValue || !repositoryYearPattern.test(yearValue)) {
    invalidKey("The resource object key must contain a valid year or school year.");
  }
  const isSchoolYear = yearValue.includes("-");
  const firstYear = Number(yearValue.slice(0, 4));
  const finalYear = isSchoolYear ? Number(yearValue.slice(5)) : firstYear;
  if (firstYear < 1900 || firstYear > 2200 || finalYear !== firstYear + (isSchoolYear ? 1 : 0)) invalidKey("The resource year is outside the supported range.");
  const year = isSchoolYear ? yearValue : firstYear;
  const filenameResult = resourceFilenameSchema.safeParse(filenameValue);
  if (!filenameResult.success) invalidKey("The resource object key contains an unsafe filename.");
  const extensionValue = filenameResult.data.split(".").pop()?.toLowerCase();
  const definition = extensionValue ? resourceFileDefinitions[extensionValue] : void 0;
  if (!extensionValue || !definition) {
    invalidKey("The resource object key uses an unsupported file extension.");
  }
  return {
    key: keyResult.data,
    filename: filenameResult.data,
    displayName: createFallbackDisplayName(filenameResult.data),
    sectionId: section.id,
    categoryId,
    categoryPath,
    year,
    extension: extensionValue,
    fileType: definition.fileType,
    mimeType: definition.mimeType
  };
}

// server/repository/repositoryStructureStore.ts
import { GetObjectCommand, ListObjectsV2Command as ListObjectsV2Command2, PutObjectCommand } from "@aws-sdk/client-s3";

// src/contracts/repositoryStructure.ts
import { z as z6 } from "zod";
var structureItemIdSchema = z6.string().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u);
var managedCategorySchema = z6.object({
  id: structureItemIdSchema,
  title: z6.string().trim().min(2).max(100)
});
var managedSectionSchema = z6.object({
  id: structureItemIdSchema,
  title: z6.string().trim().min(2).max(100),
  categories: z6.array(managedCategorySchema)
});
var repositoryStructureSchema = z6.object({
  data: z6.array(managedSectionSchema)
});
var structureMutationSchema = z6.discriminatedUnion("action", [
  z6.object({
    action: z6.literal("add-section"),
    title: z6.string().trim().min(2).max(100)
  }),
  z6.object({
    action: z6.literal("rename-section"),
    id: structureItemIdSchema,
    title: z6.string().trim().min(2).max(100)
  }),
  z6.object({ action: z6.literal("delete-section"), id: structureItemIdSchema }),
  z6.object({
    action: z6.literal("add-category"),
    sectionId: structureItemIdSchema,
    title: z6.string().trim().min(2).max(100)
  }),
  z6.object({
    action: z6.literal("rename-category"),
    sectionId: structureItemIdSchema,
    id: structureItemIdSchema,
    title: z6.string().trim().min(2).max(100)
  }),
  z6.object({
    action: z6.literal("delete-category"),
    sectionId: structureItemIdSchema,
    id: structureItemIdSchema
  })
]);

// server/repository/r2Errors.ts
function getR2ErrorStatus(error) {
  if (typeof error !== "object" || error === null || !("$metadata" in error)) {
    return void 0;
  }
  return error.$metadata.httpStatusCode;
}
function isR2NotFound(error) {
  return getR2ErrorStatus(error) === 404 || typeof error === "object" && error !== null && "name" in error && error.name === "NoSuchKey";
}
function isR2PreconditionFailed(error) {
  return getR2ErrorStatus(error) === 412 || typeof error === "object" && error !== null && "name" in error && error.name === "PreconditionFailed";
}

// server/repository/repositoryStructureStore.ts
var key = "_system/repository-structure.json";
var publicStructureCache = /* @__PURE__ */ new Map();
var defaults = repositorySections.map(({ id, title, categories }) => ({
  id,
  title,
  categories: categories.map(({ id: categoryId, title: categoryTitle }) => ({ id: categoryId, title: categoryTitle }))
}));
var requiredSectionIds = ["forms"];
function applyRequiredStructureMigrations(structure) {
  const migrated = structuredClone(structure);
  for (const id of requiredSectionIds) {
    const requiredSection = defaults.find((section) => section.id === id);
    if (!requiredSection) continue;
    const existingSection = migrated.find((section) => section.id === id);
    if (!existingSection) {
      migrated.push(structuredClone(requiredSection));
      continue;
    }
    for (const requiredCategory of requiredSection.categories) {
      if (!existingSection.categories.some(
        (category) => category.id === requiredCategory.id
      )) {
        existingSection.categories.push(structuredClone(requiredCategory));
      }
    }
  }
  return migrated;
}
var RepositoryStructureConflictError = class extends Error {
  constructor() {
    super("The repository organization changed while you were editing it. Refresh the page and try again.");
    this.name = "RepositoryStructureConflictError";
  }
};
function assertRepositorySectionCanBeDeleted(id) {
  if (protectedRepositorySectionIds.has(id)) {
    throw new Error("This required repository section cannot be deleted.");
  }
}
var slug = (value) => value.normalize("NFKD").replace(/[\u0300-\u036f]/gu, "").toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-+|-+$/gu, "").slice(0, 70);
async function bodyText(body) {
  if (body && typeof body === "object" && "transformToString" in body && typeof body.transformToString === "function") {
    return body.transformToString();
  }
  throw new Error("Invalid structure body.");
}
async function readRepositoryStructureSnapshot(environment = process.env) {
  const config = getR2Config(environment);
  const client = createR2Client(config);
  try {
    const object = await client.send(new GetObjectCommand({ Bucket: config.bucketName, Key: key }));
    if (!object.ETag) throw new Error("Repository structure revision is unavailable.");
    return {
      data: applyRequiredStructureMigrations(
        repositoryStructureSchema.parse(JSON.parse(await bodyText(object.Body))).data
      ),
      etag: object.ETag
    };
  } catch (error) {
    if (isR2NotFound(error)) return { data: structuredClone(defaults), etag: null };
    throw error;
  }
}
async function readRepositoryStructure(environment = process.env) {
  return (await readRepositoryStructureSnapshot(environment)).data;
}
function readCachedPublicRepositoryStructure(environment = process.env) {
  const config = getR2Config(environment);
  const cacheKey = `${config.accountId}:${config.bucketName}`;
  const cached = publicStructureCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const value = readRepositoryStructure(environment);
  publicStructureCache.set(cacheKey, { expiresAt: Date.now() + 6e4, value });
  if (publicStructureCache.size > 8) publicStructureCache.delete(publicStructureCache.keys().next().value);
  void value.catch(() => {
    if (publicStructureCache.get(cacheKey)?.value === value) publicStructureCache.delete(cacheKey);
  });
  return value;
}
async function writeRepositoryStructure(data, etag, environment) {
  const config = getR2Config(environment);
  try {
    await createR2Client(config).send(createRepositoryStructureWriteCommand(
      config.bucketName,
      data,
      etag
    ));
  } catch (error) {
    if (isR2PreconditionFailed(error)) throw new RepositoryStructureConflictError();
    throw error;
  }
  return data;
}
function createRepositoryStructureWriteCommand(bucketName, data, etag) {
  return new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: JSON.stringify({ data }),
    ContentType: "application/json",
    CacheControl: "no-store",
    ...etag ? { IfMatch: etag } : { IfNoneMatch: "*" }
  });
}
async function prefixHasFiles(prefix, environment) {
  const config = getR2Config(environment);
  const result = await createR2Client(config).send(new ListObjectsV2Command2({
    Bucket: config.bucketName,
    Prefix: prefix,
    MaxKeys: 1
  }));
  return Boolean(result.Contents?.length);
}
async function mutateRepositoryStructure(payload, environment = process.env) {
  const mutation = structureMutationSchema.parse(payload);
  const snapshot = await readRepositoryStructureSnapshot(environment);
  const data = structuredClone(snapshot.data);
  const uniqueId = (title, used) => {
    const base = slug(title);
    if (!base) throw new Error("Enter a usable title.");
    let id = base;
    let index = 2;
    while (used.includes(id)) id = `${base}-${index++}`;
    return id;
  };
  if (mutation.action === "add-section") {
    data.push({ id: uniqueId(mutation.title, data.map((item) => item.id)), title: mutation.title, categories: [] });
  }
  if (mutation.action === "rename-section") {
    const item = data.find((section) => section.id === mutation.id);
    if (!item) throw new Error("Section not found.");
    item.title = mutation.title;
  }
  if (mutation.action === "delete-section") {
    assertRepositorySectionCanBeDeleted(mutation.id);
    const index = data.findIndex((section) => section.id === mutation.id);
    if (index < 0) throw new Error("Section not found.");
    if (data[index].categories.length || await prefixHasFiles(`${mutation.id}/`, environment)) {
      throw new Error("Remove all categories and files before deleting this section.");
    }
    data.splice(index, 1);
  }
  if ("sectionId" in mutation) {
    const section = data.find((item) => item.id === mutation.sectionId);
    if (!section) throw new Error("Section not found.");
    if (mutation.action === "add-category") {
      section.categories.push({
        id: uniqueId(mutation.title, data.flatMap((item) => item.categories.map((category) => category.id))),
        title: mutation.title
      });
    }
    if (mutation.action === "rename-category") {
      const category = section.categories.find((item) => item.id === mutation.id);
      if (!category) throw new Error("Category not found.");
      category.title = mutation.title;
    }
    if (mutation.action === "delete-category") {
      const index = section.categories.findIndex((item) => item.id === mutation.id);
      if (index < 0) throw new Error("Category not found.");
      if (await prefixHasFiles(`${section.id}/${mutation.id}/`, environment)) {
        throw new Error("Delete or move all files before deleting this category.");
      }
      section.categories.splice(index, 1);
    }
  }
  return writeRepositoryStructure(data, snapshot.etag, environment);
}

// server/security/auditLog.ts
import { createHash, randomUUID } from "node:crypto";
import { HeadObjectCommand, PutObjectCommand as PutObjectCommand2 } from "@aws-sdk/client-s3";
import { z as z7 } from "zod";
var auditEnvironmentSchema = z7.object({
  R2_AUDIT_BUCKET_NAME: z7.string().trim().min(1)
});
async function recordAuditEvent(event, environment = process.env) {
  const occurredAt = /* @__PURE__ */ new Date();
  const id = event.idempotencyKey ? createHash("sha256").update(event.action).update(":").update(event.idempotencyKey).digest("hex") : randomUUID();
  const date = occurredAt.toISOString().slice(0, 10).replaceAll("-", "/");
  const timestamp = occurredAt.toISOString().replaceAll(":", "-");
  const key2 = event.idempotencyKey ? `_system/audit/idempotent/${id}.json` : `_system/audit/${date}/${timestamp}-${id}.json`;
  const config = getR2Config(environment);
  const auditEnvironment = auditEnvironmentSchema.safeParse(environment);
  if (!auditEnvironment.success) {
    throw new Error("The private audit bucket is not configured.");
  }
  const client = createR2Client(config);
  if (event.idempotencyKey) {
    try {
      await client.send(new HeadObjectCommand({
        Bucket: auditEnvironment.data.R2_AUDIT_BUCKET_NAME,
        Key: key2
      }));
      return key2;
    } catch (error) {
      if (!isR2NotFound(error)) throw error;
    }
  }
  try {
    await client.send(createAuditWriteCommand(
      auditEnvironment.data.R2_AUDIT_BUCKET_NAME,
      key2,
      {
        id,
        occurredAt: occurredAt.toISOString(),
        action: event.action,
        outcome: event.outcome,
        actor: {
          uid: event.actor.uid,
          email: event.actor.email ?? null
        },
        target: event.target,
        details: event.details ?? {}
      }
    ));
  } catch (error) {
    if (!event.idempotencyKey || !isR2PreconditionFailed(error)) throw error;
  }
  return key2;
}
function createAuditWriteCommand(bucketName, key2, event) {
  return new PutObjectCommand2({
    Bucket: bucketName,
    Key: key2,
    Body: JSON.stringify(event),
    ContentType: "application/json",
    CacheControl: "private, no-store",
    IfNoneMatch: "*"
  });
}

// server/http/adminResourceAccessHandler.ts
var accessLifetimeSeconds = 60;
var headers = {
  "cache-control": "private, no-store",
  "content-type": "application/json; charset=utf-8"
};
var json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
function authenticationFailure(error) {
  if (error instanceof AdminAuthorizationError) {
    return json({ error: { code: "FORBIDDEN", message: error.message } }, 403);
  }
  return json({
    error: {
      code: "UNAUTHORIZED",
      message: error instanceof AdminAuthenticationError ? error.message : "Authentication is required."
    }
  }, 401);
}
function createContentDisposition(mode, filename) {
  const type = mode === "download" ? "attachment" : "inline";
  const utf8Prefix = "UTF-8" + String.fromCharCode(39, 39);
  return type + "; filename*=" + utf8Prefix + encodeURIComponent(filename);
}
async function handleAdminResourceAccessRequest(request, dependencies = {}) {
  if (request.method !== "POST") {
    return json(
      { error: { code: "METHOD_NOT_ALLOWED", message: "Only POST is supported." } },
      405
    );
  }
  let identity;
  try {
    identity = await authenticateAdminRequest(request, dependencies);
  } catch (error) {
    return authenticationFailure(error);
  }
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({
      error: {
        code: "INVALID_REQUEST",
        message: "The request body must be valid JSON."
      }
    }, 400);
  }
  const result = adminResourceAccessRequestSchema.safeParse(payload);
  if (!result.success) {
    return json({
      error: {
        code: "INVALID_REQUEST",
        message: "The file access request is invalid."
      }
    }, 400);
  }
  try {
    const structure = dependencies.structure ?? await readRepositoryStructure(dependencies.environment);
    const resource = parseResourceObjectKey(result.data.key, structure);
    if (resource.fileType === "link") {
      return json({
        error: {
          code: "RESOURCE_NOT_FILE",
          message: "Links must be opened with the link action."
        }
      }, 400);
    }
    if (result.data.mode === "preview" && resource.fileType === "xlsx") {
      return json({
        error: {
          code: "RESOURCE_NOT_PREVIEWABLE",
          message: "This file type is available for staff download only."
        }
      }, 400);
    }
    const config = dependencies.config ?? getR2Config(dependencies.environment);
    const client = createR2Client(config);
    const command = new GetObjectCommand2({
      Bucket: config.bucketName,
      Key: resource.key,
      ResponseCacheControl: "private, no-store",
      ResponseContentDisposition: createContentDisposition(
        result.data.mode,
        resource.filename
      ),
      ResponseContentType: resource.mimeType
    });
    const sign = dependencies.sign ?? ((input, expiresIn) => getSignedUrl(client, input, { expiresIn }));
    const url = await sign(command, accessLifetimeSeconds);
    await (dependencies.audit ?? recordAuditEvent)({
      action: "resource.accessed",
      actor: identity,
      target: resource.key,
      outcome: "succeeded",
      details: { mode: result.data.mode }
    }, dependencies.environment);
    const now = dependencies.now?.() ?? /* @__PURE__ */ new Date();
    return json({
      data: {
        url,
        expiresAt: new Date(
          now.getTime() + accessLifetimeSeconds * 1e3
        ).toISOString()
      }
    });
  } catch {
    return json({
      error: {
        code: "FILE_ACCESS_UNAVAILABLE",
        message: "The file could not be opened. Please try again."
      }
    }, 503);
  }
}

// server/http/adminResourceMutationHandler.ts
import { CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand as HeadObjectCommand2, PutObjectCommand as PutObjectCommand3 } from "@aws-sdk/client-s3";

// src/contracts/adminOperations.ts
import { z as z8 } from "zod";
var resourceRenameSchema = z8.object({
  key: resourceObjectKeySchema,
  filename: resourceFilenameSchema
});
var resourceDeleteSchema = z8.object({
  key: resourceObjectKeySchema,
  confirmation: resourceFilenameSchema
});
var administratorCreateSchema = z8.object({
  email: z8.string().trim().email(),
  password: z8.string().min(12).max(128),
  displayName: z8.string().trim().min(2).max(80)
});
var administratorUpdateSchema = z8.object({
  uid: z8.string().min(1),
  displayName: z8.string().trim().min(2).max(80),
  disabled: z8.boolean()
});
var administratorDeleteSchema = z8.object({ uid: z8.string().min(1) });
var administratorSchema = z8.object({
  uid: z8.string(),
  email: z8.string().email(),
  displayName: z8.string(),
  disabled: z8.boolean(),
  createdAt: z8.string()
});
var administratorListSchema = z8.object({
  data: z8.array(administratorSchema),
  canManage: z8.boolean()
});

// src/contracts/resourceLink.ts
import { z as z9 } from "zod";
var maximumResourceLinkPayloadSize = 4 * 1024;
var resourceLinkNameSchema = z9.string().trim().min(1, "Enter a link name.").max(170, "The link name is too long.").refine((name) => !name.toLocaleLowerCase().endsWith(".link"), {
  message: "Enter the link name without a file extension."
}).refine((name) => resourceFilenameSchema.safeParse(`${name}.link`).success, {
  message: "The link name contains unsupported characters."
});
var resourceLinkUrlSchema = z9.url("Enter a valid web address.").refine((value) => {
  const url = new URL(value);
  return url.protocol === "https:" && !url.username && !url.password;
}, "Enter a secure HTTPS address without embedded credentials.");
var resourceLinkCreateSchema = z9.object({
  name: resourceLinkNameSchema,
  url: resourceLinkUrlSchema,
  sectionId: repositorySectionIdSchema,
  categoryId: z9.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u).optional(),
  year: resourceYearSchema
});
var resourceLinkPayloadSchema = z9.object({
  url: resourceLinkUrlSchema
});
var resourceLinkCreateResponseSchema = z9.object({
  data: z9.object({ key: resourceObjectKeySchema })
});

// server/http/adminResourceMutationHandler.ts
var headers2 = { "cache-control": "private, no-store", "content-type": "application/json; charset=utf-8" };
var json2 = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: headers2 });
function addDestinationMustNotExist(command) {
  command.middlewareStack.add(
    (next) => async (arguments_) => {
      const request = arguments_.request;
      if (request.headers) request.headers["cf-copy-destination-if-none-match"] = "*";
      return next(arguments_);
    },
    { step: "build", name: "r2CopyDestinationMustNotExist" }
  );
  return command;
}
function authenticationFailure2(error) {
  if (error instanceof AdminAuthorizationError) {
    return json2({ error: { code: "FORBIDDEN", message: error.message } }, 403);
  }
  return json2({ error: { code: "UNAUTHORIZED", message: error instanceof AdminAuthenticationError ? error.message : "Authentication is required." } }, 401);
}
async function handleAdminResourceMutationRequest(request, dependencies = {}) {
  let identity;
  try {
    identity = await authenticateAdminRequest(request, dependencies);
  } catch (error) {
    return authenticationFailure2(error);
  }
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json2({ error: { code: "INVALID_REQUEST", message: "The request body must be valid JSON." } }, 400);
  }
  const config = dependencies.config ?? getR2Config(dependencies.environment);
  const client = createR2Client(config);
  const send = dependencies.send ?? ((command) => {
    if (command instanceof HeadObjectCommand2) return client.send(command);
    if (command instanceof CopyObjectCommand) return client.send(command);
    if (command instanceof PutObjectCommand3) return client.send(command);
    return client.send(command);
  });
  const audit = dependencies.audit ?? recordAuditEvent;
  try {
    const structure = dependencies.structure ?? await readRepositoryStructure(dependencies.environment);
    if (request.method === "POST") {
      const result = resourceLinkCreateSchema.safeParse(payload);
      if (!result.success) return json2({ error: { code: "INVALID_REQUEST", message: "The link details are invalid.", details: result.error.issues.map((issue) => ({ field: issue.path.join(".") || "link", message: issue.message })) } }, 400);
      const section = structure.find((item) => item.id === result.data.sectionId);
      if (!section) return json2({ error: { code: "INVALID_SECTION", message: "The selected repository section is unavailable." } }, 400);
      if (result.data.categoryId && !section.categories.some((category) => category.id === result.data.categoryId)) {
        return json2({ error: { code: "INVALID_CATEGORY", message: "The selected category does not belong to the repository section." } }, 400);
      }
      const filename = `${result.data.name}.link`;
      const targetKey = result.data.categoryId ? `${result.data.sectionId}/${result.data.categoryId}/${result.data.year}/${filename}` : `${result.data.sectionId}/${result.data.year}/${filename}`;
      await audit({
        action: "resource.uploaded",
        actor: identity,
        target: targetKey,
        outcome: "attempted",
        details: { resourceType: "link" }
      }, dependencies.environment);
      try {
        await send(new PutObjectCommand3({
          Bucket: config.bucketName,
          Key: targetKey,
          Body: JSON.stringify({ url: result.data.url }),
          ContentType: resourceFileDefinitions.link.mimeType,
          CacheControl: "private, no-store",
          IfNoneMatch: "*"
        }));
      } catch (error) {
        if (isR2PreconditionFailed(error)) {
          return json2({ error: { code: "DUPLICATE_RESOURCE", message: "A link with that name already exists in this location." } }, 409);
        }
        throw error;
      }
      return json2({ data: { key: targetKey } }, 201);
    }
    if (request.method === "DELETE") {
      const result = resourceDeleteSchema.safeParse(payload);
      if (!result.success) return json2({ error: { code: "INVALID_REQUEST", message: "The deletion request is invalid." } }, 400);
      const parsed = parseResourceObjectKey(result.data.key, structure);
      if (parsed.filename !== result.data.confirmation) return json2({ error: { code: "CONFIRMATION_MISMATCH", message: "The deletion confirmation does not match this file." } }, 400);
      await audit({ action: "resource.deleted", actor: identity, target: parsed.key, outcome: "attempted" }, dependencies.environment);
      await send(new DeleteObjectCommand({ Bucket: config.bucketName, Key: parsed.key }));
      return json2({ data: { key: parsed.key } });
    }
    if (request.method === "PATCH") {
      const result = resourceRenameSchema.safeParse(payload);
      if (!result.success) return json2({ error: { code: "INVALID_REQUEST", message: "The rename request is invalid." } }, 400);
      const parsed = parseResourceObjectKey(result.data.key, structure);
      const extension = parsed.filename.split(".").pop()?.toLowerCase();
      if (result.data.filename.split(".").pop()?.toLowerCase() !== extension) return json2({ error: { code: "INVALID_EXTENSION", message: "Renaming cannot change the file type." } }, 400);
      const targetKey = parsed.categoryId ? `${parsed.sectionId}/${parsed.categoryId}/${parsed.year}/${result.data.filename}` : `${parsed.sectionId}/${parsed.year}/${result.data.filename}`;
      try {
        await send(new HeadObjectCommand2({ Bucket: config.bucketName, Key: targetKey }));
        return json2({ error: { code: "DUPLICATE_RESOURCE", message: "A resource with that filename already exists." } }, 409);
      } catch (error) {
        if (!isR2NotFound(error)) throw error;
      }
      await audit({
        action: "resource.renamed",
        actor: identity,
        target: parsed.key,
        outcome: "attempted",
        details: { destinationKey: targetKey }
      }, dependencies.environment);
      const copy = addDestinationMustNotExist(new CopyObjectCommand({
        Bucket: config.bucketName,
        CopySource: `${config.bucketName}/${encodeURIComponent(parsed.key).replace(/%2F/gu, "/")}`,
        Key: targetKey
      }));
      try {
        await send(copy);
      } catch (error) {
        if (isR2PreconditionFailed(error)) {
          return json2({ error: { code: "DUPLICATE_RESOURCE", message: "A resource with that filename was created before the rename completed." } }, 409);
        }
        throw error;
      }
      await send(new DeleteObjectCommand({ Bucket: config.bucketName, Key: parsed.key }));
      return json2({ data: { key: targetKey } });
    }
    return json2({ error: { code: "METHOD_NOT_ALLOWED", message: "Only POST, PATCH, and DELETE are supported." } }, 405);
  } catch {
    return json2({ error: { code: "RESOURCE_OPERATION_FAILED", message: "The repository operation could not be completed." } }, 500);
  }
}

// server/repository/listResources.ts
import { HeadObjectCommand as HeadObjectCommand3 } from "@aws-sdk/client-s3";

// server/repository/publicResourceId.ts
import { createCipheriv, createDecipheriv, createHmac } from "node:crypto";
var version = "v1_";
function deriveKey(config) {
  return createHmac("sha256", config.secretAccessKey).update(`cpsu-public-resource-id:${config.accountId}:${config.bucketName}`).digest();
}
function createPublicResourceId(key2, config) {
  const encryptionKey = deriveKey(config);
  const nonce = createHmac("sha256", encryptionKey).update(key2).digest().subarray(0, 12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey, nonce);
  const ciphertext = Buffer.concat([cipher.update(key2, "utf8"), cipher.final()]);
  return version + Buffer.concat([nonce, cipher.getAuthTag(), ciphertext]).toString("base64url");
}
function decodePublicResourceId(id, config) {
  if (!/^v1_[A-Za-z0-9_-]{40,6000}$/u.test(id)) return null;
  try {
    const bytes = Buffer.from(id.slice(version.length), "base64url");
    if (bytes.length < 29) return null;
    const encryptionKey = deriveKey(config);
    const nonce = bytes.subarray(0, 12);
    const tag = bytes.subarray(12, 28);
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey, nonce);
    decipher.setAuthTag(tag);
    const key2 = Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString("utf8");
    const expectedNonce = createHmac("sha256", encryptionKey).update(key2).digest().subarray(0, 12);
    return nonce.equals(expectedNonce) ? key2 : null;
  } catch {
    return null;
  }
}

// server/repository/listResources.ts
var r2PageSize = 1e3;
var maximumListedObjects = 1e4;
var publicListCacheLifetimeMs = 6e4;
var publicListCache = /* @__PURE__ */ new Map();
var InvalidResourceCursorError = class extends Error {
  constructor() {
    super("The repository cursor is invalid.");
    this.name = "InvalidResourceCursorError";
  }
};
function getListPrefix(query) {
  if (query.section && query.category)
    return `${query.section}/${query.category}/`;
  if (query.section) return `${query.section}/`;
  if (query.category) {
    const category = repositoryCategoryById.get(query.category);
    return category ? `${category.sectionId}/${category.id}/` : void 0;
  }
  return void 0;
}
async function getAllObjectSummaries(bucketName, prefix, listObjects) {
  const objects = [];
  let continuationToken;
  do {
    const page = await listObjects({
      Bucket: bucketName,
      ContinuationToken: continuationToken,
      MaxKeys: r2PageSize,
      Prefix: prefix
    });
    objects.push(...page.Contents ?? []);
    if (objects.length > maximumListedObjects) {
      throw new Error(
        "The repository listing exceeds the supported Version 1 limit."
      );
    }
    continuationToken = page.IsTruncated ? page.NextContinuationToken : void 0;
    if (page.IsTruncated && !continuationToken) {
      throw new Error(
        "The repository returned an incomplete pagination response."
      );
    }
  } while (continuationToken);
  return objects;
}
function getCachedPublicObjectSummaries(config, prefix, listObjects) {
  const cacheKey = JSON.stringify([config.accountId, config.bucketName, prefix]);
  const cached = publicListCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const value = getAllObjectSummaries(config.bucketName, prefix, listObjects);
  publicListCache.set(cacheKey, { expiresAt: Date.now() + publicListCacheLifetimeMs, value });
  if (publicListCache.size > 32) {
    publicListCache.delete(publicListCache.keys().next().value);
  }
  void value.catch(() => {
    if (publicListCache.get(cacheKey)?.value === value) publicListCache.delete(cacheKey);
  });
  return value;
}
function mapObjectToResource(object, structure, config) {
  if (!object.Key || object.Size === void 0 || !object.LastModified)
    return null;
  try {
    const parsedKey = parseResourceObjectKey(object.Key, structure);
    return adminResourceSchema.parse({
      id: createPublicResourceId(parsedKey.key, config),
      key: parsedKey.key,
      filename: parsedKey.filename,
      displayName: parsedKey.displayName,
      sectionId: parsedKey.sectionId,
      categoryId: parsedKey.categoryId,
      year: parsedKey.year,
      fileType: parsedKey.fileType,
      mimeType: parsedKey.mimeType,
      fileSize: object.Size,
      uploadedAt: object.LastModified.toISOString()
    });
  } catch {
    return null;
  }
}
function matchesQuery(resource, query) {
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
      resource.fileType
    ].join(" ").toLocaleLowerCase();
    if (!searchableText.includes(searchValue)) return false;
  }
  return true;
}
function compareByKey(left, right) {
  return left.key.localeCompare(right.key);
}
function sortResources(resources, sort) {
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
function decodeCursor(cursor) {
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
function encodeCursor(offset) {
  return Buffer.from(String(offset), "utf8").toString("base64url");
}
async function listResourceRecords(query, dependencies = {}, usePublicCache = false) {
  const config = dependencies.config ?? getR2Config(dependencies.environment);
  const structure = dependencies.structure ?? (dependencies.listObjects ? repositorySections : await (usePublicCache ? readCachedPublicRepositoryStructure(dependencies.environment) : readRepositoryStructure(dependencies.environment)));
  const listObjects = dependencies.listObjects ?? createR2ObjectLister(createR2Client(config));
  const prefix = getListPrefix(query);
  const objectSummaries = await (usePublicCache && !dependencies.listObjects ? getCachedPublicObjectSummaries(config, prefix, listObjects) : getAllObjectSummaries(config.bucketName, prefix, listObjects));
  const resources = sortResources(
    objectSummaries.map((object) => mapObjectToResource(object, structure, config)).filter((resource) => resource !== null).filter((resource) => matchesQuery(resource, query)),
    query.sort
  );
  const offset = decodeCursor(query.cursor);
  const data = resources.slice(offset, offset + query.limit);
  const nextOffset = offset + data.length;
  return {
    data,
    meta: {
      total: resources.length,
      nextCursor: nextOffset < resources.length ? encodeCursor(nextOffset) : null
    }
  };
}
async function listAdminResources(query, dependencies = {}) {
  return listResourceRecords(query, dependencies);
}
async function findResourceByPublicId(id, dependencies = {}) {
  const config = dependencies.config ?? getR2Config(dependencies.environment);
  const key2 = decodePublicResourceId(id, config);
  if (!key2) return null;
  const structure = dependencies.structure ?? (dependencies.headObject ? repositorySections : await readCachedPublicRepositoryStructure(dependencies.environment));
  try {
    parseResourceObjectKey(key2, structure);
    const headObject = dependencies.headObject ?? (async (bucket, objectKey) => createR2Client(config).send(new HeadObjectCommand3({ Bucket: bucket, Key: objectKey })));
    const object = await headObject(config.bucketName, key2);
    return mapObjectToResource({ Key: key2, Size: object.ContentLength, LastModified: object.LastModified }, structure, config);
  } catch (error) {
    if (isR2NotFound(error) || error instanceof InvalidResourceObjectKeyError) return null;
    throw error;
  }
}
async function listResources(query, dependencies = {}) {
  const result = await listResourceRecords(query, dependencies, true);
  return {
    data: result.data.map(
      (resource) => publicResourceSchema.parse(resource)
    ),
    meta: result.meta
  };
}

// server/http/resourcesHandler.ts
var jsonHeaders = {
  "cache-control": "public, max-age=0, s-maxage=60",
  "content-type": "application/json; charset=utf-8"
};
function jsonResponse(body, status = 200, headers8 = jsonHeaders) {
  return new Response(JSON.stringify(body), { status, headers: headers8 });
}
async function handleResourcesRequest(request, dependencies = {}, resourceLister = listResources) {
  if (request.method !== "GET") {
    return jsonResponse(
      { error: { code: "METHOD_NOT_ALLOWED", message: "Only GET is supported." } },
      405,
      { ...jsonHeaders, allow: "GET" }
    );
  }
  const url = new URL(request.url);
  const queryResult = resourceQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!queryResult.success) {
    return jsonResponse(
      {
        error: {
          code: "INVALID_QUERY",
          message: "One or more query parameters are invalid.",
          details: queryResult.error.issues.map((issue) => ({
            field: issue.path.join(".") || "query",
            message: issue.message
          }))
        }
      },
      400
    );
  }
  const requestedCategory = queryResult.data.category ? repositoryCategoryById.get(queryResult.data.category) : void 0;
  if (queryResult.data.category && !requestedCategory) {
    return jsonResponse(
      {
        error: {
          code: "INVALID_CATEGORY",
          message: "The requested repository category is not configured."
        }
      },
      400
    );
  }
  if (queryResult.data.section && requestedCategory && requestedCategory.sectionId !== queryResult.data.section) {
    return jsonResponse(
      {
        error: {
          code: "INVALID_CATEGORY",
          message: "The requested category does not belong to the selected section."
        }
      },
      400
    );
  }
  try {
    return jsonResponse(await resourceLister(queryResult.data, dependencies));
  } catch (error) {
    if (error instanceof InvalidResourceCursorError) {
      return jsonResponse(
        {
          error: {
            code: "INVALID_CURSOR",
            message: "The repository pagination cursor is invalid."
          }
        },
        400
      );
    }
    return jsonResponse(
      {
        error: {
          code: "REPOSITORY_UNAVAILABLE",
          message: "The repository is temporarily unavailable. Please try again later."
        }
      },
      503,
      { ...jsonHeaders, "cache-control": "no-store" }
    );
  }
}

// server/http/adminResourcesHandler.ts
var privateJsonHeaders = {
  "cache-control": "private, no-store",
  "content-type": "application/json; charset=utf-8"
};
function unauthorizedResponse(message) {
  return new Response(
    JSON.stringify({ error: { code: "UNAUTHORIZED", message } }),
    { status: 401, headers: privateJsonHeaders }
  );
}
async function handleAdminResourcesRequest(request, dependencies = {}) {
  try {
    const identity = await authenticateAdminRequest(request, dependencies);
    if (!identity.email) {
      return new Response(
        JSON.stringify({
          error: {
            code: "FORBIDDEN",
            message: "An authorized administrator email is required."
          }
        }),
        { status: 403, headers: privateJsonHeaders }
      );
    }
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return new Response(
        JSON.stringify({ error: { code: "FORBIDDEN", message: error.message } }),
        { status: 403, headers: privateJsonHeaders }
      );
    }
    return unauthorizedResponse(
      error instanceof AdminAuthenticationError ? error.message : "The administrator session is invalid or expired."
    );
  }
  const resourceResponse = await handleResourcesRequest(request, {
    environment: dependencies.environment,
    ...dependencies.resources
  }, listAdminResources);
  const headers8 = new Headers(resourceResponse.headers);
  headers8.set("cache-control", "private, no-store");
  return new Response(resourceResponse.body, {
    status: resourceResponse.status,
    statusText: resourceResponse.statusText,
    headers: headers8
  });
}

// server/http/adminSessionHandler.ts
var jsonHeaders2 = {
  "cache-control": "no-store",
  "content-type": "application/json; charset=utf-8"
};
function jsonResponse2(body, status = 200, headers8 = jsonHeaders2) {
  return new Response(JSON.stringify(body), { status, headers: headers8 });
}
async function handleAdminSessionRequest(request, dependencies = {}) {
  if (request.method !== "GET") {
    return jsonResponse2(
      { error: { code: "METHOD_NOT_ALLOWED", message: "Only GET is supported." } },
      405,
      { ...jsonHeaders2, allow: "GET" }
    );
  }
  try {
    const decodedToken = await authenticateAdminRequest(request, dependencies);
    if (!decodedToken.email) {
      return jsonResponse2(
        { error: { code: "FORBIDDEN", message: "An authorized administrator email is required." } },
        403
      );
    }
    return jsonResponse2({ data: { uid: decodedToken.uid, email: decodedToken.email } });
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return jsonResponse2(
        { error: { code: "FORBIDDEN", message: error.message } },
        403
      );
    }
    return jsonResponse2(
      {
        error: {
          code: "UNAUTHORIZED",
          message: error instanceof AdminAuthenticationError ? error.message : "The administrator session is invalid or expired."
        }
      },
      401
    );
  }
}

// server/http/adminUsersHandler.ts
import { getAuth as getAuth2 } from "firebase-admin/auth";
var headers3 = { "cache-control": "private, no-store", "content-type": "application/json; charset=utf-8" };
var json3 = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: headers3 });
var mapUser = (user) => ({
  uid: user.uid,
  email: user.email ?? "",
  displayName: user.displayName ?? "",
  disabled: user.disabled,
  createdAt: user.metadata.creationTime
});
async function handleAdminUsersRequest(request, dependencies = {}) {
  let identity;
  try {
    identity = await authenticateAdminRequest(request, dependencies);
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return json3({ error: { code: "FORBIDDEN", message: error.message } }, 403);
    return json3({ error: { code: "UNAUTHORIZED", message: error instanceof AdminAuthenticationError ? error.message : "Authentication is required." } }, 401);
  }
  const ownerUid = (dependencies.environment ?? process.env).FIREBASE_BOOTSTRAP_ADMIN_UID?.trim();
  const canManage = !ownerUid || identity.uid === ownerUid;
  if (!canManage && request.method !== "GET") {
    return json3({ error: { code: "FORBIDDEN", message: "Only the designated account owner can manage administrators." } }, 403);
  }
  const auth = dependencies.auth ?? getAuth2(getFirebaseAdminApp(getFirebaseAdminConfig(dependencies.environment)));
  const audit = dependencies.audit ?? recordAuditEvent;
  try {
    if (request.method === "GET") {
      const users = (await auth.listUsers(1e3)).users.filter((user) => user.email && hasAdministratorAccess(user, dependencies.environment ?? process.env)).map(mapUser);
      return json3({ data: users, canManage });
    }
    const payload = await request.json();
    if (request.method === "POST") {
      const result = administratorCreateSchema.safeParse(payload);
      if (!result.success) return json3({ error: { code: "INVALID_REQUEST", message: "Enter a valid name, email, and password of at least 12 characters." } }, 400);
      await audit({ action: "administrator.created", actor: identity, target: result.data.email, outcome: "attempted" }, dependencies.environment);
      const user = await auth.createUser({ ...result.data, emailVerified: false, disabled: false });
      try {
        await auth.setCustomUserClaims(user.uid, { admin: true });
      } catch (error) {
        await auth.deleteUser(user.uid);
        throw error;
      }
      return json3({ data: mapUser(user) }, 201);
    }
    if (request.method === "PATCH") {
      const result = administratorUpdateSchema.safeParse(payload);
      if (!result.success) return json3({ error: { code: "INVALID_REQUEST", message: "The administrator update is invalid." } }, 400);
      if (result.data.uid === identity.uid && result.data.disabled) return json3({ error: { code: "SELF_PROTECTION", message: "You cannot disable your active account." } }, 400);
      await audit({
        action: "administrator.updated",
        actor: identity,
        target: result.data.uid,
        outcome: "attempted",
        details: { disabled: result.data.disabled }
      }, dependencies.environment);
      return json3({ data: mapUser(await auth.updateUser(result.data.uid, {
        displayName: result.data.displayName,
        disabled: result.data.disabled
      })) });
    }
    if (request.method === "DELETE") {
      const result = administratorDeleteSchema.safeParse(payload);
      if (!result.success) return json3({ error: { code: "INVALID_REQUEST", message: "The administrator deletion is invalid." } }, 400);
      if (result.data.uid === identity.uid) return json3({ error: { code: "SELF_PROTECTION", message: "You cannot delete your active account." } }, 400);
      await audit({ action: "administrator.deleted", actor: identity, target: result.data.uid, outcome: "attempted" }, dependencies.environment);
      await auth.deleteUser(result.data.uid);
      return json3({ data: { uid: result.data.uid } });
    }
    return json3({ error: { code: "METHOD_NOT_ALLOWED", message: "Unsupported method." } }, 405);
  } catch {
    return json3({ error: { code: "ADMIN_OPERATION_FAILED", message: "The administrator operation could not be completed." } }, 500);
  }
}

// src/contracts/accomplishmentResource.ts
import { z as z12 } from "zod";

// src/contracts/reportAppearance.ts
import { z as z10 } from "zod";
var chartColorSchema = z10.string().regex(/^#[0-9a-fA-F]{6}$/u, "Select a valid chart color.");
var legendIdSchema = z10.string().min(1).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u);
var reportLegendItemSchema = z10.object({
  id: legendIdSchema,
  label: z10.string().trim().min(1).max(40),
  color: chartColorSchema
});
var barColorKeySchema = z10.string().min(1).max(160).regex(/^[A-Za-z0-9:_-]+$/u);
var barColorValueSchema = z10.union([chartColorSchema, legendIdSchema]);
var reportAppearanceSchema = z10.object({
  legend: z10.array(reportLegendItemSchema).max(12).optional(),
  barColors: z10.record(barColorKeySchema, barColorValueSchema).optional()
});

// src/contracts/reportResource.ts
import { z as z11 } from "zod";
var reportNodeIdSchema = z11.string().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u);
var reportTreeNodeSchema = z11.object({
  id: reportNodeIdSchema,
  parentId: reportNodeIdSchema.nullable(),
  type: z11.enum(["section", "group", "indicator"]),
  title: z11.string().trim().min(2).max(120)
});
var reportValueSchema = z11.string().max(2e3);
var reportChartTypeSchema = z11.enum(["column", "line", "bar"]);
function inspectReportHierarchy(nodes) {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const invalidParentIndexes = [];
  nodes.forEach((node, index) => {
    const parent = node.parentId ? nodesById.get(node.parentId) : void 0;
    const validParent = node.type === "section" && node.parentId === null || node.type === "group" && parent?.type === "section" || node.type === "indicator" && parent?.type === "group";
    if (!validParent) invalidParentIndexes.push(index);
  });
  return {
    hasDuplicateIds: nodesById.size !== nodes.length,
    invalidParentIndexes
  };
}

// src/contracts/accomplishmentResource.ts
var periodEntrySchema = z12.object({
  q1: reportValueSchema,
  q2: reportValueSchema,
  q3: reportValueSchema,
  q4: reportValueSchema,
  total: reportValueSchema
});
var dataRowEntrySchema = z12.object({
  target: periodEntrySchema,
  accomplishment: periodEntrySchema
});
var indicatorEntrySchema = z12.object({
  results: dataRowEntrySchema,
  rawData: dataRowEntrySchema
});
var currentAccomplishmentResourceDataSchema = z12.object({
  version: z12.literal(2),
  nodes: z12.array(reportTreeNodeSchema).max(250),
  entries: z12.record(
    z12.string().regex(/^\d{4}$/u),
    z12.record(reportNodeIdSchema, indicatorEntrySchema)
  ),
  chartType: reportChartTypeSchema,
  appearance: reportAppearanceSchema.optional()
}).superRefine((data, context) => {
  if (Object.keys(data.entries).length > 50 || Object.values(data.entries).some((yearEntries) => Object.keys(yearEntries).length > 250)) {
    context.addIssue({
      code: "custom",
      message: "The report contains too many years or indicator entries.",
      path: ["entries"]
    });
  }
  const hierarchy = inspectReportHierarchy(data.nodes);
  if (hierarchy.hasDuplicateIds) {
    context.addIssue({
      code: "custom",
      message: "Performance item identifiers must be unique.",
      path: ["nodes"]
    });
  }
  hierarchy.invalidParentIndexes.forEach((index) => {
    context.addIssue({
      code: "custom",
      message: "The performance hierarchy is invalid.",
      path: ["nodes", index, "parentId"]
    });
  });
});
var legacyPeriodEntrySchema = z12.object({
  target: reportValueSchema,
  q1: reportValueSchema,
  q2: reportValueSchema,
  q3: reportValueSchema,
  q4: reportValueSchema,
  total: reportValueSchema
});
var legacyAccomplishmentResourceDataSchema = z12.object({
  version: z12.literal(1),
  nodes: z12.array(reportTreeNodeSchema).max(250),
  entries: z12.record(
    z12.string().regex(/^\d{4}$/u),
    z12.record(
      reportNodeIdSchema,
      z12.object({
        results: legacyPeriodEntrySchema,
        rawData: legacyPeriodEntrySchema
      })
    )
  ),
  chartType: reportChartTypeSchema
});
function migrateLegacyData(value) {
  const legacy = legacyAccomplishmentResourceDataSchema.safeParse(value);
  if (!legacy.success) return value;
  const entries = Object.fromEntries(
    Object.entries(legacy.data.entries).map(([year, yearEntries]) => [
      year,
      Object.fromEntries(
        Object.entries(yearEntries).map(([indicatorId, indicator]) => [
          indicatorId,
          Object.fromEntries(
            Object.entries(indicator).map(([rowType, row]) => [
              rowType,
              {
                target: {
                  q1: "",
                  q2: "",
                  q3: "",
                  q4: "",
                  total: row.target
                },
                accomplishment: {
                  q1: row.q1,
                  q2: row.q2,
                  q3: row.q3,
                  q4: row.q4,
                  total: row.total
                }
              }
            ])
          )
        ])
      )
    ])
  );
  return { ...legacy.data, version: 2, entries };
}
var accomplishmentResourceDataSchema = z12.preprocess(
  migrateLegacyData,
  currentAccomplishmentResourceDataSchema
);
var accomplishmentResourceResponseSchema = z12.object({
  data: accomplishmentResourceDataSchema
});

// server/repository/jsonResourceStore.ts
import { GetObjectCommand as GetObjectCommand3, PutObjectCommand as PutObjectCommand4 } from "@aws-sdk/client-s3";
async function readObjectBody(body, invalidBodyMessage) {
  if (body && typeof body === "object" && "transformToString" in body && typeof body.transformToString === "function")
    return body.transformToString();
  throw new Error(invalidBodyMessage);
}
function createR2JsonResourceStore(options) {
  function createWriteCommand(bucketName, data) {
    return new PutObjectCommand4({
      Bucket: bucketName,
      Key: options.key,
      Body: JSON.stringify(data),
      ContentType: "application/json",
      CacheControl: "no-store"
    });
  }
  async function read(environment = process.env) {
    const config = getR2Config(environment);
    try {
      const object = await createR2Client(config).send(
        new GetObjectCommand3({
          Bucket: config.bucketName,
          Key: options.key
        })
      );
      const body = await readObjectBody(
        object.Body,
        options.invalidBodyMessage
      );
      return options.schema.parse(JSON.parse(body));
    } catch (error) {
      if (isR2NotFound(error)) return structuredClone(options.defaults);
      throw error;
    }
  }
  async function write(payload, environment = process.env) {
    const data = options.schema.parse(payload);
    const config = getR2Config(environment);
    await createR2Client(config).send(
      createWriteCommand(config.bucketName, data)
    );
    return data;
  }
  return { createWriteCommand, read, write };
}

// server/repository/accomplishmentResourceStore.ts
var store = createR2JsonResourceStore({
  key: "_system/accomplishment-resource.json",
  defaults: {
    version: 2,
    nodes: [],
    entries: {},
    chartType: "column"
  },
  schema: accomplishmentResourceDataSchema,
  invalidBodyMessage: "Invalid accomplishment resource body."
});
var createAccomplishmentResourceWriteCommand = store.createWriteCommand;
var readAccomplishmentResource = store.read;
var writeAccomplishmentResource = store.write;

// server/http/readLimitedJson.ts
var RequestBodyTooLargeError = class extends Error {
};
var InvalidJsonBodyError = class extends Error {
};
async function readLimitedJson(request, maximumBytes) {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
    throw new RequestBodyTooLargeError();
  }
  if (!request.body) throw new InvalidJsonBodyError();
  const reader = request.body.getReader();
  const chunks = [];
  let byteCount = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteCount += value.byteLength;
      if (byteCount > maximumBytes) {
        await reader.cancel();
        throw new RequestBodyTooLargeError();
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) throw error;
    throw new InvalidJsonBodyError();
  } finally {
    reader.releaseLock();
  }
}

// server/http/adminReportResourceHandler.ts
var privateHeaders = {
  "cache-control": "private, no-store",
  "content-type": "application/json; charset=utf-8"
};
function json4(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...privateHeaders, ...extraHeaders }
  });
}
function createAdminReportResourceHandler(options) {
  return async function handleAdminReportResourceRequest(request, environment = process.env, dependencies = {}) {
    let identity;
    try {
      identity = await authenticateAdminRequest(request, { environment });
    } catch (error) {
      if (error instanceof AdminAuthorizationError) {
        return json4(
          { error: { code: "FORBIDDEN", message: error.message } },
          403
        );
      }
      return json4(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication is required."
          }
        },
        401
      );
    }
    try {
      if (request.method === "GET") {
        return json4({ data: await options.read(environment) });
      }
      if (request.method !== "PUT") {
        return json4(
          {
            error: {
              code: "METHOD_NOT_ALLOWED",
              message: "Only GET and PUT are supported."
            }
          },
          405,
          { allow: "GET, PUT" }
        );
      }
      let payload;
      try {
        payload = await readLimitedJson(request, 3 * 1024 * 1024);
      } catch (error) {
        if (error instanceof RequestBodyTooLargeError) {
          return json4({ error: { code: "PAYLOAD_TOO_LARGE", message: "The report is too large to save." } }, 413);
        }
        if (error instanceof InvalidJsonBodyError) {
          return json4({ error: { code: "INVALID_REQUEST", message: "The request body must be valid JSON." } }, 400);
        }
        throw error;
      }
      const parsed = options.schema.safeParse(payload);
      if (!parsed.success) {
        return json4(
          {
            error: {
              code: "INVALID_REQUEST",
              message: options.invalidRequestMessage
            }
          },
          400
        );
      }
      await (dependencies.audit ?? recordAuditEvent)(
        {
          action: options.auditAction,
          actor: identity,
          target: options.auditTarget,
          outcome: "attempted"
        },
        environment
      );
      return json4({ data: await options.write(parsed.data, environment) });
    } catch {
      return json4(
        {
          error: {
            code: options.unavailableCode,
            message: options.unavailableMessage
          }
        },
        503
      );
    }
  };
}

// server/http/accomplishmentResourceHandler.ts
var handleAccomplishmentResourceRequest = createAdminReportResourceHandler({
  schema: accomplishmentResourceDataSchema,
  read: readAccomplishmentResource,
  write: writeAccomplishmentResource,
  invalidRequestMessage: "The accomplishment resource data is invalid.",
  unavailableCode: "ACCOMPLISHMENT_RESOURCE_UNAVAILABLE",
  unavailableMessage: "The accomplishment resource could not be saved.",
  auditAction: "accomplishment-resource.saved",
  auditTarget: "accomplishment-resource"
});

// src/contracts/opcrResource.ts
import { z as z13 } from "zod";
var periodEntrySchema2 = z13.object({
  h1: reportValueSchema,
  h2: reportValueSchema,
  total: reportValueSchema
});
var dataRowEntrySchema2 = z13.object({
  target: periodEntrySchema2,
  accomplishment: periodEntrySchema2
});
var indicatorEntrySchema2 = z13.object({
  results: dataRowEntrySchema2,
  rawData: dataRowEntrySchema2
});
var opcrResourceDataSchema = z13.object({
  version: z13.literal(1),
  nodes: z13.array(reportTreeNodeSchema).max(250),
  entries: z13.record(
    z13.string().regex(/^\d{4}$/u),
    z13.record(reportNodeIdSchema, indicatorEntrySchema2)
  ),
  chartType: reportChartTypeSchema,
  appearance: reportAppearanceSchema.optional()
}).superRefine((data, context) => {
  if (Object.keys(data.entries).length > 50 || Object.values(data.entries).some((yearEntries) => Object.keys(yearEntries).length > 250)) {
    context.addIssue({
      code: "custom",
      message: "The report contains too many years or indicator entries.",
      path: ["entries"]
    });
  }
  const hierarchy = inspectReportHierarchy(data.nodes);
  if (hierarchy.hasDuplicateIds) {
    context.addIssue({
      code: "custom",
      message: "OPCR performance item identifiers must be unique.",
      path: ["nodes"]
    });
  }
  hierarchy.invalidParentIndexes.forEach((index) => {
    context.addIssue({
      code: "custom",
      message: "The OPCR performance hierarchy is invalid.",
      path: ["nodes", index, "parentId"]
    });
  });
});
var opcrResourceResponseSchema = z13.object({
  data: opcrResourceDataSchema
});

// server/repository/opcrResourceStore.ts
var store2 = createR2JsonResourceStore({
  key: "_system/opcr-resource.json",
  defaults: {
    version: 1,
    nodes: [],
    entries: {},
    chartType: "column"
  },
  schema: opcrResourceDataSchema,
  invalidBodyMessage: "Invalid OPCR resource body."
});
var createOpcrResourceWriteCommand = store2.createWriteCommand;
var readOpcrResource = store2.read;
var writeOpcrResource = store2.write;

// server/http/opcrResourceHandler.ts
var handleOpcrResourceRequest = createAdminReportResourceHandler({
  schema: opcrResourceDataSchema,
  read: readOpcrResource,
  write: writeOpcrResource,
  invalidRequestMessage: "The OPCR resource data is invalid.",
  unavailableCode: "OPCR_RESOURCE_UNAVAILABLE",
  unavailableMessage: "The OPCR resource is temporarily unavailable.",
  auditAction: "opcr-resource.saved",
  auditTarget: "opcr-resource"
});

// server/http/publicReportResourceHandler.ts
var publicHeaders = {
  "cache-control": "no-store",
  "content-type": "application/json; charset=utf-8"
};
function json5(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...publicHeaders, ...extraHeaders }
  });
}
function createPublicReportResourceHandler(options) {
  return async function handlePublicReportResourceRequest(request, environment = process.env, dependencies = {}) {
    if (request.method !== "GET") {
      return json5(
        {
          error: {
            code: "METHOD_NOT_ALLOWED",
            message: "Only GET is supported."
          }
        },
        405,
        { allow: "GET" }
      );
    }
    const year = new URL(request.url).searchParams.get("year");
    if (!year || year !== "all" && !/^\d{4}$/u.test(year)) {
      return json5(
        {
          error: {
            code: "INVALID_YEAR",
            message: "Select a valid year."
          }
        },
        400
      );
    }
    try {
      const data = await (dependencies.read ?? options.read)(environment);
      return json5({
        data: {
          ...data,
          entries: year === "all" ? data.entries : { [year]: data.entries[year] ?? {} }
        }
      }, 200, { "cache-control": "public, max-age=0, s-maxage=60" });
    } catch {
      return json5(
        {
          error: {
            code: options.unavailableCode,
            message: options.unavailableMessage
          }
        },
        503
      );
    }
  };
}

// server/http/publicAccomplishmentResourceHandler.ts
var handlePublicAccomplishmentResourceRequest = createPublicReportResourceHandler({
  read: readAccomplishmentResource,
  unavailableCode: "ACCOMPLISHMENT_RESOURCE_UNAVAILABLE",
  unavailableMessage: "Accomplishment data is temporarily unavailable."
});

// server/http/publicOpcrResourceHandler.ts
var handlePublicOpcrResourceRequest = createPublicReportResourceHandler({
  read: readOpcrResource,
  unavailableCode: "OPCR_RESOURCE_UNAVAILABLE",
  unavailableMessage: "OPCR data is temporarily unavailable."
});

// server/http/publicResourcePreviewHandler.ts
import { GetObjectCommand as GetObjectCommand4 } from "@aws-sdk/client-s3";
import { getSignedUrl as getSignedUrl2 } from "@aws-sdk/s3-request-presigner";
var previewLifetimeSeconds = 60;
var headers4 = {
  "cache-control": "private, no-store",
  "content-type": "application/json; charset=utf-8"
};
var json6 = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: headers4 });
function inlineContentDisposition(filename) {
  const utf8Prefix = "UTF-8" + String.fromCharCode(39, 39);
  return "inline; filename*=" + utf8Prefix + encodeURIComponent(filename);
}
async function handlePublicResourcePreviewRequest(request, dependencies = {}) {
  if (request.method !== "POST") {
    return json6(
      {
        error: {
          code: "METHOD_NOT_ALLOWED",
          message: "Only POST is supported."
        }
      },
      405
    );
  }
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json6(
      {
        error: {
          code: "INVALID_REQUEST",
          message: "The request body must be valid JSON."
        }
      },
      400
    );
  }
  const result = publicResourcePreviewRequestSchema.safeParse(payload);
  if (!result.success) {
    return json6(
      {
        error: {
          code: "INVALID_REQUEST",
          message: "The preview request is invalid."
        }
      },
      400
    );
  }
  try {
    const findResource = dependencies.findResource ?? findResourceByPublicId;
    const resource = await findResource(result.data.id, dependencies);
    if (!resource) {
      return json6(
        {
          error: {
            code: "RESOURCE_NOT_FOUND",
            message: "The requested resource could not be found."
          }
        },
        404
      );
    }
    if (resource.fileType === "xlsx" || resource.fileType === "link") {
      return json6(
        {
          error: {
            code: "RESOURCE_NOT_PREVIEWABLE",
            message: "Online file preview is not available for this resource."
          }
        },
        400
      );
    }
    const config = dependencies.config ?? getR2Config(dependencies.environment);
    const command = new GetObjectCommand4({
      Bucket: config.bucketName,
      Key: resource.key,
      ResponseCacheControl: "private, no-store",
      ResponseContentDisposition: inlineContentDisposition(resource.filename),
      ResponseContentType: resource.mimeType
    });
    const url = dependencies.sign ? await dependencies.sign(command, previewLifetimeSeconds) : await getSignedUrl2(createR2Client(config), command, {
      expiresIn: previewLifetimeSeconds
    });
    const now = dependencies.now?.() ?? /* @__PURE__ */ new Date();
    return json6({
      data: {
        url,
        expiresAt: new Date(
          now.getTime() + previewLifetimeSeconds * 1e3
        ).toISOString()
      }
    });
  } catch {
    return json6(
      {
        error: {
          code: "PREVIEW_UNAVAILABLE",
          message: "The file preview could not be opened. Please try again."
        }
      },
      503
    );
  }
}

// server/http/publicResourceLinkHandler.ts
import { GetObjectCommand as GetObjectCommand5 } from "@aws-sdk/client-s3";
var responseHeaders = {
  "cache-control": "private, no-store",
  "referrer-policy": "no-referrer",
  "x-robots-tag": "noindex, nofollow"
};
function json7(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...responseHeaders,
      "content-type": "application/json; charset=utf-8"
    }
  });
}
async function handlePublicResourceLinkRequest(request, dependencies = {}) {
  if (request.method !== "GET") {
    return json7(
      { error: { code: "METHOD_NOT_ALLOWED", message: "Only GET is supported." } },
      405
    );
  }
  const idResult = publicResourceIdSchema.safeParse(
    new URL(request.url).searchParams.get("id")
  );
  if (!idResult.success) {
    return json7(
      { error: { code: "INVALID_REQUEST", message: "The link request is invalid." } },
      400
    );
  }
  try {
    const findResource = dependencies.findResource ?? findResourceByPublicId;
    const resource = await findResource(idResult.data, dependencies);
    if (!resource) {
      return json7(
        { error: { code: "RESOURCE_NOT_FOUND", message: "The requested link could not be found." } },
        404
      );
    }
    if (resource.fileType !== "link" || resource.fileSize > maximumResourceLinkPayloadSize) {
      return json7(
        { error: { code: "RESOURCE_NOT_LINK", message: "The requested resource is not a public link." } },
        400
      );
    }
    const config = dependencies.config ?? getR2Config(dependencies.environment);
    const readLink = dependencies.readLink ?? (async (bucket, key2) => {
      const result = await createR2Client(config).send(
        new GetObjectCommand5({ Bucket: bucket, Key: key2 })
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
      headers: { ...responseHeaders, location: payload.url }
    });
  } catch {
    return json7(
      { error: { code: "LINK_UNAVAILABLE", message: "The link could not be opened. Please try again." } },
      503
    );
  }
}

// server/http/repositoryStructureHandler.ts
var headers5 = { "cache-control": "private, no-store", "content-type": "application/json; charset=utf-8" };
var json8 = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: headers5 });
var publicJson = (body) => new Response(JSON.stringify(body), {
  status: 200,
  headers: { ...headers5, "cache-control": "public, max-age=0, s-maxage=60" }
});
async function handleRepositoryStructureRequest(request, environment = process.env) {
  try {
    if (request.method !== "GET") return json8({ error: { code: "METHOD_NOT_ALLOWED", message: "Only GET is supported." } }, 405);
    return publicJson({ data: await readCachedPublicRepositoryStructure(environment) });
  } catch {
    return json8({ error: { code: "STRUCTURE_UNAVAILABLE", message: "Repository structure is unavailable." } }, 503);
  }
}
async function handleAdminRepositoryStructureRequest(request, environment = process.env, dependencies = {}) {
  let identity;
  try {
    identity = await authenticateAdminRequest(request, { environment });
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return json8({ error: { code: "FORBIDDEN", message: error.message } }, 403);
    return json8({ error: { code: "UNAUTHORIZED", message: "Authentication is required." } }, 401);
  }
  try {
    if (request.method === "GET") return json8({ data: await readRepositoryStructure(environment) });
    if (request.method !== "POST") return json8({ error: { code: "METHOD_NOT_ALLOWED", message: "Unsupported method." } }, 405);
    const payload = await request.json();
    const mutation = structureMutationSchema.safeParse(payload);
    if (!mutation.success) return json8({ error: { code: "INVALID_REQUEST", message: "The repository organization change is invalid." } }, 400);
    await (dependencies.audit ?? recordAuditEvent)({
      action: "structure.changed",
      actor: identity,
      target: mutation.data.action,
      outcome: "attempted"
    }, environment);
    return json8({ data: await mutateRepositoryStructure(mutation.data, environment) });
  } catch (error) {
    if (error instanceof RepositoryStructureConflictError) {
      return json8({ error: { code: "STRUCTURE_CONFLICT", message: error.message } }, 409);
    }
    return json8({ error: { code: "STRUCTURE_OPERATION_FAILED", message: "The repository organization could not be changed." } }, 400);
  }
}

// src/contracts/resourceUpload.ts
import { z as z14 } from "zod";
var maximumResourceFileSize = 25 * 1024 * 1024;
var resourceUploadFileDefinitions = {
  pdf: { mimeType: "application/pdf" },
  jpg: { mimeType: "image/jpeg" },
  jpeg: { mimeType: "image/jpeg" },
  png: { mimeType: "image/png" },
  webp: { mimeType: "image/webp" }
};
var resourceUploadMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp"
];
var resourceUploadMimeTypeSchema = z14.enum(resourceUploadMimeTypes);
var resourceUploadRequestSchema = z14.object({
  filename: resourceFilenameSchema,
  sectionId: repositorySectionIdSchema,
  categoryId: z14.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u).optional(),
  year: resourceYearSchema,
  mimeType: resourceUploadMimeTypeSchema,
  fileSize: z14.number().int().positive().max(maximumResourceFileSize)
});
var resourceUploadAuthorizationSchema = z14.object({
  data: z14.object({
    key: z14.string().min(1),
    uploadUrl: z14.url(),
    expiresInSeconds: z14.number().int().positive(),
    headers: z14.object({
      "content-type": z14.string().min(1),
      "if-none-match": z14.literal("*")
    })
  })
});
var resourceUploadCompletionRequestSchema = z14.object({
  key: z14.string().min(1).max(1024),
  mimeType: resourceUploadMimeTypeSchema,
  fileSize: z14.number().int().positive().max(maximumResourceFileSize)
});
var resourceUploadCompletionResponseSchema = z14.object({
  data: z14.object({
    key: z14.string().min(1),
    mimeType: z14.string().min(1),
    fileSize: z14.number().int().positive(),
    uploadedAt: z14.iso.datetime({ offset: true })
  })
});

// server/repository/authorizeResourceUpload.ts
import { HeadObjectCommand as HeadObjectCommand4, PutObjectCommand as PutObjectCommand5 } from "@aws-sdk/client-s3";
import { getSignedUrl as getSignedUrl3 } from "@aws-sdk/s3-request-presigner";
var uploadExpirationSeconds = 5 * 60;
var InvalidResourceUploadError = class extends Error {
};
var DuplicateResourceError = class extends Error {
};
function validateFilename(filename) {
  const extension = filename.split(".").pop()?.toLowerCase();
  const definition = extension ? resourceUploadFileDefinitions[extension] : void 0;
  if (!definition) {
    throw new InvalidResourceUploadError(
      "Only PDF documents and images can be uploaded."
    );
  }
  return { filename, definition };
}
async function authorizeResourceUpload(input, dependencies = {}) {
  const structure = dependencies.structure ?? (dependencies.environment ? await readRepositoryStructure(dependencies.environment) : repositorySections);
  const section = structure.find((item) => item.id === input.sectionId);
  if (!section) {
    throw new InvalidResourceUploadError(
      "The selected repository section is unavailable."
    );
  }
  if (input.categoryId && !section.categories.some((category) => category.id === input.categoryId)) {
    throw new InvalidResourceUploadError(
      "The selected category does not belong to the repository section."
    );
  }
  const validated = validateFilename(input.filename);
  if (validated.definition.mimeType !== input.mimeType) {
    throw new InvalidResourceUploadError(
      "The file MIME type does not match its extension."
    );
  }
  const config = dependencies.config ?? getR2Config(dependencies.environment);
  const key2 = input.categoryId ? `${input.sectionId}/${input.categoryId}/${input.year}/${validated.filename}` : `${input.sectionId}/${input.year}/${validated.filename}`;
  const client = createR2Client(config);
  const objectExists = dependencies.objectExists ?? (async (bucket, objectKey) => {
    try {
      await client.send(
        new HeadObjectCommand4({ Bucket: bucket, Key: objectKey })
      );
      return true;
    } catch (error) {
      const status = typeof error === "object" && error !== null && "$metadata" in error ? error.$metadata.httpStatusCode : void 0;
      if (status === 404) return false;
      throw error;
    }
  });
  if (await objectExists(config.bucketName, key2))
    throw new DuplicateResourceError(
      "A resource with this repository key already exists."
    );
  const createUploadUrl = dependencies.createUploadUrl ?? (async (_config, bucket, objectKey, mimeType, fileSize) => getSignedUrl3(
    client,
    new PutObjectCommand5({
      Bucket: bucket,
      Key: objectKey,
      ContentType: mimeType,
      ContentLength: fileSize,
      IfNoneMatch: "*"
    }),
    { expiresIn: uploadExpirationSeconds }
  ));
  return {
    key: key2,
    uploadUrl: await createUploadUrl(
      config,
      config.bucketName,
      key2,
      input.mimeType,
      input.fileSize
    ),
    expiresInSeconds: uploadExpirationSeconds,
    headers: { "content-type": input.mimeType, "if-none-match": "*" }
  };
}

// server/http/uploadAuthorizeHandler.ts
var headers6 = { "cache-control": "private, no-store", "content-type": "application/json; charset=utf-8" };
var json9 = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: headers6 });
async function handleUploadAuthorizeRequest(request, dependencies = {}) {
  if (request.method !== "POST") return json9({ error: { code: "METHOD_NOT_ALLOWED", message: "Only POST is supported." } }, 405);
  try {
    await authenticateAdminRequest(request, dependencies);
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return json9({ error: { code: "FORBIDDEN", message: error.message } }, 403);
    return json9({ error: { code: "UNAUTHORIZED", message: error instanceof AdminAuthenticationError ? error.message : "Authentication is required." } }, 401);
  }
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json9({ error: { code: "INVALID_REQUEST", message: "The request body must be valid JSON." } }, 400);
  }
  const result = resourceUploadRequestSchema.safeParse(payload);
  if (!result.success) return json9({ error: { code: "INVALID_UPLOAD", message: "The upload information is invalid.", details: result.error.issues.map((issue) => ({ field: issue.path.join(".") || "upload", message: issue.message })) } }, 400);
  try {
    return json9({ data: await authorizeResourceUpload(result.data, { environment: dependencies.environment, ...dependencies.upload }) });
  } catch (error) {
    if (error instanceof DuplicateResourceError) return json9({ error: { code: "DUPLICATE_RESOURCE", message: error.message } }, 409);
    if (error instanceof InvalidResourceUploadError) return json9({ error: { code: "INVALID_UPLOAD", message: error.message } }, 400);
    return json9({ error: { code: "UPLOAD_AUTHORIZATION_FAILED", message: "Upload authorization is temporarily unavailable." } }, 503);
  }
}

// server/repository/verifyResourceUpload.ts
import { HeadObjectCommand as HeadObjectCommand5 } from "@aws-sdk/client-s3";
var ResourceUploadVerificationError = class extends Error {
};
async function verifyResourceUpload(input, dependencies = {}) {
  const structure = dependencies.structure ?? (dependencies.environment ? await readRepositoryStructure(dependencies.environment) : repositorySections);
  const parsedKey = parseResourceObjectKey(input.key, structure);
  const uploadDefinition = resourceUploadFileDefinitions[parsedKey.extension];
  if (!uploadDefinition) {
    throw new ResourceUploadVerificationError(
      "Only PDF documents and images can be uploaded."
    );
  }
  if (uploadDefinition.mimeType !== input.mimeType || parsedKey.mimeType !== input.mimeType) {
    throw new ResourceUploadVerificationError(
      "The uploaded content type does not match the repository key."
    );
  }
  const config = dependencies.config ?? getR2Config(dependencies.environment);
  const client = createR2Client(config);
  const headObject = dependencies.headObject ?? (async (bucket, key2) => client.send(new HeadObjectCommand5({ Bucket: bucket, Key: key2 })));
  let object;
  try {
    object = await headObject(config.bucketName, parsedKey.key);
  } catch {
    throw new ResourceUploadVerificationError(
      "The uploaded object could not be found in the repository."
    );
  }
  if (object.ContentLength !== input.fileSize)
    throw new ResourceUploadVerificationError(
      "The uploaded file size does not match the authorized size."
    );
  if (object.ContentType !== input.mimeType)
    throw new ResourceUploadVerificationError(
      "The uploaded object content type is invalid."
    );
  if (!object.LastModified)
    throw new ResourceUploadVerificationError(
      "The repository did not provide an upload timestamp."
    );
  return {
    key: parsedKey.key,
    mimeType: object.ContentType,
    fileSize: object.ContentLength,
    uploadedAt: object.LastModified.toISOString()
  };
}

// server/http/uploadCompleteHandler.ts
var headers7 = { "cache-control": "private, no-store", "content-type": "application/json; charset=utf-8" };
var json10 = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: headers7 });
async function handleUploadCompleteRequest(request, dependencies = {}) {
  if (request.method !== "POST") return json10({ error: { code: "METHOD_NOT_ALLOWED", message: "Only POST is supported." } }, 405);
  let identity;
  try {
    identity = await authenticateAdminRequest(request, dependencies);
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return json10({ error: { code: "FORBIDDEN", message: error.message } }, 403);
    return json10({ error: { code: "UNAUTHORIZED", message: error instanceof AdminAuthenticationError ? error.message : "Authentication is required." } }, 401);
  }
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json10({ error: { code: "INVALID_REQUEST", message: "The request body must be valid JSON." } }, 400);
  }
  const result = resourceUploadCompletionRequestSchema.safeParse(payload);
  if (!result.success) return json10({ error: { code: "INVALID_UPLOAD_COMPLETION", message: "The upload completion information is invalid." } }, 400);
  try {
    const resource = await verifyResourceUpload(result.data, { environment: dependencies.environment, ...dependencies.verification });
    await (dependencies.audit ?? recordAuditEvent)({
      action: "resource.uploaded",
      actor: identity,
      target: resource.key,
      outcome: "succeeded",
      details: { fileSize: resource.fileSize, mimeType: resource.mimeType },
      idempotencyKey: `${resource.key}:${resource.uploadedAt}`
    }, dependencies.environment);
    return json10({ data: resource });
  } catch (error) {
    return json10({ error: { code: "UPLOAD_VERIFICATION_FAILED", message: error instanceof ResourceUploadVerificationError ? error.message : "The upload could not be completed. Please try again." } }, 422);
  }
}

// server/security/apiRateLimit.ts
var windowMs = 6e4;
var counters = /* @__PURE__ */ new Map();
function requestLimit(path) {
  if (path === "/api/resources" || path === "/api/repository-structure") return 60;
  if (path === "/api/resource-preview" || path === "/api/resource-link") return 30;
  if (path === "/api/accomplishments" || path === "/api/opcr") return 30;
  if (path === "/api/admin/session" || path === "/api/admin/users") return 30;
  return path.startsWith("/api/admin/") ? 120 : 60;
}
function checkApiRateLimit(request, path, now = Date.now()) {
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!clientIp || clientIp.length > 64) return null;
  const key2 = `${clientIp}:${path}`;
  const current = counters.get(key2);
  const next = !current || current.resetAt <= now ? { count: 1, resetAt: now + windowMs } : { count: current.count + 1, resetAt: current.resetAt };
  counters.set(key2, next);
  if (counters.size > 4096) counters.delete(counters.keys().next().value);
  if (next.count <= requestLimit(path)) return null;
  return new Response(JSON.stringify({
    error: { code: "RATE_LIMITED", message: "Too many requests. Please try again shortly." }
  }), {
    status: 429,
    headers: {
      "cache-control": "private, no-store",
      "content-type": "application/json; charset=utf-8",
      "retry-after": String(Math.max(1, Math.ceil((next.resetAt - now) / 1e3)))
    }
  });
}

// server/apiEntry.ts
var rewrittenApiPathParameter = "__apiPath";
var routes = {
  "/api/resources": handleResourcesRequest,
  "/api/resource-preview": handlePublicResourcePreviewRequest,
  "/api/resource-link": handlePublicResourceLinkRequest,
  "/api/repository-structure": handleRepositoryStructureRequest,
  "/api/accomplishments": handlePublicAccomplishmentResourceRequest,
  "/api/opcr": handlePublicOpcrResourceRequest,
  "/api/admin/session": handleAdminSessionRequest,
  "/api/admin/resources": handleAdminResourcesRequest,
  "/api/admin/resources/upload-authorize": handleUploadAuthorizeRequest,
  "/api/admin/resources/upload-complete": handleUploadCompleteRequest,
  "/api/admin/resource": handleAdminResourceMutationRequest,
  "/api/admin/resource-access": handleAdminResourceAccessRequest,
  "/api/admin/repository-structure": handleAdminRepositoryStructureRequest,
  "/api/admin/accomplishment-resource": handleAccomplishmentResourceRequest,
  "/api/admin/opcr-resource": handleOpcrResourceRequest,
  "/api/admin/users": handleAdminUsersRequest
};
function notFound() {
  return new Response(
    JSON.stringify({
      error: {
        code: "NOT_FOUND",
        message: "The requested endpoint does not exist."
      }
    }),
    {
      status: 404,
      headers: {
        "cache-control": "private, no-store",
        "content-type": "application/json; charset=utf-8"
      }
    }
  );
}
function resolveApiPath(request) {
  const url = new URL(request.url);
  const rewrittenPath = url.searchParams.get(rewrittenApiPathParameter);
  if (rewrittenPath === null) return url.pathname;
  const normalizedPath = rewrittenPath.replace(/^\/+|\/+$/gu, "");
  return normalizedPath ? `/api/${normalizedPath}` : "/api";
}
var apiEntry_default = {
  fetch(request) {
    const path = resolveApiPath(request);
    const handler = routes[path];
    if (!handler) return notFound();
    return checkApiRateLimit(request, path) ?? handler(request);
  }
};
export {
  apiEntry_default as default,
  resolveApiPath
};
