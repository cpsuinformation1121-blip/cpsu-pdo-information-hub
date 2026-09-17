import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { adminResourceAccessRequestSchema } from '../../src/contracts/adminResourceAccess.ts'
import {
  AdminAuthenticationError,
  AdminAuthorizationError,
  authenticateAdminRequest,
  type AdminAuthenticationDependencies,
} from '../auth/authenticateAdminRequest.ts'
import { getR2Config, type R2Config } from '../config/r2.ts'
import { createR2Client } from '../repository/r2Client.ts'
import { parseResourceObjectKey } from '../repository/parseResourceObjectKey.ts'
import { readRepositoryStructure } from '../repository/repositoryStructureStore.ts'
import { recordAuditEvent } from '../security/auditLog.ts'

const accessLifetimeSeconds = 60
const headers = {
  'cache-control': 'private, no-store',
  'content-type': 'application/json; charset=utf-8',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers })

type StructureSection = {
  id: string
  title: string
  categories: readonly { id: string; title: string }[]
}

type AdminResourceAccessDependencies = AdminAuthenticationDependencies & {
  audit?: typeof recordAuditEvent
  config?: R2Config
  now?: () => Date
  sign?: (command: GetObjectCommand, expiresIn: number) => Promise<string>
  structure?: readonly StructureSection[]
}

function authenticationFailure(error: unknown) {
  if (error instanceof AdminAuthorizationError) {
    return json({ error: { code: 'FORBIDDEN', message: error.message } }, 403)
  }
  return json({
    error: {
      code: 'UNAUTHORIZED',
      message: error instanceof AdminAuthenticationError
        ? error.message
        : 'Authentication is required.',
    },
  }, 401)
}

function createContentDisposition(
  mode: 'preview' | 'download',
  filename: string,
) {
  const type = mode === 'download' ? 'attachment' : 'inline'
  const utf8Prefix = 'UTF-8' + String.fromCharCode(39, 39)
  return type + '; filename*=' + utf8Prefix + encodeURIComponent(filename)
}

export async function handleAdminResourceAccessRequest(
  request: Request,
  dependencies: AdminResourceAccessDependencies = {},
) {
  if (request.method !== 'POST') {
    return json(
      { error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST is supported.' } },
      405,
    )
  }

  let identity
  try {
    identity = await authenticateAdminRequest(request, dependencies)
  } catch (error) {
    return authenticationFailure(error)
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return json({
      error: {
        code: 'INVALID_REQUEST',
        message: 'The request body must be valid JSON.',
      },
    }, 400)
  }

  const result = adminResourceAccessRequestSchema.safeParse(payload)
  if (!result.success) {
    return json({
      error: {
        code: 'INVALID_REQUEST',
        message: 'The file access request is invalid.',
      },
    }, 400)
  }

  try {
    const structure = dependencies.structure ??
      await readRepositoryStructure(dependencies.environment)
    const resource = parseResourceObjectKey(result.data.key, structure)
    if (resource.fileType === 'link') {
      return json({
        error: {
          code: 'RESOURCE_NOT_FILE',
          message: 'Links must be opened with the link action.',
        },
      }, 400)
    }
    if (result.data.mode === 'preview' && resource.fileType === 'xlsx') {
      return json({
        error: {
          code: 'RESOURCE_NOT_PREVIEWABLE',
          message: 'This file type is available for staff download only.',
        },
      }, 400)
    }

    const config = dependencies.config ?? getR2Config(dependencies.environment)
    const client = createR2Client(config)
    const command = new GetObjectCommand({
      Bucket: config.bucketName,
      Key: resource.key,
      ResponseCacheControl: 'private, no-store',
      ResponseContentDisposition: createContentDisposition(
        result.data.mode,
        resource.filename,
      ),
      ResponseContentType: resource.mimeType,
    })
    const sign = dependencies.sign ??
      ((input, expiresIn) => getSignedUrl(client, input, { expiresIn }))
    const url = await sign(command, accessLifetimeSeconds)
    await (dependencies.audit ?? recordAuditEvent)({
      action: 'resource.accessed',
      actor: identity,
      target: resource.key,
      outcome: 'succeeded',
      details: { mode: result.data.mode },
    }, dependencies.environment)

    const now = dependencies.now?.() ?? new Date()
    return json({
      data: {
        url,
        expiresAt: new Date(
          now.getTime() + accessLifetimeSeconds * 1_000,
        ).toISOString(),
      },
    })
  } catch {
    return json({
      error: {
        code: 'FILE_ACCESS_UNAVAILABLE',
        message: 'The file could not be opened. Please try again.',
      },
    }, 503)
  }
}
