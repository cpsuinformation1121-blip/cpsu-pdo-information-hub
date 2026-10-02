import { readLimitedJson, jsonBodyErrorResponse } from './readLimitedJson.ts'
import { CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { resourceDeleteSchema, resourceEditSchema, resourceRenameSchema } from '../../src/contracts/adminOperations.ts'
import { resourceLinkCreateSchema } from '../../src/contracts/resourceLink.ts'
import { resourceFileDefinitions } from '../../src/contracts/resource.ts'
import {
  AdminAuthenticationError,
  AdminAuthorizationError,
  authenticateAdminRequest,
  type AdminAuthenticationDependencies,
} from '../auth/authenticateAdminRequest.ts'
import { getR2Config } from '../config/r2.ts'
import type { R2Config } from '../config/r2.ts'
import { createR2Client } from '../repository/r2Client.ts'
import { isR2NotFound, isR2PreconditionFailed } from '../repository/r2Errors.ts'
import { InvalidResourceObjectKeyError, parseResourceObjectKey } from '../repository/parseResourceObjectKey.ts'
import { readRepositoryStructure } from '../repository/repositoryStructureStore.ts'
import { invalidatePublicResourceCache } from '../repository/listResources.ts'
import { recordAuditEvent } from '../security/auditLog.ts'

const headers = { 'cache-control': 'private, no-store', 'content-type': 'application/json; charset=utf-8' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers })

type ResourceMutationDependencies = AdminAuthenticationDependencies & {
  audit?: typeof recordAuditEvent
  config?: R2Config
  structure?: readonly {
    id: string
    title: string
    categories: readonly { id: string; title: string }[]
  }[]
  send?: (command: HeadObjectCommand | CopyObjectCommand | DeleteObjectCommand | PutObjectCommand) => Promise<unknown>
}

function addDestinationMustNotExist(command: CopyObjectCommand) {
  command.middlewareStack.add(
    (next) => async (arguments_) => {
      const request = arguments_.request as { headers?: Record<string, string> }
      if (request.headers) request.headers['cf-copy-destination-if-none-match'] = '*'
      return next(arguments_)
    },
    { step: 'build', name: 'r2CopyDestinationMustNotExist' },
  )
  return command
}

function authenticationFailure(error: unknown) {
  if (error instanceof AdminAuthorizationError) {
    return json({ error: { code: 'FORBIDDEN', message: error.message } }, 403)
  }
  return json({ error: { code: 'UNAUTHORIZED', message: error instanceof AdminAuthenticationError ? error.message : 'Authentication is required.' } }, 401)
}

