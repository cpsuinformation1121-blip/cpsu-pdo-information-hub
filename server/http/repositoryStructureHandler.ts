import { readLimitedJson, jsonBodyErrorResponse } from './readLimitedJson.ts'
import { structureMutationSchema } from '../../src/contracts/repositoryStructure.ts'
import { AdminAuthorizationError, authenticateAdminRequest } from '../auth/authenticateAdminRequest.ts'
import {
  mutateRepositoryStructure,
  readCachedPublicRepositoryStructure,
  readRepositoryStructure,
  RepositoryStructureConflictError,
} from '../repository/repositoryStructureStore.ts'
import { recordAuditEvent } from '../security/auditLog.ts'

const headers = { 'cache-control': 'private, no-store', 'content-type': 'application/json; charset=utf-8' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers })
const publicJson = (body: unknown) => new Response(JSON.stringify(body), {
  status: 200,
  headers: { ...headers, 'cache-control': 'public, max-age=0, s-maxage=60' },
})

export async function handleRepositoryStructureRequest(
  request: Request,
  environment: NodeJS.ProcessEnv = process.env,
) {
  try {
    if (request.method !== 'GET') return json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET is supported.' } }, 405)
    return publicJson({ data: await readCachedPublicRepositoryStructure(environment) })
  } catch {
    return json({ error: { code: 'STRUCTURE_UNAVAILABLE', message: 'Repository structure is unavailable.' } }, 503)
  }
}

type StructureHandlerDependencies = {
  audit?: typeof recordAuditEvent
}

export async function handleAdminRepositoryStructureRequest(
  request: Request,
  environment: NodeJS.ProcessEnv = process.env,
  dependencies: StructureHandlerDependencies = {},
) {
  let identity
  try {
    identity = await authenticateAdminRequest(request, { environment })
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return json({ error: { code: 'FORBIDDEN', message: error.message } }, 403)
    return json({ error: { code: 'UNAUTHORIZED', message: 'Authentication is required.' } }, 401)
  }

  try {
    if (request.method === 'GET') return json({ data: await readRepositoryStructure(environment) })
    if (request.method !== 'POST') return json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Unsupported method.' } }, 405)

    const payload: unknown = await readLimitedJson(request, 16 * 1024)
    const mutation = structureMutationSchema.safeParse(payload)
    if (!mutation.success) return json({ error: { code: 'INVALID_REQUEST', message: 'The repository organization change is invalid.' } }, 400)
    await (dependencies.audit ?? recordAuditEvent)({
      action: 'structure.changed',
      actor: identity,
      target: mutation.data.action,
      outcome: 'attempted',
    }, environment)
    return json({ data: await mutateRepositoryStructure(mutation.data, environment) })
  } catch (error) {
    const bodyError = jsonBodyErrorResponse(error)
    if (bodyError) return bodyError
    if (error instanceof RepositoryStructureConflictError) {
      return json({ error: { code: 'STRUCTURE_CONFLICT', message: error.message } }, 409)
    }
    return json({ error: { code: 'STRUCTURE_OPERATION_FAILED', message: 'The repository organization could not be changed.' } }, 400)
  }
}
