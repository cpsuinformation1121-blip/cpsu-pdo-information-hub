import { GetObjectCommand, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3'
import { repositorySections } from '../../src/config/repository.ts'
import { repositoryStructureSchema, structureMutationSchema, type ManagedSection } from '../../src/contracts/repositoryStructure.ts'
import { getR2Config } from '../config/r2.ts'
import { createR2Client } from './r2Client.ts'
import { isR2NotFound, isR2PreconditionFailed } from './r2Errors.ts'

const key = '_system/repository-structure.json'
const defaults = repositorySections.map(({ id, title, categories }) => ({
  id,
  title,
  categories: categories.map(({ id: categoryId, title: categoryTitle }) => ({ id: categoryId, title: categoryTitle })),
}))

const requiredSectionIds = ['forms'] as const

/**
 * Applies additive structure migrations to repositories created by an older
 * deployment. Existing administrator-managed sections and categories are
 * preserved exactly as stored.
 */
export function applyRequiredStructureMigrations(
  structure: ManagedSection[],
): ManagedSection[] {
  const migrated = structuredClone(structure)

  for (const id of requiredSectionIds) {
    const requiredSection = defaults.find((section) => section.id === id)
    if (!requiredSection) continue

    const existingSection = migrated.find((section) => section.id === id)
    if (!existingSection) {
      migrated.push(structuredClone(requiredSection))
      continue
    }

    for (const requiredCategory of requiredSection.categories) {
      if (
        !existingSection.categories.some(
          (category) => category.id === requiredCategory.id,
        )
      ) {
        existingSection.categories.push(structuredClone(requiredCategory))
      }
    }
  }

  return migrated
}

type RepositoryStructureSnapshot = {
  data: ManagedSection[]
  etag: string | null
}

export class RepositoryStructureConflictError extends Error {
  constructor() {
    super('The repository organization changed while you were editing it. Refresh the page and try again.')
    this.name = 'RepositoryStructureConflictError'
  }
}

const slug = (value: string) => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/gu, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/gu, '-')
  .replace(/^-+|-+$/gu, '')
  .slice(0, 70)

async function bodyText(body: unknown) {
  if (body && typeof body === 'object' && 'transformToString' in body && typeof body.transformToString === 'function') {
    return body.transformToString()
  }
  throw new Error('Invalid structure body.')
}

async function readRepositoryStructureSnapshot(
  environment: NodeJS.ProcessEnv = process.env,
): Promise<RepositoryStructureSnapshot> {
  const config = getR2Config(environment)
  const client = createR2Client(config)
  try {
    const object = await client.send(new GetObjectCommand({ Bucket: config.bucketName, Key: key }))
    if (!object.ETag) throw new Error('Repository structure revision is unavailable.')
    return {
      data: applyRequiredStructureMigrations(
        repositoryStructureSchema.parse(JSON.parse(await bodyText(object.Body))).data,
      ),
      etag: object.ETag,
    }
  } catch (error) {
    if (isR2NotFound(error)) return { data: structuredClone(defaults), etag: null }
    throw error
  }
}

export async function readRepositoryStructure(
  environment: NodeJS.ProcessEnv = process.env,
): Promise<ManagedSection[]> {
  return (await readRepositoryStructureSnapshot(environment)).data
}

async function writeRepositoryStructure(
  data: ManagedSection[],
  etag: string | null,
  environment: NodeJS.ProcessEnv,
) {
  const config = getR2Config(environment)
  try {
    await createR2Client(config).send(createRepositoryStructureWriteCommand(
      config.bucketName,
      data,
      etag,
    ))
  } catch (error) {
    if (isR2PreconditionFailed(error)) throw new RepositoryStructureConflictError()
    throw error
  }
  return data
}

export function createRepositoryStructureWriteCommand(
  bucketName: string,
  data: ManagedSection[],
  etag: string | null,
) {
  return new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: JSON.stringify({ data }),
    ContentType: 'application/json',
    CacheControl: 'no-store',
    ...(etag ? { IfMatch: etag } : { IfNoneMatch: '*' }),
  })
}

async function prefixHasFiles(prefix: string, environment: NodeJS.ProcessEnv) {
  const config = getR2Config(environment)
  const result = await createR2Client(config).send(new ListObjectsV2Command({
    Bucket: config.bucketName,
    Prefix: prefix,
    MaxKeys: 1,
  }))
  return Boolean(result.Contents?.length)
}

export async function mutateRepositoryStructure(
  payload: unknown,
  environment: NodeJS.ProcessEnv = process.env,
) {
  const mutation = structureMutationSchema.parse(payload)
  const snapshot = await readRepositoryStructureSnapshot(environment)
  const data = structuredClone(snapshot.data)
  const uniqueId = (title: string, used: string[]) => {
    const base = slug(title)
    if (!base) throw new Error('Enter a usable title.')
    let id = base
    let index = 2
    while (used.includes(id)) id = `${base}-${index++}`
    return id
  }

  if (mutation.action === 'add-section') {
    data.push({ id: uniqueId(mutation.title, data.map((item) => item.id)), title: mutation.title, categories: [] })
  }
  if (mutation.action === 'rename-section') {
    const item = data.find((section) => section.id === mutation.id)
    if (!item) throw new Error('Section not found.')
    item.title = mutation.title
  }
  if (mutation.action === 'delete-section') {
    const index = data.findIndex((section) => section.id === mutation.id)
    if (index < 0) throw new Error('Section not found.')
    if (data[index].categories.length || await prefixHasFiles(`${mutation.id}/`, environment)) {
      throw new Error('Remove all categories and files before deleting this section.')
    }
    data.splice(index, 1)
  }
  if ('sectionId' in mutation) {
    const section = data.find((item) => item.id === mutation.sectionId)
    if (!section) throw new Error('Section not found.')
    if (mutation.action === 'add-category') {
      section.categories.push({
        id: uniqueId(mutation.title, data.flatMap((item) => item.categories.map((category) => category.id))),
        title: mutation.title,
      })
    }
    if (mutation.action === 'rename-category') {
      const category = section.categories.find((item) => item.id === mutation.id)
      if (!category) throw new Error('Category not found.')
      category.title = mutation.title
    }
    if (mutation.action === 'delete-category') {
      const index = section.categories.findIndex((item) => item.id === mutation.id)
      if (index < 0) throw new Error('Category not found.')
      if (await prefixHasFiles(`${section.id}/${mutation.id}/`, environment)) {
        throw new Error('Delete or move all files before deleting this category.')
      }
      section.categories.splice(index, 1)
    }
  }

  return writeRepositoryStructure(data, snapshot.etag, environment)
}