export async function handleAdminResourceMutationRequest(
  request: Request,
  dependencies: ResourceMutationDependencies = {},
) {
  if (!['POST', 'PATCH', 'DELETE'].includes(request.method)) return json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST, PATCH, and DELETE are supported.' } }, 405)
  let identity
  try {
    identity = await authenticateAdminRequest(request, dependencies)
  } catch (error) {
    return authenticationFailure(error)
  }

  let payload: unknown
  try { payload = await readLimitedJson(request, 16 * 1024) } catch (error) { return jsonBodyErrorResponse(error) ?? json({ error: { code: 'INVALID_REQUEST', message: 'The request body must be valid JSON.' } }, 400) }
  try {
    const config = dependencies.config ?? getR2Config(dependencies.environment)
    const client = createR2Client(config)
    const send = dependencies.send ?? ((command) => {
      if (command instanceof HeadObjectCommand) return client.send(command)
      if (command instanceof CopyObjectCommand) return client.send(command)
      if (command instanceof PutObjectCommand) return client.send(command)
      return client.send(command)
    })
    const audit = dependencies.audit ?? recordAuditEvent

    const structure = dependencies.structure ?? await readRepositoryStructure(dependencies.environment)
    if (request.method === 'POST') {
      const result = resourceLinkCreateSchema.safeParse(payload)
      if (!result.success) return json({ error: { code: 'INVALID_REQUEST', message: 'The link details are invalid.', details: result.error.issues.map((issue) => ({ field: issue.path.join('.') || 'link', message: issue.message })) } }, 400)
      const section = structure.find((item) => item.id === result.data.sectionId)
      if (!section) return json({ error: { code: 'INVALID_SECTION', message: 'The selected repository section is unavailable.' } }, 400)
      if (result.data.categoryId && !section.categories.some((category) => category.id === result.data.categoryId)) {
        return json({ error: { code: 'INVALID_CATEGORY', message: 'The selected category does not belong to the repository section.' } }, 400)
      }

      const filename = `${result.data.name}.link`
      const targetKey = result.data.categoryId
        ? `${result.data.sectionId}/${result.data.categoryId}/${result.data.year}/${filename}`
        : `${result.data.sectionId}/${result.data.year}/${filename}`
      await audit({
        action: 'resource.uploaded',
        actor: identity,
        target: targetKey,
        outcome: 'attempted',
        details: { resourceType: 'link' },
      }, dependencies.environment)
      try {
        await send(new PutObjectCommand({
          Bucket: config.bucketName,
          Key: targetKey,
          Body: JSON.stringify({ url: result.data.url }),
          ContentType: resourceFileDefinitions.link.mimeType,
          CacheControl: 'private, no-store',
          IfNoneMatch: '*',
        }))
      } catch (error) {
        if (isR2PreconditionFailed(error)) {
          return json({ error: { code: 'DUPLICATE_RESOURCE', message: 'A link with that name already exists in this location.' } }, 409)
        }
        throw error
      }
      invalidatePublicResourceCache()
      return json({ data: { key: targetKey } }, 201)
    }

    if (request.method === 'DELETE') {
      const result = resourceDeleteSchema.safeParse(payload)
      if (!result.success) return json({ error: { code: 'INVALID_REQUEST', message: 'The deletion request is invalid.' } }, 400)
      const parsed = parseResourceObjectKey(result.data.key, structure)
      if (parsed.filename !== result.data.confirmation) return json({ error: { code: 'CONFIRMATION_MISMATCH', message: 'The deletion confirmation does not match this file.' } }, 400)
      await audit({ action: 'resource.deleted', actor: identity, target: parsed.key, outcome: 'attempted' }, dependencies.environment)
      await send(new DeleteObjectCommand({ Bucket: config.bucketName, Key: parsed.key }))
      invalidatePublicResourceCache()
      return json({ data: { key: parsed.key } })
    }

    if (request.method === 'PATCH' && typeof payload === 'object' && payload !== null && 'action' in payload && payload.action === 'edit') {
      const result = resourceEditSchema.safeParse(payload)
      if (!result.success) return json({ error: { code: 'INVALID_REQUEST', message: 'The resource details are invalid.' } }, 400)
      const parsed = parseResourceObjectKey(result.data.key, structure)
      const section = structure.find((item) => item.id === result.data.sectionId)
      if (!section) return json({ error: { code: 'INVALID_SECTION', message: 'The selected repository section is unavailable.' } }, 400)
      if (result.data.categoryId && !section.categories.some((item) => item.id === result.data.categoryId)) {
        return json({ error: { code: 'INVALID_CATEGORY', message: 'The selected category does not belong to the repository section.' } }, 400)
      }
      // Preserve a legacy nested category path when its section/category is unchanged.
      const categoryPath = result.data.sectionId === parsed.sectionId && result.data.categoryId === parsed.categoryId
        ? parsed.categoryPath
        : result.data.categoryId ? [result.data.categoryId] : []
      const targetKey = [result.data.sectionId, ...categoryPath, result.data.year, parsed.filename].join('/')
      parseResourceObjectKey(targetKey, structure)
      const source = await send(new HeadObjectCommand({ Bucket: config.bucketName, Key: parsed.key })) as {
        Metadata?: Record<string, string>; ETag?: string; ContentType?: string;
        CacheControl?: string; ContentDisposition?: string; ContentEncoding?: string;
        ContentLanguage?: string; Expires?: Date;
      }
      if (targetKey !== parsed.key) {
        try {
          await send(new HeadObjectCommand({ Bucket: config.bucketName, Key: targetKey }))
          return json({ error: { code: 'DUPLICATE_RESOURCE', message: 'A resource with that filename already exists in the selected location.' } }, 409)
        } catch (error) { if (!isR2NotFound(error)) throw error }
      }
      await audit({
        action: 'resource.updated', actor: identity, target: parsed.key, outcome: 'attempted',
        details: { destinationKey: targetKey },
      }, dependencies.environment)
      const copy = new CopyObjectCommand({
        Bucket: config.bucketName, Key: targetKey,
        CopySource: `${config.bucketName}/${encodeURIComponent(parsed.key).replace(/%2F/gu, '/')}`,
        CopySourceIfMatch: source.ETag,
        MetadataDirective: 'REPLACE',
        Metadata: { ...source.Metadata, 'display-name': encodeURIComponent(result.data.displayName) },
        ContentType: source.ContentType ?? parsed.mimeType,
        CacheControl: source.CacheControl,
        ContentDisposition: source.ContentDisposition,
        ContentEncoding: source.ContentEncoding,
        ContentLanguage: source.ContentLanguage,
        Expires: source.Expires,
      })
      try { await send(targetKey === parsed.key ? copy : addDestinationMustNotExist(copy)) } catch (error) {
        if (isR2PreconditionFailed(error)) return json({ error: { code: 'RESOURCE_CONFLICT', message: 'The resource or destination changed while saving. Refresh and try again.' } }, 409)
        throw error
      }
      if (targetKey !== parsed.key) await send(new DeleteObjectCommand({ Bucket: config.bucketName, Key: parsed.key }))
      invalidatePublicResourceCache()
      return json({ data: { key: targetKey } })
    }

    if (request.method === 'PATCH') {
      const result = resourceRenameSchema.safeParse(payload)
      if (!result.success) return json({ error: { code: 'INVALID_REQUEST', message: 'The rename request is invalid.' } }, 400)
      const parsed = parseResourceObjectKey(result.data.key, structure)
      const extension = parsed.filename.split('.').pop()?.toLowerCase()
      if (result.data.filename.split('.').pop()?.toLowerCase() !== extension) return json({ error: { code: 'INVALID_EXTENSION', message: 'Renaming cannot change the file type.' } }, 400)
      const targetKey = [parsed.sectionId, ...parsed.categoryPath, parsed.year, result.data.filename].join('/')
      parseResourceObjectKey(targetKey, structure)

      try {
        await send(new HeadObjectCommand({ Bucket: config.bucketName, Key: targetKey }))
        return json({ error: { code: 'DUPLICATE_RESOURCE', message: 'A resource with that filename already exists.' } }, 409)
      } catch (error) {
        if (!isR2NotFound(error)) throw error
      }

      await audit({
        action: 'resource.renamed',
        actor: identity,
        target: parsed.key,
        outcome: 'attempted',
        details: { destinationKey: targetKey },
      }, dependencies.environment)

      const copy = addDestinationMustNotExist(new CopyObjectCommand({
        Bucket: config.bucketName,
        CopySource: `${config.bucketName}/${encodeURIComponent(parsed.key).replace(/%2F/gu, '/')}`,
        Key: targetKey,
      }))
      try {
        await send(copy)
      } catch (error) {
        if (isR2PreconditionFailed(error)) {
          return json({ error: { code: 'DUPLICATE_RESOURCE', message: 'A resource with that filename was created before the rename completed.' } }, 409)
        }
        throw error
      }
      await send(new DeleteObjectCommand({ Bucket: config.bucketName, Key: parsed.key }))
      invalidatePublicResourceCache()
      return json({ data: { key: targetKey } })
    }

    return json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST, PATCH, and DELETE are supported.' } }, 405)
  } catch (error) {
    if (error instanceof InvalidResourceObjectKeyError) return json({ error: { code: 'INVALID_REQUEST', message: 'The resource location is invalid.' } }, 400)
    if (isR2NotFound(error)) return json({ error: { code: 'NOT_FOUND', message: 'This resource is no longer available. Refresh and try again.' } }, 404)
    return json({ error: { code: 'RESOURCE_OPERATION_FAILED', message: 'The repository operation could not be completed.' } }, 500)
  }
}
